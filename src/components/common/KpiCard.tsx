import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  accent?: 'default' | 'success' | 'warning' | 'danger';
  footer?: React.ReactNode;
}

const ACCENT_CLASSES: Record<NonNullable<KpiCardProps['accent']>, string> = {
  default: 'bg-sky-50 text-sky-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
};

export function KpiCard({ label, value, helper, icon: Icon, accent = 'default', footer }: KpiCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ACCENT_CLASSES[accent]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
