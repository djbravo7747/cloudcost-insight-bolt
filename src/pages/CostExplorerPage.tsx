import { useEffect, useMemo, useState } from 'react';
import { Download, Receipt } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBillingRecords, getProjects } from '@/services/api';
import {
  BILLING_END_DATE,
  BILLING_START_DATE,
  SERVICE_NAMES,
} from '@/data/sampleCatalog';
import { filterBillingRecords, groupCostBy, sumCost } from '@/lib/analytics';
import { downloadCsv } from '@/lib/csv';
import { getProjectName } from '@/lib/tags';
import { formatCurrency, formatDate, formatMonth, formatNumber, formatPreciseCurrency, formatShortDay } from '@/lib/format';
import { Card, CardHeader } from '@/components/common/Card';
import { SelectField, TextField } from '@/components/common/FormControls';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge, ownershipTone } from '@/components/common/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { CostTrendChart } from '@/components/charts/CostTrendChart';
import { RankedBarChart } from '@/components/charts/RankedBarChart';
import type { BillingRecord, Project } from '@/types';

type GroupBy = 'project' | 'service' | 'time';

const PAGE_SIZE = 15;

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'project', label: 'Project' },
  { value: 'service', label: 'Service' },
  { value: 'time', label: 'Time (month)' },
];

function groupKeyOf(groupBy: GroupBy, projects: Project[]) {
  return (record: BillingRecord): string => {
    if (groupBy === 'project') return getProjectName(record.projectId, projects);
    if (groupBy === 'service') return record.service;
    return formatMonth(record.billingMonth);
  };
}

