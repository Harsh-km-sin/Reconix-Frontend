import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  Activity, 
  Eye, 
  X,
  FileJson,
} from 'lucide-react';
import { auditService } from '@/modules/audit/services/auditService';
import type { AuditLog } from '@/modules/audit/types';
import toast from 'react-hot-toast';
import { formatTimestamp, idPrefix, EM_DASH } from '@/lib/format';
import { auditActionTone, toneBadgeClasses } from '@/lib/status';
import { PageHeader } from '@/ui_library/components/PageHeader';
import { DataTable, type Column } from '@/ui_library/components/DataTable';

export function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    
    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [resourceFilter, setResourceFilter] = useState('');

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await auditService.listLogs({
                page,
                limit,
                action: actionFilter || undefined,
                resourceType: resourceFilter || undefined
            });
            setLogs(response.items);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            toast.error('Failed to load audit logs. Note: Only ADMINs can view this page.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, resourceFilter]);

    const columns = useMemo<Column<AuditLog>[]>(
        () => [
            {
                key: 'createdAt',
                header: 'Timestamp',
                className: 'whitespace-nowrap',
                render: (log) => (
                    <div className="flex items-center gap-2 text-sm text-ink">
                        <Clock className="w-4 h-4 text-ink-light" />
                        {formatTimestamp(log.createdAt)}
                    </div>
                ),
            },
            {
                key: 'user',
                header: 'User',
                className: 'whitespace-nowrap',
                render: (log) => (
                    <div className="flex items-center gap-3 font-medium text-ink">
                        <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand text-xs">
                            {log.user?.name?.[0] || 'S'}
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold">{log.user?.name || 'System'}</p>
                            <p className="text-xs text-ink-light">
                                {log.user?.email || 'automated-task@reconix.ai'}
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                key: 'action',
                header: 'Action',
                className: 'whitespace-nowrap',
                render: (log) => (
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${toneBadgeClasses[auditActionTone(log.action)]}`}
                    >
                        {log.action}
                    </span>
                ),
            },
            {
                key: 'resource',
                header: 'Resource',
                className: 'whitespace-nowrap',
                render: (log) => (
                    <div className="text-sm">
                        <p className="font-medium text-ink">{log.resourceType || EM_DASH}</p>
                        <p className="text-xs font-mono text-ink-light">
                            {log.resourceId ? `${idPrefix(log.resourceId, 12)}…` : EM_DASH}
                        </p>
                    </div>
                ),
            },
            {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                className: 'whitespace-nowrap',
                render: (log) => (
                    <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ink-mid hover:text-brand transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        View Details
                    </button>
                ),
            },
        ],
        []
    );

    return (
        <div className="max-w-[1440px] mx-auto animate-fade-in p-8">
            <PageHeader
                title="Audit Log"
                description="Track every action taken within your organisation"
                className="mb-8"
            />

            {/* Filters */}
            <div className="bg-surface border border-line rounded-xl p-6 mb-8 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                    <input 
                        type="text"
                        placeholder="Filter by action (e.g. JOB_CREATED)..."
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full h-11 pl-10 pr-4 border border-line rounded-lg text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                </div>

                <div className="min-w-[200px] relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                    <select
                        value={resourceFilter}
                        onChange={(e) => {
                            setResourceFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full h-11 pl-10 pr-8 border border-line rounded-lg text-sm appearance-none focus:border-brand focus:outline-none transition-all cursor-pointer"
                    >
                        <option value="">All Resource Types</option>
                        <option value="Job">Job</option>
                        <option value="JobItem">JobItem</option>
                        <option value="User">User</option>
                        <option value="Company">Company</option>
                    </select>
                </div>

                <button 
                  onClick={() => { setActionFilter(''); setResourceFilter(''); setPage(1); }}
                  className="text-sm font-medium text-brand hover:underline"
                >
                    Reset Filters
                </button>
            </div>

            <DataTable
                columns={columns}
                rows={logs}
                rowKey={(log) => log.id}
                isLoading={isLoading}
                emptyIcon={Activity}
                emptyTitle="No audit logs"
                emptyMessage="Nothing matches your current filters."
                pagination={{ mode: 'server', page, limit, total, onPageChange: setPage }}
                className="min-h-[400px]"
            />

            {/* Log Detail Drawer/Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end z-[100] animate-fade-in" onClick={() => setSelectedLog(null)}>
                    <div 
                        className="bg-surface w-full max-w-[600px] h-full shadow-2xl animate-slide-left flex flex-col" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-line flex items-center justify-between bg-page">
                            <div>
                                <h2 className="text-xl font-bold text-ink">Log Details</h2>
                                <p className="text-sm text-ink-mid font-mono mt-1">{selectedLog.id}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-line rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Metadata Section */}
                            <div className="grid grid-cols-2 gap-6 bg-page border border-line rounded-xl p-5">
                                <div>
                                    <p className="text-xs font-semibold text-ink-light uppercase tracking-wider mb-1">Action</p>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${toneBadgeClasses[auditActionTone(selectedLog.action)]}`}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-ink-light uppercase tracking-wider mb-1">IP Address</p>
                                    <p className="text-sm font-mono text-ink">{selectedLog.ipAddress || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-ink-light uppercase tracking-wider mb-1">User Agent</p>
                                    <p className="text-sm text-ink-mid line-clamp-1" title={selectedLog.userAgent || '—'}>
                                        {selectedLog.userAgent || '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-ink-light uppercase tracking-wider mb-1">Timestamp</p>
                                    <p className="text-sm text-ink">{formatTimestamp(selectedLog.createdAt)}</p>
                                </div>
                            </div>

                            {/* JSON Payloads */}
                            <div className="space-y-6">
                                {selectedLog.xeroRequest && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-brand">
                                            <FileJson className="w-4 h-4" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider">Xero Request Payload</h3>
                                        </div>
                                        <pre className="bg-ink text-[#D4D4D4] p-4 rounded-xl text-xs overflow-x-auto font-mono scrollbar-thin">
                                            {JSON.stringify(selectedLog.xeroRequest, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {selectedLog.xeroResponse && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-success">
                                            <FileJson className="w-4 h-4" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider">Xero Response</h3>
                                        </div>
                                        <pre className="bg-ink text-[#D4D4D4] p-4 rounded-xl text-xs overflow-x-auto font-mono">
                                            {JSON.stringify(selectedLog.xeroResponse, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {(!selectedLog.xeroRequest && !selectedLog.xeroResponse) && (
                                    <div className="py-12 text-center border-2 border-dashed border-line rounded-xl bg-page">
                                        <Activity className="w-10 h-10 text-line mx-auto mb-3" />
                                        <p className="text-sm text-ink-light">No additional data recorded for this action</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-line bg-page">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="w-full py-3 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition-colors shadow-md"
                            >
                                Close Detail View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
