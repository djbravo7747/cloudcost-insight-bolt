import { useMemo } from 'react';
import { Drawer } from '@/components/common/Drawer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CostTrendChart } from '@/components/charts/CostTrendChart';
import { BILLING_MONTHS, SERVICE_PRICING } from '@/data/sampleCatalog';
import { filterBillingRecords, monthlyCostSeries, sumCost, type ResourceSummary } from '@/lib/analytics';
import { formatCurrency, formatDate, formatMonth, formatNumber, formatPreciseCurrency, formatShortDay } from '@/lib/format';
import type { BillingRecord, ReviewFlag } from '@/types';

const FLAG_TONE: Record<ReviewFlag, 'danger' | 'warning' | 'info'> = {
  'Missing project tag': 'danger',
  'Missing owner tag': 'danger',
  'Inconsistent project name': 'warning',
  'Unusual cost': 'info',
};

const EVIDENCE_ROWS = 20;

interface ResourceDetailDrawerProps {
  summary: ResourceSummary;
  records: BillingRecord[];
  billingMonth: string;
  onClose: () => void;
}

export function ResourceDetailDrawer({ summary, records, billingMonth, onClose }: ResourceDetailDrawerProps) {
  const { resource } = summary;

  const monthRecords = useMemo(
    () => filterBillingRecords(records, { billingMonth }).sort((a, b) => a.billingDate.localeCompare(b.billingDate)),
    [records, billingMonth],
  );

  const dailySeries = useMemo(
    () => monthRecords.map((record) => ({ label: formatShortDay(record.billingDate), cost: record.cost })),
    [monthRecords],
  );

  const priorAverage = useMemo(() => {
    const series = monthlyCostSeries(records, BILLING_MONTHS);
    const index = BILLING_MONTHS.indexOf(billingMonth);
    const prior = series.slice(0, Math.max(index, 0));
    return prior.length > 0 ? prior.reduce((total, point) => total + point.cost, 0) / prior.length : 0;
  }, [records, billingMonth]);

  const unit = SERVICE_PRICING[resource.service].unit;
  const averageDaily = monthRecords.length > 0 ? summary.cost / monthRecords.length : 0;
  const multiple = priorAverage > 0 ? summary.cost / priorAverage : null;
  const evidence = [...monthRecords].reverse().slice(0, EVIDENCE_ROWS);

  return (
    <Drawer title={resource.name} subtitle={`${resource.id} · ${resource.service}`} onClose={onClose}>
      <div className="space-y-6">
        <section>
          <div className="flex flex-wrap gap-1.5">
            {summary.flags.length === 0 ? (
              <StatusBadge tone="success">Tagged and within normal cost</StatusBadge>
            ) : (
              summary.flags.map((flag) => (
                <StatusBadge key={flag} tone={FLAG_TONE[flag]}>
                  {flag}
                </StatusBadge>
              ))
            )}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Project tag" value={resource.projectTag ?? 'Missing'} missing={!resource.projectTag} />
            <Field label="Resolved project" value={summary.projectName} />
            <Field label="Owner tag" value={resource.ownerTag ?? 'Missing'} missing={!resource.ownerTag} />
            <Field label="Region" value={resource.region} />
            <Field label="Deployed on" value={formatDate(resource.deployedOn)} />
            <Field label="Usage unit" value={unit} />
          </dl>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Billing evidence for {formatMonth(billingMonth)}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Cost this month" value={formatCurrency(summary.cost)} />
            <Stat label="Usage this month" value={`${formatNumber(summary.usage)} ${unit}`} />
            <Stat label="Average daily cost" value={formatCurrency(averageDaily)} />
            <Stat
              label="Versus prior average"
              value={multiple === null ? 'No history' : `${multiple.toFixed(2)}x`}
              valueClass={summary.flags.includes('Unusual cost') ? 'text-sky-700' : 'text-slate-900'}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Daily cost</h3>
          {dailySeries.length === 0 ? (
            <p className="text-sm text-slate-500">No billing records for this resource in the selected month.</p>
          ) : (
            <CostTrendChart data={dailySeries} height={220} />
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent billing lines</h3>
          {evidence.length === 0 ? (
            <p className="text-sm text-slate-500">No billing lines to show.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Usage</th>
                    <th className="px-4 py-2.5 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evidence.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-2.5 text-slate-600">{formatDate(record.billingDate)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatNumber(record.usageQuantity)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">{formatPreciseCurrency(record.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {monthRecords.length > EVIDENCE_ROWS && (
            <p className="mt-2 text-xs text-slate-500">
              Showing the latest {EVIDENCE_ROWS} of {monthRecords.length} billing lines this month.
            </p>
          )}
        </section>
        <p className="text-xs text-slate-400">Total for the month: {formatCurrency(sumCost(monthRecords))}</p>
      </div>
    </Drawer>
  );
}

function Field({ label, value, missing = false }: { label: string; value: string; missing?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-0.5 break-all ${missing ? 'font-medium text-red-600' : 'text-slate-800'}`}>{value}</dd>
    </div>
  );
}

function Stat({ label, value, valueClass = 'text-slate-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
