import { useState, useMemo } from 'react';
import type { Job, JobType, JobStatus } from '@/types';
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
  Clock
} from 'lucide-react';

const jobs: Job[] = [];
const users: { id: string; fullName: string }[] = [];

export function JobHistory() {
  const [filters, setFilters] = useState({
    dateRange: '7d',
    type: 'all' as JobType | 'all',
    status: 'all' as JobStatus | 'all',
    user: 'all',
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Job; direction: 'asc' | 'desc' }>({ key: 'startTime', direction: 'desc' });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'items' | 'audit'>('summary');

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filters.type !== 'all' && job.type !== filters.type) return false;
      if (filters.status !== 'all' && job.status !== filters.status) return false;
      if (filters.user !== 'all' && job.executedById !== filters.user) return false;
      return true;
    }).sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filters, sortConfig]);

  const handleSort = (key: keyof Job) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getStatusBadge = (status: JobStatus) => {
    const styles: Record<string, string> = {
      pending: 'bg-[#FFF4E5] text-[#FFA726]',
      running: 'bg-[#E5F6FC] text-[#13B5EA]',
      completed: 'bg-[#E8F5E9] text-[#3BB54A]',
      failed: 'bg-[#FFEBEE] text-[#E53935]',
      partial: 'bg-[#FFF4E5] text-[#FFA726]',
    };
    return styles[status] || 'bg-[#F5F5F5] text-[#8A8A8A]';
  };

  const getTypeLabel = (type: JobType) => {
    const labels: Record<string, string> = {
      invoice_reversal: 'Invoice Reversal',
      overpayment_allocation: 'Overpayment Allocation',
      overpayment_creation: 'Overpayment Creation',
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

  const formatDuration = (start: string, end?: string) => {
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
        <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
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
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as JobType | 'all' }))}
            className="h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="invoice_reversal">Invoice Reversal</option>
            <option value="overpayment_allocation">Overpayment Allocation</option>
            <option value="overpayment_creation">Overpayment Creation</option>
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as JobStatus | 'all' }))}
            className="h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="partial">Partial</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
          </select>

          {/* User */}
          <select
            value={filters.user}
            onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
            className="h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
          >
            <option value="all">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.fullName}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ dateRange: '7d', type: 'all', status: 'all', user: 'all' })}
            className="text-sm text-[#13B5EA] hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-[#8A8A8A] mb-4">
        Showing {filteredJobs.length} jobs
      </p>

      {/* Jobs Table */}
      <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA]">
              {[
                { key: 'jobId', label: 'Job ID' },
                { key: 'type', label: 'Type' },
                { key: 'executedBy', label: 'Executed By' },
                { key: 'startTime', label: 'Date/Time' },
                { key: 'status', label: 'Status' },
              ].map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key as keyof Job)}
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
                Items
              </th>
              <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase tracking-wide text-[#555555]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-[#E5F6FC] transition-colors border-b border-[#F5F5F5]"
              >
                <td className="py-3.5 px-4 font-mono text-sm text-[#13B5EA]">{job.jobId}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 bg-[#E5F6FC] text-[#13B5EA] text-xs font-semibold rounded-full">
                    {getTypeLabel(job.type)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-sm text-[#1A1A1A]">{job.executedBy}</td>
                <td className="py-3.5 px-4 text-sm text-[#555555]">{formatDateTime(job.startTime)}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(job.status)}`}>
                    {job.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-sm text-[#555555]">
                  {job.processedItems}/{job.totalItems}
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
                    {job.status === 'failed' && (
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

        {filteredJobs.length === 0 && (
          <div className="py-16 text-center">
            <Search className="w-12 h-12 text-[#E0E0E0] mx-auto mb-4" />
            <p className="text-[#8A8A8A]">No jobs found matching your filters</p>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[900px] max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-[#E0E0E0]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">{selectedJob.jobId}</h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#555555]">
                    {getTypeLabel(selectedJob.type)} • Executed by {selectedJob.executedBy}
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
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
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
                      <p className="text-sm text-[#8A8A8A]">Start Time</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{formatDateTime(selectedJob.startTime)}</p>
                    </div>
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <p className="text-sm text-[#8A8A8A]">End Time</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {selectedJob.endTime ? formatDateTime(selectedJob.endTime) : '—'}
                      </p>
                    </div>
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <p className="text-sm text-[#8A8A8A]">Duration</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {formatDuration(selectedJob.startTime, selectedJob.endTime)}
                      </p>
                    </div>
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <p className="text-sm text-[#8A8A8A]">Company</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">Acme Corporation</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#555555] uppercase tracking-wide mb-3">Progress</h4>
                    <div className="bg-[#FAFAFA] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#555555]">Items Processed</span>
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {selectedJob.processedItems} / {selectedJob.totalItems}
                        </span>
                      </div>
                      <div className="h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#13B5EA] rounded-full transition-all duration-500"
                          style={{ width: `${(selectedJob.processedItems / selectedJob.totalItems) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#3BB54A]" />
                          <span className="text-sm text-[#555555]">{selectedJob.processedItems - selectedJob.failedItems} Success</span>
                        </div>
                        {selectedJob.failedItems > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#E53935]" />
                            <span className="text-sm text-[#555555]">{selectedJob.failedItems} Failed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#FAFAFA]">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Item #</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Invoice/OP ID</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Vendor</th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-[#555555]">Amount</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Status</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Xero ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: selectedJob.totalItems }).map((_, i) => (
                        <tr key={i} className="border-b border-[#F5F5F5]">
                          <td className="py-2 px-3 text-sm text-[#555555]">{i + 1}</td>
                          <td className="py-2 px-3 font-mono text-sm text-[#13B5EA]">INV-{String(i + 1).padStart(3, '0')}</td>
                          <td className="py-2 px-3 text-sm text-[#1A1A1A]">Acme Corp</td>
                          <td className="py-2 px-3 text-sm text-right font-mono">$500.00</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              i < (selectedJob.processedItems - selectedJob.failedItems)
                                ? 'bg-[#E8F5E9] text-[#3BB54A]'
                                : i < selectedJob.processedItems
                                ? 'bg-[#FFEBEE] text-[#E53935]'
                                : 'bg-[#F5F5F5] text-[#8A8A8A]'
                            }`}>
                              {i < (selectedJob.processedItems - selectedJob.failedItems)
                                ? 'Success'
                                : i < selectedJob.processedItems
                                ? 'Failed'
                                : 'Pending'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-[#8A8A8A]">
                            {i < selectedJob.processedItems ? `XERO-${Math.random().toString(36).substr(2, 8).toUpperCase()}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-3">
                  {[
                    { time: selectedJob.startTime, event: 'Job started', type: 'info' },
                    { time: selectedJob.startTime, event: 'Connected to Xero API', type: 'info' },
                    { time: selectedJob.startTime, event: `Processing ${selectedJob.totalItems} items`, type: 'info' },
                    ...(selectedJob.endTime ? [{ time: selectedJob.endTime, event: 'Job completed', type: 'success' }] : []),
                  ].map((log, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#FAFAFA] rounded-lg">
                      <Clock className="w-4 h-4 text-[#8A8A8A] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-[#1A1A1A]">{log.event}</p>
                        <p className="text-xs text-[#8A8A8A]">{formatDateTime(log.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E0E0E0] flex justify-between">
              {selectedJob.status === 'failed' && (
                <button className="px-4 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry Failed Items
                </button>
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
