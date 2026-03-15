import { useState, useEffect } from 'react';
import type { Job, JobType, JobStatus } from '@/types';
import { jobService } from '@/services/jobService';
import type { ListResponse } from '@/services/jobService';
import {
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  Download,
  X,
  Check,
  AlertTriangle,
  Clock,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export function JobHistory() {
  const { user } = useAuth();
  const isApprover = user?.role === 'ADMIN' || user?.role === 'APPROVER';
  const [isApproving, setIsApproving] = useState(false);
  const [data, setData] = useState<ListResponse<Job> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: '7d',
    type: 'ALL' as JobType | 'ALL',
    status: 'ALL' as JobStatus | 'ALL',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'items' | 'audit'>('summary');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = async (isPoll = false) => {
    if (!isPoll) setIsLoading(true);
    try {
      const response = await jobService.listJobs({
        page,
        limit: 10,
        type: filters.type,
        status: filters.status,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });
      setData(response);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, filters, sortConfig]);

  // Polling for running jobs
  useEffect(() => {
    const hasRunningJobs = data?.items.some(job => job.status === 'RUNNING' || job.status === 'PENDING');
    if (!hasRunningJobs) return;

    const interval = setInterval(() => {
      fetchJobs(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [data]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleApproveJob = async () => {
    if (!selectedJob) return;
    setIsApproving(true);
    try {
      await jobService.approveJob(selectedJob.id);
      toast.success('Job approved and scheduled for execution');
      setSelectedJob(prev => prev ? { ...prev, status: 'RUNNING' } : null);
      fetchJobs();
    } catch (error) {
      console.error('Failed to approve job:', error);
      toast.error('Failed to approve job');
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-[#FFF4E5] text-[#FFA726]',
      RUNNING: 'bg-[#E5F6FC] text-[#13B5EA]',
      COMPLETED: 'bg-[#E8F5E9] text-[#3BB54A]',
      FAILED: 'bg-[#FFEBEE] text-[#E53935]',
      PARTIAL: 'bg-[#FFF4E5] text-[#FFA726]',
    };
    return styles[status] || 'bg-[#F5F5F5] text-[#8A8A8A]';
  };

  const getTypeLabel = (type: JobType) => {
    const labels: Record<string, string> = {
      INVOICE_REVERSAL: 'Invoice Reversal',
      OVERPAYMENT_ALLOCATION: 'Overpayment Allocation',
      OVERPAYMENT_CREATION: 'Overpayment Creation',
    };
    return labels[type] || type;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start) return '—';
    if (!end) return 'In progress';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Job History</h1>
          <p className="text-[#555555]">View past executions and audit logs</p>
        </div>
        <div className="flex gap-3">
          {isApprover && (
            <button
              onClick={() => {
                setFilters({ dateRange: '7d', type: 'ALL', status: 'PENDING' });
                setPage(1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF4E5] text-[#FFA726] border border-[#FFA726] rounded-md text-sm font-medium hover:bg-[#FFE0B2] transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Pending Approvals
            </button>
          )}
          <button
            onClick={() => { setIsRefreshing(true); fetchJobs(); }}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E0E0E0] rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8A8A8A]" />
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Job Type */}
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as JobType | 'ALL' }))}
            className="h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="INVOICE_REVERSAL">Invoice Reversal</option>
            <option value="OVERPAYMENT_ALLOCATION">Overpayment Allocation</option>
            <option value="OVERPAYMENT_CREATION">Overpayment Creation</option>
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as JobStatus | 'ALL' }))}
            className="h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="PARTIAL">Partial</option>
            <option value="RUNNING">Running</option>
            <option value="PENDING">Pending</option>
          </select>

          <button
            onClick={() => {
              setFilters({ dateRange: '7d', type: 'ALL', status: 'ALL' });
              setPage(1);
            }}
            className="text-sm text-[#13B5EA] hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-[#8A8A8A] mb-4">
        {isLoading ? 'Loading jobs...' : `Showing ${data?.items.length || 0} of ${data?.total || 0} jobs`}
      </p>

      {/* Jobs Table */}
      <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-[#13B5EA] animate-spin" />
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA]">
              {[
                { key: 'id', label: 'Job ID' },
                { key: 'jobType', label: 'Type' },
                { key: 'createdAt', label: 'Date/Time' },
                { key: 'status', label: 'Status' },
              ].map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase tracking-wide text-[#555555] cursor-pointer hover:text-[#13B5EA] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortConfig?.key === column.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase tracking-wide text-[#555555]">
                Created By
              </th>
              <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase tracking-wide text-[#555555]">
                Items
              </th>
              <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase tracking-wide text-[#555555]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-[#E5F6FC] transition-colors border-b border-[#F5F5F5]"
              >
                <td className="py-3.5 px-4 font-mono text-sm text-[#13B5EA]">
                  {job.id.substring(job.id.length - 8).toUpperCase()}
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 bg-[#E5F6FC] text-[#13B5EA] text-xs font-semibold rounded-full">
                    {getTypeLabel(job.jobType)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-sm text-[#555555]">{formatDateTime(job.createdAt)}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(job.status)}`}>
                    {job.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-sm text-[#1A1A1A]">
                  <div>{job.createdBy?.name || 'System'}</div>
                  {job.status === 'PENDING' && (
                    <div className="text-xs text-[#FFA726] mt-0.5 font-medium">Awaiting Approval</div>
                  )}
                </td>
                <td className="py-3.5 px-4 text-sm text-[#555555]">
                  {job.processedCount}/{job.totalItems}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="p-1.5 text-[#8A8A8A] hover:text-[#13B5EA] transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {job.status === 'FAILED' && (
                      <button
                        className="p-1.5 text-[#8A8A8A] hover:text-[#3BB54A] transition-colors"
                        title="Retry"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!data || data.items.length === 0) && !isLoading && (
          <div className="py-16 text-center">
            <Search className="w-12 h-12 text-[#E0E0E0] mx-auto mb-4" />
            <p className="text-[#8A8A8A]">No jobs found matching your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-[#555555]">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[900px] max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-[#E0E0E0]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">
                      {selectedJob.id.substring(selectedJob.id.length - 8).toUpperCase()}
                    </h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#555555]">
                    {getTypeLabel(selectedJob.jobType)} • Created by {selectedJob.createdBy?.name || 'System'}
                    {selectedJob.approvedBy && ` • Approved by ${selectedJob.approvedBy.name || 'System'}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 text-[#8A8A8A] hover:text-[#555555] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#E0E0E0]">
              <div className="flex">
                {[
                  { id: 'summary', label: 'Summary' },
                  { id: 'items', label: 'Items' },
                  { id: 'audit', label: 'Audit Log' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-[#13B5EA] text-[#13B5EA]'
                      : 'border-transparent text-[#555555] hover:text-[#1A1A1A]'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <p className="text-sm text-[#8A8A8A]">Created At</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{formatDateTime(selectedJob.createdAt)}</p>
                    </div>
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <p className="text-sm text-[#8A8A8A]">Started At</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {selectedJob.startedAt ? formatDateTime(selectedJob.startedAt) : '—'}
                      </p>
                    </div>
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <p className="text-sm text-[#8A8A8A]">Completed At</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {selectedJob.completedAt ? formatDateTime(selectedJob.completedAt) : '—'}
                      </p>
                    </div>
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <p className="text-sm text-[#8A8A8A]">Duration</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {formatDuration(selectedJob.startedAt || selectedJob.createdAt, selectedJob.completedAt)}
                      </p>
                    </div>
                  </div>

                  {selectedJob.status === 'PENDING' && !isApprover && (
                    <div className="bg-[#FFF4E5] border border-[#FFE0B2] rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#FFA726] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-[#1A1A1A]">Awaiting Approval</h4>
                        <p className="text-sm text-[#555555] mt-1">This job requires approval from an Admin or Approver before execution can begin.</p>
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#555555] uppercase tracking-wide mb-3">Progress</h4>
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#555555]">Items Processed</span>
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {selectedJob.processedCount} / {selectedJob.totalItems}
                        </span>
                      </div>
                      <div className="h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#13B5EA] rounded-full transition-all duration-500"
                          style={{ width: `${(selectedJob.processedCount / (selectedJob.totalItems || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#3BB54A]" />
                          <span className="text-sm text-[#555555]">{selectedJob.processedCount - selectedJob.failedCount} Success</span>
                        </div>
                        {selectedJob.failedCount > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#E53935]" />
                            <span className="text-sm text-[#555555]">{selectedJob.failedCount} Failed</span>
                          </div>
                        )}
                        {selectedJob.skippedCount > 0 && (
                          <div className="flex items-center gap-2">
                            <X className="w-4 h-4 text-[#8A8A8A]" />
                            <span className="text-sm text-[#555555]">{selectedJob.skippedCount} Skipped</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedJob.notes && (
                    <div>
                      <h4 className="text-sm font-semibold text-[#555555] uppercase tracking-wide mb-2">Notes</h4>
                      <div className="p-3 bg-[#FAFAFA] rounded-lg text-sm text-[#555555]">
                        {selectedJob.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'items' && (
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#FAFAFA]">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Index</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Reference</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Vendor</th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-[#555555]">Expected</th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-[#555555]">Actual</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJob.jobItems?.map((item, i) => (
                        <tr key={item.id} className="border-b border-[#F5F5F5]">
                          <td className="py-2 px-3 text-sm text-[#555555]">{i + 1}</td>
                          <td className="py-2 px-3 font-mono text-sm text-[#13B5EA]">
                            {item.invoiceNumber || item.xeroInvoiceId || item.xeroOverpaymentId || '—'}
                          </td>
                          <td className="py-2 px-3 text-sm text-[#1A1A1A]">{item.contactName || '—'}</td>
                          <td className="py-2 px-3 text-sm text-right font-mono">
                            {item.expectedAmount !== null ? `$${Number(item.expectedAmount).toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-sm text-right font-mono text-[#E53935]">
                            {item.actualAmountDue !== null ? `$${Number(item.actualAmountDue).toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.status === 'PROCESSED'
                              ? 'bg-[#E8F5E9] text-[#3BB54A]'
                              : item.status === 'FAILED'
                                ? 'bg-[#FFEBEE] text-[#E53935]'
                                : item.status === 'SKIPPED'
                                  ? 'bg-[#F5F5F5] text-[#8A8A8A]'
                                  : 'bg-[#FFF4E5] text-[#FFA726]'
                              }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!selectedJob.jobItems || selectedJob.jobItems.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#8A8A8A] text-sm italic">
                            No items loaded for this job.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#FAFAFA] rounded-lg">
                    <Clock className="w-4 h-4 text-[#8A8A8A] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-[#1A1A1A]">Job created</p>
                      <p className="text-xs text-[#8A8A8A]">{formatDateTime(selectedJob.createdAt)}</p>
                    </div>
                  </div>
                  {selectedJob.startedAt && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFAFA] rounded-lg">
                      <Clock className="w-4 h-4 text-[#8A8A8A] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-[#1A1A1A]">Job execution started</p>
                        <p className="text-xs text-[#8A8A8A]">{formatDateTime(selectedJob.startedAt)}</p>
                      </div>
                    </div>
                  )}
                  {selectedJob.completedAt && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFAFA] rounded-lg">
                      <Clock className="w-4 h-4 text-[#8A8A8A] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-[#1A1A1A]">Job execution completed</p>
                        <p className="text-xs text-[#8A8A8A]">{formatDateTime(selectedJob.completedAt)}</p>
                      </div>
                    </div>
                  )}
                  {selectedJob.approvedAt && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFAFA] rounded-lg">
                      <Check className="w-4 h-4 text-[#3BB54A] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-[#1A1A1A]">Job approved</p>
                        <p className="text-xs text-[#8A8A8A]">{formatDateTime(selectedJob.approvedAt)} by {selectedJob.approvedBy?.name || 'System'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E0E0E0] flex justify-between items-center">
              {selectedJob.status === 'PENDING' && isApprover ? (
                <button
                  onClick={handleApproveJob}
                  disabled={isApproving}
                  className="px-6 py-2.5 bg-[#3BB54A] text-white rounded-md text-sm font-medium hover:bg-[#2E923B] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Approve & Execute
                </button>
              ) : selectedJob.status === 'FAILED' ? (
                <button className="px-4 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry Failed Items
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3 ml-auto">
                <button className="px-4 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2.5 text-[#555555] hover:text-[#1A1A1A] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
