interface ProgressBarProps {
  value: number;
  tone: 'success' | 'warning' | 'danger';
  label?: string;
}

const BAR_CLASSES: Record<ProgressBarProps['tone'], string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

export function ProgressBar({ value, tone, label }: ProgressBarProps) {
  const width = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 w-full min-w-16 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_CLASSES[tone]}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums text-slate-700">
        {label ?? `${value.toFixed(1)}%`}
      </span>
    </div>
  );
}
