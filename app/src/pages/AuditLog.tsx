import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  Activity, 
  Eye, 
  X,
  FileJson,
  Loader2
} from 'lucide-react';
import { auditService, type AuditLog } from '@/services/auditService';
import toast from 'react-hot-toast';

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
            setLogs(response.data);
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

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionColor = (action: string) => {
        if (action.includes('CREATED')) return 'text-[#3BB54A] bg-[#E8F5E9]';
        if (action.includes('DELETED')) return 'text-[#E53935] bg-[#FFEBEE]';
        if (action.includes('UPDATED')) return 'text-[#FFA726] bg-[#FFF4E5]';
        if (action.includes('APPROVED')) return 'text-[#13B5EA] bg-[#E5F6FC]';
        return 'text-[#555555] bg-[#F5F5F5]';
    };

    return (
        <div className="max-w-[1440px] mx-auto animate-fade-in p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Audit Log</h1>
                    <p className="text-[#555555]">Track every action taken within your organisation</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 mb-8 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                    <input 
                        type="text"
                        placeholder="Filter by action (e.g. JOB_CREATED)..."
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full h-11 pl-10 pr-4 border border-[#E0E0E0] rounded-lg text-sm focus:border-[#13B5EA] focus:outline-none focus:ring-2 focus:ring-[#13B5EA]/10 transition-all"
                    />
                </div>

                <div className="min-w-[200px] relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                    <select
                        value={resourceFilter}
                        onChange={(e) => {
                            setResourceFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full h-11 pl-10 pr-8 border border-[#E0E0E0] rounded-lg text-sm appearance-none focus:border-[#13B5EA] focus:outline-none transition-all cursor-pointer"
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
                  className="text-sm font-medium text-[#13B5EA] hover:underline"
                >
                    Reset Filters
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden shadow-sm relative min-h-[400px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-[#13B5EA] animate-spin" />
                            <p className="text-sm text-[#555555] font-medium">Fetching logs...</p>
                        </div>
                    </div>
                )}
                
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                            <th className="py-4 px-6 text-left text-xs font-semibold text-[#555555] uppercase tracking-wider">Timestamp</th>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-[#555555] uppercase tracking-wider">User</th>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-[#555555] uppercase tracking-wider">Action</th>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-[#555555] uppercase tracking-wider">Resource</th>
                            <th className="py-4 px-6 text-right text-xs font-semibold text-[#555555] uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F5]">
                        {logs.length === 0 && !isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-[#8A8A8A] text-sm">
                                    No audit logs found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-[#F9FAFB] transition-colors group">
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                                            <Clock className="w-4 h-4 text-[#8A8A8A]" />
                                            {formatDateTime(log.createdAt)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="flex items-center gap-3 font-medium text-[#1A1A1A]">
                                            <div className="w-8 h-8 rounded-full bg-[#E5F6FC] flex items-center justify-center text-[#13B5EA] text-xs">
                                                {log.user?.name?.[0] || 'S'}
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-semibold">{log.user?.name || 'System'}</p>
                                                <p className="text-xs text-[#8A8A8A]">{log.user?.email || 'automated-task@reconix.ai'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="text-sm">
                                            <p className="font-medium text-[#1A1A1A]">{log.resourceType || '—'}</p>
                                            <p className="text-xs font-mono text-[#8A8A8A]">{log.resourceId?.substring(0, 12)}...</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap text-right">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#555555] hover:text-[#13B5EA] transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-[#555555]">
                    Showing <span className="font-semibold text-[#1A1A1A]">{logs.length}</span> of <span className="font-semibold text-[#1A1A1A]">{total}</span> total logs
                </p>
                
                <div className="flex gap-2">
                    <button 
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] disabled:opacity-50 transition-colors"
                    >
                        Previous
                    </button>
                    <button 
                        disabled={page * limit >= total || isLoading}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-[#13B5EA] text-white rounded-lg text-sm font-semibold hover:bg-[#0E92BC] disabled:opacity-50 transition-all shadow-sm"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Log Detail Drawer/Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end z-[100] animate-fade-in" onClick={() => setSelectedLog(null)}>
                    <div 
                        className="bg-white w-full max-w-[600px] h-full shadow-2xl animate-slide-left flex flex-col" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between bg-[#FAFAFA]">
                            <div>
                                <h2 className="text-xl font-bold text-[#1A1A1A]">Log Details</h2>
                                <p className="text-sm text-[#555555] font-mono mt-1">{selectedLog.id}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-[#E0E0E0] rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Metadata Section */}
                            <div className="grid grid-cols-2 gap-6 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl p-5">
                                <div>
                                    <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Action</p>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${getActionColor(selectedLog.action)}`}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">IP Address</p>
                                    <p className="text-sm font-mono text-[#1A1A1A]">{selectedLog.ipAddress || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">User Agent</p>
                                    <p className="text-sm text-[#555555] line-clamp-1" title={selectedLog.userAgent || '—'}>
                                        {selectedLog.userAgent || '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Timestamp</p>
                                    <p className="text-sm text-[#1A1A1A]">{formatDateTime(selectedLog.createdAt)}</p>
                                </div>
                            </div>

                            {/* JSON Payloads */}
                            <div className="space-y-6">
                                {selectedLog.xeroRequest && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[#13B5EA]">
                                            <FileJson className="w-4 h-4" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider">Xero Request Payload</h3>
                                        </div>
                                        <pre className="bg-[#1A1A1A] text-[#D4D4D4] p-4 rounded-xl text-xs overflow-x-auto font-mono scrollbar-thin">
                                            {JSON.stringify(selectedLog.xeroRequest, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {selectedLog.xeroResponse && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[#3BB54A]">
                                            <FileJson className="w-4 h-4" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider">Xero Response</h3>
                                        </div>
                                        <pre className="bg-[#1A1A1A] text-[#D4D4D4] p-4 rounded-xl text-xs overflow-x-auto font-mono">
                                            {JSON.stringify(selectedLog.xeroResponse, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {(!selectedLog.xeroRequest && !selectedLog.xeroResponse) && (
                                    <div className="py-12 text-center border-2 border-dashed border-[#E0E0E0] rounded-xl bg-[#FAFAFA]">
                                        <Activity className="w-10 h-10 text-[#E0E0E0] mx-auto mb-3" />
                                        <p className="text-sm text-[#8A8A8A]">No additional data recorded for this action</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#E0E0E0] bg-[#FAFAFA]">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="w-full py-3 bg-[#13B5EA] text-white rounded-lg font-bold hover:bg-[#0E92BC] transition-colors shadow-md"
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
