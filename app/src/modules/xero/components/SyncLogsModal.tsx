import { Fragment, useCallback, useEffect, useState } from 'react';
import { X, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, History } from 'lucide-react';
import { xeroService } from '@/modules/xero/services/xeroService';
import type { SyncLogItem, SyncLogsModalProps } from '@/modules/xero/types';
import { ErrorState } from '@/ui_library/feedback/ErrorState';
import { getErrorMessage } from '@/lib/errors';

/** Elapsed time between start and completion, e.g. "2.4s". */
function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

function StatusBadge({ status }: { status: SyncLogItem['status'] }) {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-light text-success">
        <CheckCircle2 className="w-3 h-3" /> Completed
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-danger-light text-danger">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-warning-light text-warning">
      <Clock className="w-3 h-3 animate-pulse" /> Running
    </span>
  );
}

export function SyncLogsModal({ tenantId, tenantName, onClose }: SyncLogsModalProps) {
  const [logs, setLogs] = useState<SyncLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLogs(await xeroService.getSyncHistory(tenantId));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load sync logs'));
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[720px] max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-line flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center">
              <History className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Sync Log</h2>
              <p className="text-sm text-ink-mid">{tenantName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={load}
              disabled={isLoading}
              className="p-2 text-ink-light hover:text-brand rounded-md transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 text-ink-light hover:text-ink-mid rounded-md transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-ink-light">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : error ? (
            <ErrorState
              variant="card"
              title="Couldn't load sync logs"
              message={error}
              action={{ label: 'Retry', onClick: load, icon: RefreshCw }}
            />
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-ink-light">
              <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No syncs recorded yet.</p>
              <p className="text-xs mt-1">Run a sync and it will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-page">
                    <th className="py-2 px-3 text-left text-xs font-semibold text-ink-mid">Started</th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-ink-mid">Mode</th>
                    <th className="py-2 px-3 text-right text-xs font-semibold text-ink-mid">Records</th>
                    <th className="py-2 px-3 text-right text-xs font-semibold text-ink-mid">Duration</th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-ink-mid">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <Fragment key={log.id}>
                      <tr className="border-b border-line-light">
                        <td className="py-2.5 px-3 text-sm text-ink whitespace-nowrap">
                          {new Date(log.startedAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-sm text-ink-mid">
                          {log.syncType === 'FULL' ? 'Full' : log.syncType === 'INCREMENTAL' ? 'Incremental' : log.syncType}
                        </td>
                        <td className="py-2.5 px-3 text-sm text-right font-mono text-ink">
                          {log.status === 'COMPLETED' ? (log.recordsFetched ?? 0) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-sm text-right font-mono text-ink-mid">
                          {formatDuration(log.startedAt, log.completedAt)}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={log.status} />
                        </td>
                      </tr>
                      {log.errorMessage && (
                        <tr>
                          <td colSpan={5} className="px-3 pb-2.5">
                            <p className="text-xs text-danger break-words">{log.errorMessage}</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-line text-ink-mid rounded-md text-sm font-medium hover:bg-line-light transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
