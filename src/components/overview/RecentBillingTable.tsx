import { formatCurrency, formatDate } from '@/lib/format';
import { getProjectName } from '@/lib/tags';
import type { BillingRecord, Project } from '@/types';
import { StatusBadge, ownershipTone } from '@/components/common/StatusBadge';

interface RecentBillingTableProps {
  records: BillingRecord[];
  projects: Project[];
}

export function RecentBillingTable({ records, projects }: RecentBillingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Resource</th>
            <th className="px-5 py-3">Service</th>
            <th className="px-5 py-3 text-right">Cost</th>
            <th className="px-5 py-3">Ownership</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((record) => (
            <tr key={record.id} className="transition-colors hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(record.billingDate)}</td>
              <td className="px-5 py-3">
                <p className="font-mono text-xs text-slate-800">{record.resourceId}</p>
                <p className="text-xs text-slate-500">{getProjectName(record.projectId, projects)}</p>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-600">{record.service}</td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                {formatCurrency(record.cost)}
              </td>
              <td className="px-5 py-3">
                <StatusBadge tone={ownershipTone(record.ownershipStatus)}>{record.ownershipStatus}</StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
