import { useMemo, useState } from 'react';
import { ServerOff } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBillingRecords, getProjects, getResources } from '@/services/api';
import { BILLING_MONTHS, SERVICE_NAMES, SERVICE_PRICING } from '@/data/sampleCatalog';
import { buildResourceSummaries, type ResourceSummary } from '@/lib/analytics';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { Card, CardHeader } from '@/components/common/Card';
import { SelectField } from '@/components/common/FormControls';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { ResourceDetailDrawer } from '@/components/resources/ResourceDetailDrawer';
import type { ReviewFlag } from '@/types';

type ReviewFilter = 'all' | 'review' | ReviewFlag;

const FLAG_TONE: Record<ReviewFlag, 'danger' | 'warning' | 'info'> = {
  'Missing project tag': 'danger',
  'Missing owner tag': 'danger',
  'Inconsistent project name': 'warning',
  'Unusual cost': 'info',
};

const REVIEW_OPTIONS: { value: ReviewFilter; label: string }[] = [
  { value: 'all', label: 'All resources' },
  { value: 'review', label: 'Any review issue' },
  { value: 'Missing project tag', label: 'Missing project tag' },
  { value: 'Missing owner tag', label: 'Missing owner tag' },
  { value: 'Inconsistent project name', label: 'Inconsistent project name' },
  { value: 'Unusual cost', label: 'Unusual cost' },
];

function loadResources(billingMonth: string) {
  return async () => {
    const [records, projects, resources] = await Promise.all([getBillingRecords(), getProjects(), getResources()]);
    const summaries = buildResourceSummaries(resources, records, projects, billingMonth, BILLING_MONTHS);
    return { records, summaries };
  };
}

export function ResourcesPage() {
  const { billingMonth, projectFilter, searchQuery } = useAppState();
  const { data, error, loading, reload } = useAsyncData(loadResources(billingMonth), [billingMonth]);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (!data) return [];
    const query = searchQuery.trim().toLowerCase();
    return data.summaries
      .filter((item) => projectFilter === 'all' || item.projectId === projectFilter)
      .filter((item) => serviceFilter === 'all' || item.resource.service === serviceFilter)
      .filter((item) => {
        if (reviewFilter === 'all') return true;
        if (reviewFilter === 'review') return item.flags.length > 0;
        return item.flags.includes(reviewFilter);
      })
      .filter((item) => {
        if (!query) return true;
        const { resource } = item;
        return `${resource.name} ${resource.id} ${resource.projectTag ?? ''} ${resource.ownerTag ?? ''}`
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => b.cost - a.cost);
  }, [data, projectFilter, serviceFilter, reviewFilter, searchQuery]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <LoadingState label="Loading resource inventory" />;

  const selected: ResourceSummary | undefined = data.summaries.find((item) => item.resource.id === selectedId);
  const selectedRecords = selected ? data.records.filter((record) => record.resourceId === selected.resource.id) : [];
  const reviewCount = data.summaries.filter((item) => item.flags.length > 0).length;
  const serviceOptions = [{ value: 'all', label: 'All services' }, ...SERVICE_NAMES.map((name) => ({ value: name, label: name }))];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="Resources" value={formatNumber(data.summaries.length)} helper="In the resource inventory" />
        <Tile label="Needs review" value={formatNumber(reviewCount)} helper="At least one review flag" valueClass={reviewCount > 0 ? 'text-amber-700' : undefined} />
        <Tile
          label="Missing tags"
          value={formatNumber(data.summaries.filter((item) => item.flags.some((flag) => flag.startsWith('Missing'))).length)}
          helper="Missing project or owner tag"
          valueClass="text-red-600"
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader
          title="Resource inventory"
          subtitle="Select a resource to open its billing evidence"
          action={
            <>
              <SelectField
                label="Review status"
                value={reviewFilter}
                options={REVIEW_OPTIONS}
                onChange={(value) => setReviewFilter(value as ReviewFilter)}
              />
              <SelectField label="Service" value={serviceFilter} options={serviceOptions} onChange={setServiceFilter} />
            </>
          }
        />
        {visible.length === 0 ? (
          <EmptyState icon={ServerOff} title="No matching resources" description="Try a different review status, service, or search term." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Project tag</th>
                  <th className="px-5 py-3">Owner tag</th>
                  <th className="px-5 py-3 text-right">Usage</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3">Deployed</th>
                  <th className="px-5 py-3">Review status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((item) => (
                  <ResourceRow key={item.resource.id} item={item} onSelect={() => setSelectedId(item.resource.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <ResourceDetailDrawer
          summary={selected}
          records={selectedRecords}
          billingMonth={billingMonth}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function ResourceRow({ item, onSelect }: { item: ResourceSummary; onSelect: () => void }) {
  const { resource } = item;
  const unit = SERVICE_PRICING[resource.service].unit;
  return (
    <tr onClick={onSelect} className="cursor-pointer transition-colors hover:bg-slate-50">
      <td className="px-5 py-3">
        <p className="font-medium text-slate-900">{resource.name}</p>
        <p className="font-mono text-xs text-slate-500">{resource.id}</p>
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{resource.service}</td>
      <td className="px-5 py-3">
        {resource.projectTag ? (
          <span className={item.flags.includes('Inconsistent project name') ? 'text-amber-700' : 'text-slate-700'} title={item.flags.includes('Inconsistent project name') ? `Attributed to ${item.projectName}` : undefined}>
            {resource.projectTag}
          </span>
        ) : (
          <span className="font-medium text-red-600">Missing</span>
        )}
      </td>
      <td className="px-5 py-3">
        {resource.ownerTag ? <span className="text-slate-700">{resource.ownerTag}</span> : <span className="font-medium text-red-600">Missing</span>}
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600">
        {formatNumber(item.usage)} <span className="text-xs text-slate-400">{unit}</span>
      </td>
      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-900">{formatCurrency(item.cost)}</td>
      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(resource.deployedOn)}</td>
      <td className="px-5 py-3">
        {item.flags.length === 0 ? (
          <StatusBadge tone="success">Tagged</StatusBadge>
        ) : (
          <div className="flex max-w-xs flex-wrap gap-1">
            {item.flags.map((flag) => (
              <StatusBadge key={flag} tone={FLAG_TONE[flag]}>
                {flag}
              </StatusBadge>
            ))}
          </div>
        )}
      </td>
    </tr>
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
