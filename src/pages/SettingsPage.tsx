import { useState } from 'react';
import { useAppState, DEFAULT_ALERT_THRESHOLDS } from '@/context/AppStateContext';
import { DATA_SOURCE_LABEL, IS_LIVE_API } from '@/config/dataSource';
import { Card, CardHeader } from '@/components/common/Card';
import { TextField } from '@/components/common/FormControls';
import { StatusBadge } from '@/components/common/StatusBadge';

const MAX_PERCENT = 500;

function validate(warning: number, critical: number): string | null {
  if (!Number.isFinite(warning) || !Number.isFinite(critical)) return 'Enter both thresholds as whole numbers.';
  if (warning < 1) return 'The warning threshold must be at least 1%.';
  if (critical <= warning) return 'The over-budget threshold must be higher than the warning threshold.';
  if (critical > MAX_PERCENT) return `The over-budget threshold cannot exceed ${MAX_PERCENT}%.`;
  return null;
}

export function SettingsPage() {
  const { alertThresholds, saveAlertThresholds, mutedBudgetIds, toggleBudgetAlert } = useAppState();
  const [warningDraft, setWarningDraft] = useState(String(alertThresholds.warningPercent));
  const [criticalDraft, setCriticalDraft] = useState(String(alertThresholds.criticalPercent));
  const [savedMessage, setSavedMessage] = useState(false);

  const warning = Number(warningDraft);
  const critical = Number(criticalDraft);
  const error = validate(warning, critical);
  const isDirty = warning !== alertThresholds.warningPercent || critical !== alertThresholds.criticalPercent;
  const shownWarning = error ? '-' : String(warning);
  const shownCritical = error ? '-' : String(critical);

  const updateDraft = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setSavedMessage(false);
  };

  const handleSave = () => {
    if (error) return;
    saveAlertThresholds({ warningPercent: warning, criticalPercent: critical });
    setSavedMessage(true);
  };

  const handleReset = () => {
    setWarningDraft(String(DEFAULT_ALERT_THRESHOLDS.warningPercent));
    setCriticalDraft(String(DEFAULT_ALERT_THRESHOLDS.criticalPercent));
    saveAlertThresholds(DEFAULT_ALERT_THRESHOLDS);
    setSavedMessage(true);
  };

  const handleUnmuteAll = () => {
    mutedBudgetIds.forEach((budgetId) => toggleBudgetAlert(budgetId));
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="xl:col-span-1">
        <CardHeader
          title="Budget alert thresholds"
          subtitle="Choose when budgets are flagged. Percentages compare actual cost with the monthly budget."
        />
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Warning at (%)"
              type="number"
              min="1"
              max={String(MAX_PERCENT)}
              value={warningDraft}
              onChange={updateDraft(setWarningDraft)}
              hint="Budgets at or above this level show Warning"
            />
            <TextField
              label="Over budget at (%)"
              type="number"
              min="1"
              max={String(MAX_PERCENT)}
              value={criticalDraft}
              onChange={updateDraft(setCriticalDraft)}
              hint="Budgets at or above this level show Over budget"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="mb-2 font-medium text-slate-900">Preview</p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="success">{`On track below ${shownWarning}%`}</StatusBadge>
              <StatusBadge tone="warning">{`Warning from ${shownWarning}%`}</StatusBadge>
              <StatusBadge tone="danger">{`Over budget from ${shownCritical}%`}</StatusBadge>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {savedMessage && !isDirty && !error && (
            <p role="status" className="text-sm text-emerald-700">
              Thresholds saved. The Budgets and Projects pages use them immediately.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || Boolean(error)}
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save thresholds
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Restore defaults
            </button>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Muted budget alerts"
            subtitle="Muted budgets still show their status on the Budgets page but do not count as active alerts."
          />
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-slate-700">
              {mutedBudgetIds.length === 0
                ? 'No budget alerts are muted.'
                : `${mutedBudgetIds.length} budget ${mutedBudgetIds.length === 1 ? 'alert is' : 'alerts are'} muted.`}
            </p>
            <button
              type="button"
              onClick={handleUnmuteAll}
              disabled={mutedBudgetIds.length === 0}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Unmute all
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Data source" subtitle="Where the dashboard gets its billing information" />
          <dl className="space-y-3 p-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Current source</dt>
              <dd className="text-right font-medium text-slate-900">{DATA_SOURCE_LABEL}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Mode</dt>
              <dd>
                <StatusBadge tone={IS_LIVE_API ? 'success' : 'neutral'}>{IS_LIVE_API ? 'Live API' : 'Sample data'}</StatusBadge>
              </dd>
            </div>
            <p className="pt-2 text-xs text-slate-500">
              Sample data is generated in the browser. Set the VITE_API_BASE_URL environment variable to connect the same screens to a FastAPI backend.
            </p>
          </dl>
        </Card>
      </div>
    </div>
  );
}
