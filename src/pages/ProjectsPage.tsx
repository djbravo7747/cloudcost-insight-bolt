import { useMemo, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBillingRecords, getBudgets, getProjects, getResources } from '@/services/api';
import { BILLING_MONTHS } from '@/data/sampleCatalog';
import { buildResourceSummaries, filterBillingRecords, getBudgetStatus, sumCost } from '@/lib/analytics';
import { formatCurrency, formatMonth, formatNumber } from '@/lib/format';
import { Card, CardHeader } from '@/components/common/Card';
import { SelectField } from '@/components/common/FormControls';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StatusBadge, budgetTone, utilizationTone } from '@/components/common/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { ProjectDetailDrawer, type ProjectSummaryRow } from '@/components/projects/ProjectDetailDrawer';
import type { BillingRecord, Budget, Project, Resource } from '@/types';

type OwnershipFilter = 'all' | 'review' | 'compliant';

function loadProjects(billingMonth: string) {
  return async () => {
    const [records, projects, resources, budgets] = await Promise.all([
      getBillingRecords(),
      getProjects(),
      getResources(),
      getBudgets(),
    ]);
    return { records, projects, resources, budgets, billingMonth };
  };
}

function buildRows(
  projects: Project[],
  budgets: Budget[],
  resources: Resource[],
  records: BillingRecord[],
  billingMonth: string,
  thresholds: { warningPercent: number; criticalPercent: number },
): ProjectSummaryRow[] {
  const summaries = buildResourceSummaries(resources, records, projects, billingMonth, BILLING_MONTHS);
  return projects.map((project) => {
    const spend = sumCost(filterBillingRecords(records, { billingMonth, projectId: project.id }));
    const budget = budgets.find((item) => item.scope === 'Project' && item.targetId === project.id)?.monthlyBudget ?? 0;
    const utilization = budget > 0 ? (spend / budget) * 100 : 0;
    const projectResources = summaries.filter((summary) => summary.projectId === project.id);
    return {
      project,
      spend,
      budget,
      utilization,
      budgetStatus: getBudgetStatus(utilization, thresholds),
      resourceCount: projectResources.length,
      reviewCount: projectResources.filter((summary) => summary.ownershipStatus === 'Needs review').length,
    };
  });
}

export function ProjectsPage() {
  const { billingMonth, projectFilter, searchQuery, alertThresholds } = useAppState();
  const { data, error, loading, reload } = useAsyncData(loadProjects(billingMonth), [billingMonth]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!data) return [];
    return buildRows(data.projects, data.budgets, data.resources, data.records, billingMonth, alertThresholds);
  }, [data, billingMonth, alertThresholds]);

  const visibleRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows
      .filter((row) => projectFilter === 'all' || row.project.id === projectFilter)
      .filter((row) => statusFilter === 'all' || row.budgetStatus === statusFilter)
      .filter((row) => ownershipFilter === 'all' || (ownershipFilter === 'review' ? row.reviewCount > 0 : row.reviewCount === 0))
      .filter((row) => !query || `${row.project.name} ${row.project.owner}`.toLowerCase().includes(query))
      .sort((a, b) => b.spend - a.spend);
  }, [rows, projectFilter, statusFilter, ownershipFilter, searchQuery]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <LoadingState label="Loading projects" />;

  const selectedRow = rows.find((row) => row.project.id === selectedId) ?? null;
  const selectedRecords = selectedRow && data
    ? data.records.filter((record) => record.projectId === selectedRow.project.id)
    : [];

  const totalSpend = visibleRows.reduce((total, row) => total + row.spend, 0);
  const overBudgetCount = rows.filter((row) => row.budgetStatus === 'Over budget').length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryTile label="Projects" value={formatNumber(rows.length)} helper={`Billing period ${formatMonth(billingMonth)}`} />
        <SummaryTile label="Spend in view" value={formatCurrency(totalSpend)} helper={`${visibleRows.length} projects shown`} />
        <SummaryTile
          label="Over budget"
          value={formatNumber(overBudgetCount)}
          helper="Projects above their monthly budget"
          valueClass={overBudgetCount > 0 ? 'text-red-600' : 'text-slate-900'}
        />
      </section>

      <Card>
        <CardHeader
          title="Project portfolio"
          subtitle="Select a project to see spend, budget, resources, and owner details"
          action={
            <>
              <SelectField
                label="Budget status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'On track', label: 'On track' },
                  { value: 'Warning', label: 'Warning' },
                  { value: 'Over budget', label: 'Over budget' },
                ]}
              />
              <SelectField
                label="Ownership"
                value={ownershipFilter}
                onChange={(value) => setOwnershipFilter(value as OwnershipFilter)}
                options={[
                  { value: 'all', label: 'All projects' },
                  { value: 'review', label: 'Needs owner review' },
                  { value: 'compliant', label: 'Fully tagged' },
                ]}
              />
            </>
          }
        />
        {visibleRows.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No matching projects" description="Clear the search or change the filters to see projects." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3 text-right">Total spend</th>
                  <th className="px-5 py-3 text-right">Budget</th>
                  <th className="min-w-44 px-5 py-3">Utilization</th>
                  <th className="px-5 py-3 text-right">Resources</th>
                  <th className="px-5 py-3">Ownership status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row) => (
                  <tr
                    key={row.project.id}
                    onClick={() => setSelectedId(row.project.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => setSelectedId(row.project.id)} className="text-left">
                        <p className="font-medium text-slate-900 hover:text-sky-700">{row.project.name}</p>
                        <p className="text-xs text-slate-500">{row.project.owner}</p>
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right tabular-nums text-slate-900">{formatCurrency(row.spend)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right tabular-nums text-slate-600">{formatCurrency(row.budget)}</td>
                    <td className="px-5 py-3.5">
                      <ProgressBar value={row.utilization} tone={utilizationTone(row.utilization, alertThresholds.warningPercent, alertThresholds.criticalPercent)} />
                      <div className="mt-1">
                        <StatusBadge tone={budgetTone(row.budgetStatus)}>{row.budgetStatus}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-slate-600">{row.resourceCount}</td>
                    <td className="px-5 py-3.5">
                      {row.reviewCount === 0 ? (
                        <StatusBadge tone="success">Fully tagged</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">{`${row.reviewCount} need review`}</StatusBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedRow && (
        <ProjectDetailDrawer
          row={selectedRow}
          records={selectedRecords}
          resources={data.resources}
          allRecords={data.records}
          projects={data.projects}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function SummaryTile({ label, value, helper, valueClass = 'text-slate-900' }: { label: string; value: string; helper: string; valueClass?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </Card>
  );
}
