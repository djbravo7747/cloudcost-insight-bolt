import { useMemo } from 'react';
import { Mail } from 'lucide-react';
import { Drawer } from '@/components/common/Drawer';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StatusBadge, budgetTone, utilizationTone } from '@/components/common/StatusBadge';
import { CostTrendChart } from '@/components/charts/CostTrendChart';
import { ServiceDonutChart } from '@/components/charts/ServiceDonutChart';
import { BILLING_MONTHS } from '@/data/sampleCatalog';
import { buildResourceSummaries, groupCostBy, monthlyCostSeries, type ResourceSummary } from '@/lib/analytics';
import { formatCurrency, formatMonth, formatShortMonth } from '@/lib/format';
import type { BillingRecord, BudgetStatus, Project, Resource } from '@/types';
import { useAppState } from '@/context/AppStateContext';

export interface ProjectSummaryRow {
  project: Project;
  spend: number;
  budget: number;
  utilization: number;
  budgetStatus: BudgetStatus;
  resourceCount: number;
  reviewCount: number;
}

interface ProjectDetailDrawerProps {
  row: ProjectSummaryRow;
  records: BillingRecord[];
  resources: Resource[];
  allRecords: BillingRecord[];
  projects: Project[];
  onClose: () => void;
}

export function ProjectDetailDrawer({ row, records, resources, allRecords, projects, onClose }: ProjectDetailDrawerProps) {
  const { billingMonth, alertThresholds } = useAppState();
  const { project } = row;

  const trend = useMemo(
    () =>
      monthlyCostSeries(records, BILLING_MONTHS).map((point) => ({
        label: formatShortMonth(point.month),
        cost: point.cost,
        budget: row.budget,
      })),
    [records, row.budget],
  );

  const monthRecords = useMemo(() => records.filter((record) => record.billingMonth === billingMonth), [records, billingMonth]);
  const serviceBreakdown = useMemo(() => groupCostBy(monthRecords, (record) => record.service), [monthRecords]);

  const resourceSummaries: ResourceSummary[] = useMemo(
    () =>
      buildResourceSummaries(resources, allRecords, projects, billingMonth, BILLING_MONTHS)
        .filter((summary) => summary.projectId === project.id)
        .sort((a, b) => b.cost - a.cost),
    [resources, allRecords, projects, billingMonth, project.id],
  );

  const variance = row.spend - row.budget;
  const tone = utilizationTone(row.utilization, alertThresholds.warningPercent, alertThresholds.criticalPercent);

  return (
    <Drawer title={project.name} subtitle={`Owner: ${project.owner} · ${formatMonth(billingMonth)}`} onClose={onClose}>
      <div className="space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{project.owner}</p>
            <a
              href={`mailto:${project.ownerEmail}`}
              className="inline-flex items-center gap-1.5 text-sm text-sky-700 hover:text-sky-900"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {project.ownerEmail}
            </a>
          </div>
          <StatusBadge tone={budgetTone(row.budgetStatus)}>{row.budgetStatus}</StatusBadge>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Stat label="Spend this month" value={formatCurrency(row.spend)} />
          <Stat label="Monthly budget" value={formatCurrency(row.budget)} />
          <Stat
            label="Budget variance"
            value={`${variance >= 0 ? '+' : '-'}${formatCurrency(Math.abs(variance))}`}
            valueClass={variance > 0 ? 'text-red-600' : 'text-emerald-700'}
          />
          <Stat label="Resources" value={String(row.resourceCount)} helper={`${row.reviewCount} need review`} />
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-slate-700">Budget utilization</p>
          <ProgressBar value={row.utilization} tone={tone} />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Six-month spend against budget</h3>
          <CostTrendChart data={trend} height={220} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Cost by service</h3>
          {serviceBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No spend recorded this month.</p>
          ) : (
            <ServiceDonutChart data={serviceBreakdown} />
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Resources in this project</h3>
          {resourceSummaries.length === 0 ? (
            <p className="text-sm text-slate-500">No resources are attributed to this project.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {resourceSummaries.map((item) => (
                <li key={item.resource.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{item.resource.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.resource.service} · {formatCurrency(item.cost)}
                    </p>
                  </div>
                  {item.flags.length > 0 ? (
                    <StatusBadge tone="warning">{`${item.flags.length} issue${item.flags.length > 1 ? 's' : ''}`}</StatusBadge>
                  ) : (
                    <StatusBadge tone="success">Tagged</StatusBadge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <p className="text-xs text-slate-400">
          Warnings start at {alertThresholds.warningPercent}% utilization and overruns at {alertThresholds.criticalPercent}%.
        </p>
      </div>
    </Drawer>
  );
}

function Stat({ label, value, helper, valueClass = 'text-slate-900' }: { label: string; value: string; helper?: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {helper && <p className="mt-0.5 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}
