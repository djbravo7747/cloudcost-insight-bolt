import { Check, ChevronRight, Circle, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/lib/format';
import type { PipelineRun, PipelineStage } from '@/types';

const STAGES: PipelineStage[] = ['Extract', 'Validate', 'Transform', 'Reconcile', 'Load', 'Analyze'];

type StageState = 'completed' | 'failed' | 'pending';

const STAGE_STYLE: Record<StageState, { ring: string; text: string; icon: LucideIcon }> = {
  completed: { ring: 'bg-emerald-50 ring-emerald-200', text: 'text-emerald-800', icon: Check },
  failed: { ring: 'bg-red-50 ring-red-200', text: 'text-red-700', icon: X },
  pending: { ring: 'bg-slate-50 ring-slate-200', text: 'text-slate-500', icon: Circle },
};

const STAGE_STATE_LABEL: Record<StageState, string> = {
  completed: 'Completed',
  failed: 'Failed',
  pending: 'Not reached',
};

function stageStates(run: PipelineRun | null): StageState[] {
  if (!run) return STAGES.map(() => 'pending');
  if (!run.failedStage) return STAGES.map(() => 'completed');
  const failedIndex = STAGES.indexOf(run.failedStage);
  return STAGES.map((_, index) => {
    if (index < failedIndex) return 'completed';
    if (index === failedIndex) return 'failed';
    return 'pending';
  });
}

interface PipelineFlowProps {
  latestRun: PipelineRun | null;
}

export function PipelineFlow({ latestRun }: PipelineFlowProps) {
  const states = stageStates(latestRun);
  const summary = latestRun
    ? `Latest run ${formatDateTime(latestRun.startedAt)} on ${latestRun.sourceFile}`
    : 'No runs recorded yet';

  return (
    <Card>
      <CardHeader
        title="Pipeline stages"
        subtitle={`${summary}. Stage status is taken from the sample run log.`}
        action={<StatusBadge tone="info">Simulated</StatusBadge>}
      />
      <ol className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-[repeat(6,minmax(0,1fr))] xl:gap-2">
        {STAGES.map((stage, index) => {
          const state = states[index];
          const style = STAGE_STYLE[state];
          const Icon = style.icon;
          return (
            <li key={stage} className="flex items-center gap-2">
              <div className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 ring-1 ring-inset ${style.ring}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ${style.text}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{stage}</p>
                  <p className={`text-xs ${style.text}`}>{STAGE_STATE_LABEL[state]}</p>
                </div>
              </div>
              {index < STAGES.length - 1 && (
                <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-300 xl:block" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