function exportRecords(records: BillingRecord[], projects: Project[]) {
  downloadCsv(
    `cloudcost-billing-records-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Billing date', 'Resource ID', 'Project', 'Service', 'Usage quantity', 'Usage unit', 'Cost (USD)', 'Ownership status'],
    records.map((record) => [
      record.billingDate,
      record.resourceId,
      getProjectName(record.projectId, projects),
      record.service,
      record.usageQuantity,
      record.usageUnit,
      record.cost.toFixed(2),
      record.ownershipStatus,
    ]),
  );
}

export function CostExplorerPage() {
  const { projectFilter, searchQuery } = useAppState();
  const { data, error, loading, reload } = useAsyncData(
    async () => {
      const [records, projects] = await Promise.all([getBillingRecords(), getProjects()]);
      return { records, projects };
    },
    [],
  );
  const [startDate, setStartDate] = useState(BILLING_START_DATE);
  const [endDate, setEndDate] = useState(BILLING_END_DATE);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('project');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, serviceFilter, projectFilter, searchQuery, groupBy]);

  const view = useMemo(() => {
    if (!data) return null;
    const { records, projects } = data;
    const rangeValid = startDate <= endDate;
    const filtered = rangeValid
      ? filterBillingRecords(records, { startDate, endDate, projectId: projectFilter, service: serviceFilter })
      : [];
    const query = searchQuery.trim().toLowerCase();
    const searched = query
      ? filtered.filter((record) =>
          `${record.resourceId} ${getProjectName(record.projectId, projects)} ${record.service} ${record.ownershipStatus}`
            .toLowerCase()
            .includes(query),
        )
      : filtered;

    const keyOf = groupKeyOf(groupBy, projects);
    const groups = groupCostBy(searched, keyOf);
    const counts = new Map<string, number>();
    for (const record of searched) counts.set(keyOf(record), (counts.get(keyOf(record)) ?? 0) + 1);
    const totalCost = sumCost(searched);
    const orderedGroups =
      groupBy === 'time' ? [...groups].sort((a, b) => a.key.localeCompare(b.key)) : groups;

    const dailyMap = groupCostBy(searched, (record) => record.billingDate).sort((a, b) => a.key.localeCompare(b.key));
    const trend = dailyMap.map((point) => ({ label: formatShortDay(point.key), cost: point.cost }));

    return {
      rangeValid,
      searched,
      totalCost,
      trend,
      groups: orderedGroups.map((group) => ({ ...group, count: counts.get(group.key) ?? 0 })),
      projects,
      pageRecords: searched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      pageCount: Math.max(1, Math.ceil(searched.length / PAGE_SIZE)),
    };
  }, [data, startDate, endDate, serviceFilter, projectFilter, searchQuery, groupBy, page]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !view) return <LoadingState label="Loading billing records" />;

  const serviceOptions = [{ value: 'all', label: 'All services' }, ...SERVICE_NAMES.map((name) => ({ value: name, label: name }))];
  const largestGroup = view.groups[0];

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <TextField
            label="Start date"
            type="date"
            value={startDate}
            min={BILLING_START_DATE}
            max={BILLING_END_DATE}
            onChange={setStartDate}
          />
          <TextField
            label="End date"
            type="date"
            value={endDate}
            min={BILLING_START_DATE}
            max={BILLING_END_DATE}
            onChange={setEndDate}
            hint={view.rangeValid ? undefined : 'End date must be after the start date.'}
          />
          <SelectField label="Service" value={serviceFilter} options={serviceOptions} onChange={setServiceFilter} />
          <SelectField
            label="Group by"
            value={groupBy}
            options={GROUP_OPTIONS}
            onChange={(value) => setGroupBy(value as GroupBy)}
          />
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => exportRecords(view.searched, view.projects)}
              disabled={view.searched.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Total cost</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{formatCurrency(view.totalCost)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(startDate)} to {formatDate(endDate)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Billing records</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{formatNumber(view.searched.length)}</p>
          <p className="mt-1 text-xs text-slate-500">Matching the current filters</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">Largest group</p>
          <p className="mt-2 truncate text-2xl font-semibold text-slate-900">{largestGroup?.key ?? 'None'}</p>
          <p className="mt-1 text-xs text-slate-500">
            {largestGroup ? `${formatCurrency(largestGroup.cost)} grouped by ${groupBy}` : 'No spend in range'}
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Cost trend" subtitle="Daily spend across the selected range" />
          <div className="p-5">
            {view.trend.length === 0 ? (
              <EmptyState title="No spend in range" description="Adjust the dates or filters to see a trend." />
            ) : (
              <CostTrendChart data={view.trend} />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Cost by group" subtitle={`Grouped by ${groupBy}`} />
          <div className="p-5">
            {view.groups.length === 0 ? (
              <EmptyState title="No spend in range" description="Adjust the dates or filters to see groups." />
            ) : (
              <RankedBarChart data={view.groups.map((group) => ({ label: group.key, value: group.cost }))} height={Math.max(220, view.groups.length * 36)} />
            )}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader title="Group summary" subtitle="Share of total cost by group" />
        {view.groups.length === 0 ? (
          <EmptyState title="No groups" description="No billing records match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Group</th>
                  <th className="px-5 py-3 text-right">Records</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {view.groups.map((group) => (
                  <tr key={group.key} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{group.key}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatNumber(group.count)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">{formatCurrency(group.cost)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                      {view.totalCost > 0 ? ((group.cost / view.totalCost) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Billing records" subtitle="Line-item charges behind the totals above" />
        {view.searched.length === 0 ? (
          <EmptyState icon={Receipt} title="No billing records" description="No charges match the current date range, filters, or search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Billing date</th>
                    <th className="px-5 py-3">Resource ID</th>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3 text-right">Usage</th>
                    <th className="px-5 py-3 text-right">Cost</th>
                    <th className="px-5 py-3">Ownership</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {view.pageRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(record.billingDate)}</td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-800">{record.resourceId}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{getProjectName(record.projectId, view.projects)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{record.service}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600">
                        {formatNumber(record.usageQuantity)} <span className="text-xs text-slate-400">{record.usageUnit}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-900">
                        {formatPreciseCurrency(record.cost)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={ownershipTone(record.ownershipStatus)}>{record.ownershipStatus}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageCount={view.pageCount}
              totalItems={view.searched.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
