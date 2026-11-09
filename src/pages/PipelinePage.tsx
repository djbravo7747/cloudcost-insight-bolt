import { Check, CircleDashed, Upload, X } from 'lucide-react';
import { useMemo, useState, type ChangeEvent } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPipelineHistory, uploadBillingFile } from '@/services/api';
import { formatDateTime, formatDuration, formatFileSize, formatNumber } from '@/lib/format';
import { Card, CardHeader } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { PipelineFlow } from '@/components/pipeline/PipelineFlow';
import type { PipelineHistory, PipelineRun, UploadedFile } from '@/types';

type UploadState = { status: 'idle' } | { status: 'uploading' } | { status: 'error'; message: string };

const UPLOAD_STATUS_TONE: Record<UploadedFile['status'], 'success' | 'warning' | 'danger'> = {
  Completed: 'success',
  'Completed with errors': 'warning',
  Failed: 'danger',
};

const RUN_STATUS_TONE: Record<PipelineRun['status'], 'success' | 'warning' | 'danger'> = {
  Succeeded: 'success',
  'Succeeded with warnings': 'warning',
  Failed: 'danger',
};

export function PipelinePage() {
  const { data, error, loading, reload } = useAsyncData<PipelineHistory>(getPipelineHistory, []);
  const [sessionUploads, setSessionUploads] = useState<UploadedFile[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });

  const uploads = useMemo(() => [...sessionUploads, ...(data?.uploads ?? [])], [sessionUploads, data]);
  const latestRun = useMemo(
    () => [...(data?.runs ?? [])].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null,
    [data],
  );

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <LoadingState label="Loading pipeline history" />;

  const totals = uploads.reduce(
    (sum, upload) => ({
      total: sum.total + upload.totalRecords,
      valid: sum.valid + upload.validRecords,
      rejected: sum.rejected + upload.rejectedRecords,
      missingTags: sum.missingTags + upload.missingTagCount,
      duplicates: sum.duplicates + upload.duplicateCount,
    }),
    { total: 0, valid: 0, rejected: 0, missingTags: 0, duplicates: 0 },
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadState({ status: 'error', message: 'Only CSV files can be uploaded. Choose a file ending in .csv.' });
      return;
    }
    setUploadState({ status: 'uploading' });
    try {
      const result = await uploadBillingFile(file);
      setSessionUploads((current) => [result, ...current]);
      setUploadState({ status: 'idle' });
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'The file could not be processed.';
      setUploadState({ status: 'error', message });
    }
  };

  return (
    <div className="space-y-6">
      <PipelineFlow latestRun={latestRun} />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Tile label="Records processed" value={formatNumber(totals.total)} />
        <Tile label="Valid records" value={formatNumber(totals.valid)} valueClass="text-emerald-700" />
        <Tile label="Rejected records" value={formatNumber(totals.rejected)} valueClass={totals.rejected > 0 ? 'text-red-600' : undefined} />
        <Tile label="Missing tags" value={formatNumber(totals.missingTags)} valueClass={totals.missingTags > 0 ? 'text-amber-700' : undefined} />
        <Tile label="Duplicate records" value={formatNumber(totals.duplicates)} />
      </section>

      <Card>
        <CardHeader
          title="Upload billing file"
          subtitle="Simulated: the file is read in the browser to estimate counts. No backend processing happens."
          action={<StatusBadge tone="info">Simulated</StatusBadge>}
        />
        <div className="p-5">
          <label
            htmlFor="billing-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-sky-400 hover:bg-sky-50/40"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm ring-1 ring-slate-200">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-slate-800">
              {uploadState.status === 'uploading' ? 'Processing file...' : 'Choose a billing CSV file'}
            </span>
            <span className="text-xs text-slate-500">Expected columns: billing date, resource ID, project tag, owner tag, service, usage, cost</span>
          </label>
          <input
            id="billing-file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={uploadState.status === 'uploading'}
            onChange={handleFileChange}
          />
          {uploadState.status === 'error' && (
            <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-700">
              <X className="h-4 w-4" aria-hidden="true" />
              {uploadState.message}
            </p>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Upload history" subtitle="Files uploaded in this session appear first. Sample history is shown after them." />
        {uploads.length === 0 ? (
          <EmptyState title="No uploads yet" description="Choose a CSV file above to see its simulated processing result here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">File</th>
                  <th className="px-5 py-3">Uploaded</th>
                  <th className="px-5 py-3 text-right">Records</th>
                  <th className="px-5 py-3 text-right">Valid</th>
                  <th className="px-5 py-3 text-right">Rejected</th>
                  <th className="px-5 py-3 text-right">Missing tags</th>
                  <th className="px-5 py-3 text-right">Duplicates</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uploads.map((upload) => (
                  <tr key={upload.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{upload.fileName}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(upload.sizeKb)}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDateTime(upload.uploadedAt)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">{formatNumber(upload.totalRecords)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatNumber(upload.validRecords)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatNumber(upload.rejectedRecords)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatNumber(upload.missingTagCount)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatNumber(upload.duplicateCount)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={UPLOAD_STATUS_TONE[upload.status]}>{upload.status}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title="Validation error report" subtitle="Rows rejected or flagged during validation" />
          {data.validationErrors.length === 0 ? (
            <EmptyState icon={Check} title="No validation errors" description="Every row in the recent files passed validation." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">File and row</th>
                    <th className="px-5 py-3">Column</th>
                    <th className="px-5 py-3">Problem</th>
                    <th className="px-5 py-3 text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.validationErrors.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="text-slate-900">{item.fileName}</p>
                        <p className="text-xs text-slate-500">Row {item.row}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{item.column}</td>
                      <td className="px-5 py-3 text-slate-700">{item.message}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatNumber(item.occurrences)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Pipeline run history" subtitle="Sample execution log, newest first" />
          {data.runs.length === 0 ? (
            <EmptyState icon={CircleDashed} title="No pipeline runs" description="Pipeline runs will be listed here once they are recorded." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Started</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3 text-right">Duration</th>
                    <th className="px-5 py-3 text-right">Records</th>
                    <th className="px-5 py-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...data.runs]
                    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
                    .map((run) => (
                      <tr key={run.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDateTime(run.startedAt)}</td>
                        <td className="px-5 py-3 text-slate-700">{run.sourceFile}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600">{formatDuration(run.durationSeconds)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatNumber(run.recordsProcessed)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge tone={RUN_STATUS_TONE[run.status]}>{run.status}</StatusBadge>
                          {run.failedStage && <p className="mt-1 text-xs text-red-600">Failed at {run.failedStage}</p>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Tile({ label, value, valueClass = 'text-slate-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </Card>
  );
}
