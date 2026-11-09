import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function LoadingState({ label = 'Loading data' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-sky-600" aria-hidden="true" />
      <span>{label}...</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function EmptyState({ title, description, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">We could not load this data</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Try again
        </button>
      )}
    </div>
  );
}
