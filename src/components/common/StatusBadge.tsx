import type { LucideIcon } from 'lucide-react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
};

interface StatusBadgeProps {
  tone: Tone;
  children: string;
  icon?: LucideIcon;
}

export function StatusBadge({ tone, children, icon: Icon }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function ownershipTone(status: string): Tone {
  if (status === 'Tagged') return 'success';
  if (status === 'Inconsistent project name') return 'warning';
  return 'danger';
}

export function budgetTone(status: string): Tone {
  if (status === 'Over budget') return 'danger';
  if (status === 'Warning') return 'warning';
  return 'success';
}

export function utilizationTone(utilization: number, warningPercent: number, criticalPercent: number): 'success' | 'warning' | 'danger' {
  if (utilization >= criticalPercent) return 'danger';
  if (utilization >= warningPercent) return 'warning';
  return 'success';
}
