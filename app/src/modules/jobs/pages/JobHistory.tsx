import { useState, useEffect } from 'react';
import type { Job, JobType, JobStatus } from '@/types';
import { JOB_TYPE, JOB_TYPE_LABELS } from '@/types';
import { jobService } from '@/modules/jobs/services/jobService';
import { formatCurrency, formatDateTime, formatDuration, shortId } from '@/lib/format';
import { jobStatus, jobItemStatus, toneBadgeClasses } from '@/lib/status';
import type { Paginated } from '@/lib/types/api';
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
  Loader2,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export function JobHistory() {
  const { permissions } = useAuth();
  const canApprove = hasPermission(permissions, PERMISSIONS.JOBS_APPROVE);
  const [isApproving, setIsApproving] = useState(false);
  const [data, setData] = useState<Paginated<Job> | null>(null);
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
  const [isRetrying, setIsRetrying] = useState(false);
  const [jobToCancel, setJobToCancel] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteJob = async (jobId: string) => {
    try {
      setIsDeleting(true);
      await jobService.deleteJob(jobId);
      toast.success('Job deleted successfully');
      setJobToDelete(null);
      fetchJobs();
    } catch (err: any) {
      console.error('Failed to delete job:', err);
      toast.error(err.response?.data?.error?.message || 'Failed to delete job');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, filters, sortConfig]);

  // Polling for running jobs (list view)
  useEffect(() => {
    const hasRunningJobs = data?.items.some(job => job.status === 'RUNNING' || job.status === 'PENDING');
    if (!hasRunningJobs) return;

    const interval = setInterval(() => {
      fetchJobs(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [data]);

  // Polling for selected job (detail view)
  useEffect(() => {
    if (!selectedJob) return;
    if (selectedJob.status === 'COMPLETED' || selectedJob.status === 'FAILED' || selectedJob.status === 'PARTIAL') return;

    const interval = setInterval(async () => {
      try {
        const updatedJob = await jobService.getJob(selectedJob.id);
        setSelectedJob(updatedJob);
      } catch (error) {
        console.error('Failed to poll selected job:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedJob]);

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

  const handleRetryJob = async (jobId: string) => {
    setIsRetrying(true);
    try {
      await jobService.retryJob(jobId);
      toast.success('Retry started!');
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: 'RUNNING' } : null);
      }
      fetchJobs();
    } catch (error) {
      console.error('Failed to retry job:', error);
      toast.error('Failed to retry job');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    setIsRetrying(true);
    try {
      await jobService.cancelJob(jobId);
      toast.success('Job cleared');
      setJobToCancel(null);
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: 'FAILED' } : null);
      }
      fetchJobs();
    } catch (error) {
      console.error('Failed to cancel job:', error);
      toast.error('Failed to clear job');
    } finally {
      setIsRetrying(false);
    }
  };

  const getTypeLabel = (type: JobType) => JOB_TYPE_LABELS[type] ?? type;

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-2">Job History</h1>
          <p className="text-ink-mid">View past executions and audit logs</p>
        </div>
        <div className="flex gap-3">
          {canApprove && (
            <button
              onClick={() => {
                setFilters({ dateRange: '7d', type: 'ALL', status: 'PENDING' });
                setPage(1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-warning-light text-warning border border-warning rounded-md text-sm font-medium hover:bg-[#FFE0B2] transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Pending Approvals
            </button>
          )}
          <button
            onClick={() => { setIsRefreshing(true); fetchJobs(); }}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 border border-line text-ink-mid rounded-md text-sm font-medium hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-line text-ink-mid rounded-md text-sm font-medium hover:border-brand hover:text-brand transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-line rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ink-light" />
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="h-10 px-3 border border-line rounded-md text-sm focus:border-brand focus:outline-none"
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
            className="h-10 px-3 border border-line rounded-md text-sm focus:border-brand focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value={JOB_TYPE.INVOICE_REVERSAL}>{JOB_TYPE_LABELS.INVOICE_REVERSAL}</option>
            <option value={JOB_TYPE.OVERPAYMENT_ALLOCATION}>{JOB_TYPE_LABELS.OVERPAYMENT_ALLOCATION}</option>
            <option value={JOB_TYPE.OVERPAYMENT_CREATION}>{JOB_TYPE_LABELS.OVERPAYMENT_CREATION}</option>
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as JobStatus | 'ALL' }))}
            className="h-10 px-3 border border-line rounded-md text-sm focus:border-brand focus:outline-none"
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
            className="text-sm text-brand hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-ink-light mb-4">
        {isLoading ? 'Loading jobs...' : `Showing ${data?.items.length || 0} of ${data?.total || 0} jobs`}
      </p>

      {/* Jobs Table */}
      <div className="bg-surface border border-line rounded-lg overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-surface/50 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="bg-page">
              {[
                { key: 'id', label: 'Job ID' },
                { key: 'jobType', label: 'Type' },
                { key: 'createdAt', label: 'Date/Time' },
                { key: 'status', label: 'Status' },
              ].map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="py-3 px-4 border-b-2 border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-mid cursor-pointer hover:text-brand transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortConfig?.key === column.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 border-b-2 border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-mid">
                Created By
              </th>
              <th className="py-3 px-4 border-b-2 border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-mid">
                Items
              </th>
              <th className="py-3 px-4 border-b-2 border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-mid">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-brand-light transition-colors border-b border-line-light"
              >
                <td className="py-3.5 px-4 font-mono text-sm text-brand">
                  {shortId(job.id)}
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 bg-brand-light text-brand text-xs font-semibold rounded-full">
                    {getTypeLabel(job.jobType)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-sm text-ink-mid">{formatDateTime(job.createdAt)}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${toneBadgeClasses[jobStatus(job.status).tone]}`}>
                    {job.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-sm text-ink">
                  <div>{job.createdBy?.name || 'System'}</div>
                  {job.status === 'PENDING' && (
                    <div className="text-xs text-warning mt-0.5 font-medium">Awaiting Approval</div>
                  )}
                </td>
                <td className="py-3.5 px-4 text-sm text-ink-mid">
                  {job.processedCount}/{job.totalItems}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        setSelectedJob(job);
                        try {
                          const fullJob = await jobService.getJob(job.id);
                          setSelectedJob(fullJob);
                        } catch (err) {
                          console.error('Failed to fetch job details:', err);
                        }
                      }}
                      className="p-1.5 text-ink-light hover:text-brand transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {job.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        disabled={isRetrying}
                        className="p-1.5 text-ink-light hover:text-success transition-colors disabled:opacity-50"
                        title="Retry"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {job.status === 'RUNNING' && (
                      <button
                        onClick={() => setJobToCancel(job.id)}
                        disabled={isRetrying || isDeleting}
                        className="p-1.5 text-ink-light hover:text-danger transition-colors disabled:opacity-50"
                        title="Clear Stuck Job"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {(job.status === 'PENDING' || job.status === 'FAILED') && (
                      <button
                        onClick={() => setJobToDelete(job.id)}
                        disabled={isRetrying || isDeleting}
                        className="p-1.5 text-ink-light hover:text-danger transition-colors disabled:opacity-50"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
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
            <Search className="w-12 h-12 text-line mx-auto mb-4" />
            <p className="text-ink-light">No jobs found matching your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-ink-mid">
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
              disabled={page === (data.totalPages ?? 0)}
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
          <div className="bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[900px] max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-line">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-ink">
                      {shortId(selectedJob.id)}
                    </h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${toneBadgeClasses[jobStatus(selectedJob.status).tone]}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink-mid">
                    {getTypeLabel(selectedJob.jobType)} • Created by {selectedJob.createdBy?.name || 'System'}
                    {selectedJob.approvedBy && ` • Approved by ${selectedJob.approvedBy.name || 'System'}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 text-ink-light hover:text-ink-mid transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-line">
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
                      ? 'border-brand text-brand'
                      : 'border-transparent text-ink-mid hover:text-ink'
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
                    <div className="bg-page rounded-lg p-4">
                      <p className="text-sm text-ink-light">Created At</p>
                      <p className="text-sm font-medium text-ink">{formatDateTime(selectedJob.createdAt)}</p>
                    </div>
                    <div className="bg-page rounded-lg p-4">
                      <p className="text-sm text-ink-light">Started At</p>
                      <p className="text-sm font-medium text-ink">
                        {selectedJob.startedAt ? formatDateTime(selectedJob.startedAt) : '—'}
                      </p>
                    </div>
                    <div className="bg-page rounded-lg p-4">
                      <p className="text-sm text-ink-light">Completed At</p>
                      <p className="text-sm font-medium text-ink">
                        {selectedJob.completedAt ? formatDateTime(selectedJob.completedAt) : '—'}
                      </p>
                    </div>
                    <div className="bg-page rounded-lg p-4">
                      <p className="text-sm text-ink-light">Duration</p>
                      <p className="text-sm font-medium text-ink">
                        {formatDuration(selectedJob.startedAt || selectedJob.createdAt, selectedJob.completedAt)}
                      </p>
                    </div>
                  </div>

                  {selectedJob.status === 'PENDING' && !canApprove && (
                    <div className="bg-warning-light border border-[#FFE0B2] rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-ink">Awaiting Approval</h4>
                        <p className="text-sm text-ink-mid mt-1">This job requires approval from an Admin or Approver before execution can begin.</p>
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div>
                    <h4 className="text-sm font-semibold text-ink-mid uppercase tracking-wide mb-3">Progress</h4>
                    <div className="bg-page rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-ink-mid">Items Processed</span>
                        <span className="text-sm font-medium text-ink">
                          {(selectedJob.processedCount || 0) + (selectedJob.failedCount || 0) + (selectedJob.skippedCount || 0)} / {selectedJob.totalItems || 1}
                        </span>
                      </div>
                      <div className="h-2 bg-line rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-500"
                          style={{ width: `${(((selectedJob.processedCount || 0) + (selectedJob.failedCount || 0) + (selectedJob.skippedCount || 0)) / (selectedJob.totalItems || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success" />
                          <span className="text-sm text-ink-mid">{selectedJob.processedCount || 0} Success</span>
                        </div>
                        {selectedJob.failedCount > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-danger" />
                            <span className="text-sm text-ink-mid">{selectedJob.failedCount} Failed</span>
                          </div>
                        )}
                        {selectedJob.skippedCount > 0 && (
                          <div className="flex items-center gap-2">
                            <X className="w-4 h-4 text-ink-light" />
                            <span className="text-sm text-ink-mid">{selectedJob.skippedCount} Skipped</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedJob.notes && (
                    <div>
                      <h4 className="text-sm font-semibold text-ink-mid uppercase tracking-wide mb-2">Notes</h4>
                      <div className="p-3 bg-page rounded-lg text-sm text-ink-mid">
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
                      <tr className="bg-page">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-ink-mid">Index</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-ink-mid">Reference</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-ink-mid">Vendor</th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-ink-mid">Expected</th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-ink-mid">Actual</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-ink-mid">Status</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-ink-mid">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJob.jobItems?.map((item, i) => (
                        <tr key={item.id} className="border-b border-line-light">
                          <td className="py-2 px-3 text-sm text-ink-mid">{i + 1}</td>
                          <td className="py-2 px-3 font-mono text-sm text-brand">
                            {item.invoiceNumber || item.xeroInvoiceId || item.xeroOverpaymentId || '—'}
                          </td>
                          <td className="py-2 px-3 text-sm text-ink">{item.contactName || '—'}</td>
                          <td className="py-2 px-3 text-sm text-right font-mono">
                            {formatCurrency(item.expectedAmount)}
                          </td>
                          <td className="py-2 px-3 text-sm text-right font-mono text-ink">
                            {formatCurrency(item.allocatedAmount)}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${toneBadgeClasses[jobItemStatus(item.status).tone]}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 min-w-[200px]">
                            {item.failureReason ? (
                              <p className="text-[10px] text-danger font-medium leading-tight break-words">
                                {item.failureReason}
                              </p>
                            ) : (
                              <span className="text-[10px] text-ink-light italic">No issues</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!selectedJob.jobItems || selectedJob.jobItems.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-ink-light text-sm italic">
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
                  {selectedJob.auditLogs && selectedJob.auditLogs.length > 0 ? (
                    selectedJob.auditLogs
                      .filter(log => {
                        const majorEvents = [
                          'JOB_CREATED',
                          'JOB_ITEMS_ADDED',
                          'JOB_APPROVED',
                          'JOB_EXECUTION_STARTED',
                          'JOB_EXECUTION_COMPLETED',
                          'JOB_EXECUTION_FAILED',
                          'JOB_ITEM_FAILED' // Always keep failures!
                        ];
                        return majorEvents.includes(log.action);
                      })
                      .map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-page rounded-lg">
                        {log.action.includes('FAILED') || log.action.includes('ERROR') ? (
                          <AlertTriangle className="w-4 h-4 text-danger mt-0.5" />
                        ) : log.action.includes('COMPLETED') || 
                            log.action.includes('APPROVED') || 
                            log.action.includes('PROCESSED') || 
                            log.action.includes('CREATED') || 
                            log.action.includes('STARTED') || 
                            log.action.includes('ADDED') ||
                            log.action.includes('ALLOCATED') ? (
                          <Check className="w-4 h-4 text-success mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-ink-light mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-ink">
                            {log.action.replace(/_/g, ' ')}
                            {log.resourceType === 'JobItem' ? ' (Item)' : ''}
                          </p>
                          <p className="text-xs text-ink-light">
                            {formatDateTime(log.createdAt)} {log.user?.name ? `by ${log.user.name}` : '(System)'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-sm text-ink-light italic">
                      No detailed audit logs available.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-line flex justify-between items-center">
              {selectedJob.status === 'PENDING' && canApprove ? (
                <button
                  onClick={handleApproveJob}
                  disabled={isApproving}
                  className="px-6 py-2.5 bg-success text-white rounded-md text-sm font-medium hover:bg-success-hover transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Approve & Execute
                </button>
              ) : selectedJob.status === 'FAILED' || selectedJob.status === 'PARTIAL' ? (
                <button 
                  onClick={() => handleRetryJob(selectedJob.id)}
                  disabled={isRetrying}
                  className="px-4 py-2.5 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  Retry Failed Items
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3 ml-auto">
                <button className="px-4 py-2.5 border border-line text-ink-mid rounded-md text-sm font-medium hover:border-brand hover:text-brand transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2.5 text-ink-mid hover:text-ink transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {jobToCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-line">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-danger-light rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Clear Stuck Job?</h3>
                <p className="text-sm text-ink-mid">
                  This will mark the job as <span className="font-semibold">FAILED</span> so you can retry it. 
                  Only do this if the job has been "RUNNING" for an unusually long time.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setJobToCancel(null)}
                disabled={isRetrying}
                className="px-4 py-2 text-ink-mid font-medium hover:bg-line-light rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCancelJob(jobToCancel)}
                disabled={isRetrying}
                className="px-6 py-2 bg-danger text-white font-bold rounded-md hover:bg-danger-hover transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isRetrying && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Clear Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-line">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-danger-light rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Delete Job Permanently?</h3>
                <p className="text-sm text-ink-mid">
                  This will remove the job and all its history. <span className="font-semibold text-danger">This action cannot be undone.</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setJobToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-ink-mid font-medium hover:bg-line-light rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(jobToDelete)}
                disabled={isDeleting}
                className="px-6 py-2 bg-danger text-white font-bold rounded-md hover:bg-danger-hover transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isDeleting ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
