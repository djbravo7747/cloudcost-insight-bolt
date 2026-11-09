import { useMemo, useState } from 'react';
import { BellOff, BellRing, Wallet } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBillingRecords, getBudgets } from '@/services/api';
import { buildBudgetRows, type BudgetRow } from '@/lib/analytics';
import { formatCurrency, formatNumber, formatSignedCurrency } from '@/lib/format';
import { Card, CardHeader } from '@/components/common/Card';
import { SelectField } from '@/components/common/FormControls';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StatusBadge, budgetTone, utilizationTone } from '@/components/common/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';

function loadBudgets(billingMonth: string) {
  return async () => {
    const [records, budgets] = await Promise.all([getBillingRecords(), getBudgets()]);
    return { records, budgets, billingMonth };
  };
}

export function BudgetsPage() {
  const { billingMonth, projectFilter, searchQuery, alertThresholds, mutedBudgetIds, toggleBudgetAlert } = useAppState();
  const { data, error, loading, reload } = useAsyncData(loadBudgets(billingMonth), [billingMonth]);
  const [scopeFilter, setScopeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const rows = useMemo<BudgetRow[]>(() => {
    if (!data) return [];
    return buildBudgetRows(data.budgets, data.records, billingMonth, alertThresholds);
  }, [data, billingMonth, alertThresholds]);

  const visibleRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows
      .filter((row) => scopeFilter === 'all' || row.budget.scope === scopeFilter)
      .filter((row) => statusFilter === 'all' || row.status === statusFilter)
      .filter((row) => projectFilter === 'all' || (row.budget.scope === 'Project' && row.budget.targetId === projectFilter))
      .filter((row) => !query || row.budget.name.toLowerCase().includes(query));
  }, [rows, scopeFilter, statusFilter, projectFilter, searchQuery]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <LoadingState label="Loading budgets" />;

  const projectRows = rows.filter((row) => row.budget.scope === 'Project');
  const totalBudget = projectRows.reduce((total, row) => total + row.budget.monthlyBudget, 0);
  const totalActual = projectRows.reduce((total, row) => total + row.actual, 0);
  const isAlerting = (row: BudgetRow) => row.status !== 'On track' && !mutedBudgetIds.includes(row.budget.id);
  const activeAlerts = rows.filter(isAlerting).length;
  const overBudget = rows.filter((row) => row.status === 'Over budget').length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Project budgets" value={formatCurrency(totalBudget)} helper="Combined monthly project budgets" />
        <Tile
          label="Actual project spend"
          value={formatCurrency(totalActual)}
          helper={totalBudget > 0 ? `${((totalActual / totalBudget) * 100).toFixed(1)}% of project budgets` : 'No project budgets'}
        />
        <Tile
          label="Over-budget alerts"
          value={formatNumber(overBudget)}
          helper="Budgets at or above the critical threshold"
          valueClass={overBudget > 0 ? 'text-red-600' : 'text-slate-900'}
        />
        <Tile
          label="Active alerts"
          value={formatNumber(activeAlerts)}
          helper={mutedBudgetIds.length > 0 ? `${mutedBudgetIds.length} muted` : 'No muted alerts'}
          valueClass={activeAlerts > 0 ? 'text-amber-700' : 'text-slate-900'}
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader
          title="Budget monitor"
          subtitle={`Warning at ${alertThresholds.warningPercent}% and over budget at ${alertThresholds.criticalPercent}% of the monthly budget`}
          action={
            <>
              <SelectField
                label="Scope"
                value={scopeFilter}
                onChange={setScopeFilter}
                options={[
                  { value: 'all', label: 'All budgets' },
                  { value: 'Project', label: 'Project budgets' },
                  { value: 'Service', label: 'Service budgets' },
                ]}
              />
              <SelectField
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'On track', label: 'On track' },
                  { value: 'Warning', label: 'Warning' },
                  { value: 'Over budget', label: 'Over budget' },
                ]}
              />
            </>
          }
        />
        {visibleRows.length === 0 ? (
          <EmptyState icon={Wallet} title="No matching budgets" description="Change the scope or status filter, or clear the search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Budget</th>
                  <th className="px-5 py-3 text-right">Monthly budget</th>
                  <th className="px-5 py-3 text-right">Actual</th>
                  <th className="px-5 py-3 text-right">Variance</th>
                  <th className="min-w-44 px-5 py-3">Utilization</th>
                  <th className="px-5 py-3">Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row) => {
                  const muted = mutedBudgetIds.includes(row.budget.id);
                  return (
                    <tr key={row.budget.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{row.budget.name}</p>
                        <p className="text-xs text-slate-500">{row.budget.scope} budget</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right tabular-nums text-slate-600">
                        {formatCurrency(row.budget.monthlyBudget)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right tabular-nums text-slate-900">{formatCurrency(row.actual)}</td>
                      <td
                        className={`whitespace-nowrap px-5 py-3.5 text-right font-medium tabular-nums ${row.variance > 0 ? 'text-red-600' : 'text-emerald-700'}`}
                      >
                        {formatSignedCurrency(row.variance)}
                      </td>
                      <td className="px-5 py-3.5">
                        <ProgressBar
                          value={row.utilization}
                          tone={utilizationTone(row.utilization, alertThresholds.warningPercent, alertThresholds.criticalPercent)}
                        />
                        <div className="mt-1">
                          <StatusBadge tone={budgetTone(row.status)}>{row.status}</StatusBadge>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {row.status === 'On track' ? (
                          <span className="text-xs text-slate-400">Not needed</span>
                        ) : (
                          <button
                            type="button"
                            aria-pressed={muted}
                            onClick={() => toggleBudgetAlert(row.budget.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            {muted ? <BellOff className="h-3.5 w-3.5" aria-hidden="true" /> : <BellRing className="h-3.5 w-3.5" aria-hidden="true" />}
                            {muted ? 'Muted - unmute' : 'Mute alert'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-xs text-slate-500">
        Variance is actual cost minus budget (positive means over budget). Utilization is actual cost divided by budget, times 100.
      </p>
    </div>
  );
}

function Tile({ label, value, helper, valueClass = 'text-slate-900' }: { label: string; value: string; helper: string; valueClass?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </Card>
  );
}
