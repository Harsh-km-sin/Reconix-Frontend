import { Fragment, useCallback, useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, History } from 'lucide-react';
import { xeroService } from '@/modules/xero/services/xeroService';
import type { SyncLogItem, SyncLogsModalProps } from '@/modules/xero/types';
import { ErrorState } from '@/ui_library/feedback/ErrorState';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime, formatDuration } from '@/lib/format';
import { syncStatus, toneBadgeClasses } from '@/lib/status';
import { Modal } from '@/ui_library/components/Modal';
import { EmptyState } from '@/ui_library/feedback/EmptyState';
import { LoadingState } from '@/ui_library/feedback/LoadingState';

const SYNC_STATUS_ICON = {
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
  RUNNING: Clock,
} as const;

function StatusBadge({ status }: { status: SyncLogItem['status'] }) {
  const { label, tone } = syncStatus(status);
  const Icon = SYNC_STATUS_ICON[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${toneBadgeClasses[tone]}`}
    >
      <Icon className={`w-3 h-3${status === 'RUNNING' ? ' animate-pulse' : ''}`} /> {label}
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
    <Modal
      open
      onClose={onClose}
      title="Sync Log"
      description={tenantName}
      size="lg"
      footer={
        <button
          onClick={onClose}
          className="px-6 py-2.5 border border-line text-ink-mid rounded-md text-sm font-medium hover:bg-line-light transition-colors"
        >
          Close
        </button>
      }
    >
      <div className="flex justify-end mb-3">
        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 p-2 text-ink-light hover:text-brand rounded-md transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading sync history…" />
      ) : error ? (
        <ErrorState
          variant="card"
          title="Couldn't load sync logs"
          message={error}
          action={{ label: 'Retry', onClick: load, icon: RefreshCw }}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No syncs recorded yet"
          message="Run a sync and it will appear here."
        />
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
                          {formatDateTime(log.startedAt)}
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
    </Modal>
  );
}
