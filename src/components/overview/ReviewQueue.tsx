import { ArrowRight } from 'lucide-react';
import type { ResourceSummary } from '@/lib/analytics';
import { formatCurrency } from '@/lib/format';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { ReviewFlag } from '@/types';

const FLAG_TONE: Record<ReviewFlag, 'danger' | 'warning' | 'info'> = {
  'Missing project tag': 'danger',
  'Missing owner tag': 'danger',
  'Inconsistent project name': 'warning',
  'Unusual cost': 'info',
};

interface ReviewQueueProps {
  items: ResourceSummary[];
  onViewAll: () => void;
}

export function ReviewQueue({ items, onViewAll }: ReviewQueueProps) {
  if (items.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-slate-500">No resources need owner review.</p>;
  }
  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.resource.id} className="px-5 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{item.resource.name}</p>
                <p className="text-xs text-slate-500">
                  {item.projectName} · {item.resource.service}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums text-slate-700">{formatCurrency(item.cost)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.flags.map((flag) => (
                <StatusBadge key={flag} tone={FLAG_TONE[flag]}>
                  {flag}
                </StatusBadge>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-100 px-5 py-3">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 transition-colors hover:text-sky-900"
        >
          View all resources
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
