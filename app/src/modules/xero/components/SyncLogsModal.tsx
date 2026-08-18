import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, History } from 'lucide-react';
import { xeroService } from '@/modules/xero/services/xeroService';
import type { SyncLogItem, SyncLogsModalProps } from '@/modules/xero/types';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime, formatDuration, EM_DASH } from '@/lib/format';
import { syncStatus, toneBadgeClasses } from '@/lib/status';
import { Modal } from '@/ui_library/components/Modal';
import { DataTable, type Column } from '@/ui_library/components/DataTable';

const SYNC_STATUS_ICON = {
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
  RUNNING: Clock,
} as const;

const SYNC_TYPE_LABEL: Record<SyncLogItem['syncType'], string> = {
  FULL: 'Full',
  INCREMENTAL: 'Incremental',
  CONTACTS: 'Contacts',
  INVOICES: 'Invoices',
  OVERPAYMENTS: 'Overpayments',
};

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

  const columns = useMemo<Column<SyncLogItem>[]>(
    () => [
      {
        key: 'startedAt',
        header: 'Started',
        className: 'whitespace-nowrap',
        render: (log) => <span className="text-ink">{formatDateTime(log.startedAt)}</span>,
      },
      {
        key: 'syncType',
        header: 'Mode',
        render: (log) => SYNC_TYPE_LABEL[log.syncType] ?? log.syncType,
      },
      {
        key: 'recordsFetched',
        header: 'Records',
        align: 'right',
        className: 'font-mono',
        render: (log) => (
          <span className="text-ink">
            {log.status === 'COMPLETED' ? (log.recordsFetched ?? 0) : EM_DASH}
          </span>
        ),
      },
      {
        key: 'duration',
        header: 'Duration',
        align: 'right',
        className: 'font-mono',
        render: (log) => formatDuration(log.startedAt, log.completedAt),
      },
      {
        key: 'status',
        header: 'Status',
        render: (log) => <StatusBadge status={log.status} />,
      },
    ],
    []
  );

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

      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(log) => log.id}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        emptyIcon={History}
        emptyTitle="No syncs recorded yet"
        emptyMessage="Run a sync and it will appear here."
        renderSubRow={(log) =>
          log.errorMessage ? (
            <p className="text-xs text-danger break-words">{log.errorMessage}</p>
          ) : null
        }
      />
    </Modal>
  );
}
