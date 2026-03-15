import { useState, useMemo, useEffect } from 'react';
import type { Invoice, InvoiceFilter } from '@/types';
import { xeroService } from '@/services/xeroService';
import { jobService } from '@/services/jobService';
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export function InvoiceReversal() {
  const { user } = useAuth();
  const isApprover = user?.role === 'ADMIN' || user?.role === 'APPROVER';

  const [data, setData] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<InvoiceFilter & { page: number }>({
    page: 1,
    search: '',
  });
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'invoiceDate', direction: 'desc' });
  const [showPreview, setShowPreview] = useState(false);
  const [executionStep, setExecutionStep] = useState<'preview' | 'executing' | 'completed'>('preview');
  const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await xeroService.getInvoices({
        ...filters,
        status: 'AUTHORISED',
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction,
      });
      setData(response.items);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices from Xero');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedInvoices.length === data.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(data.map(inv => inv.id));
    }
  };

  const selectedTotal = useMemo(() => {
    return selectedInvoices.reduce((sum, id) => {
      const inv = data.find(i => i.id === id);
      return sum + (inv?.amountDue || 0);
    }, 0);
  }, [selectedInvoices, data]);

  const handleExecute = async () => {
    setExecutionStep('executing');
    setIsProcessing(true);

    try {
      // 1. Create Job
      const job = await jobService.createJob({
        jobType: 'INVOICE_REVERSAL',
        reversalDate,
        notes: `Reversal of ${selectedInvoices.length} invoices requested on ${new Date().toLocaleDateString()}`
      });

      setCreatedJobId(job.id);

      // 2. Add Items
      const items = selectedInvoices.map(id => {
        const inv = data.find(i => i.id === id);
        return {
          itemType: 'INVOICE',
          xeroInvoiceId: inv?.xeroInvoiceId,
          invoiceNumber: inv?.invoiceNumber,
          contactName: inv?.vendorName,
          expectedAmount: inv?.amountDue
        };
      });

      await jobService.addItems(job.id, items);

      // 3. Approve Job
      if (isApprover) {
        await jobService.approveJob(job.id);
        toast.success('Job created and scheduled for execution');
      } else {
        toast.success('Job created and submitted for approval');
      }

      setExecutionStep('completed');
    } catch (error) {
      console.error('Job execution failed:', error);
      toast.error('Failed to create or approve job');
      setExecutionStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const hasActiveFilters = useMemo(() => {
    return !!(filters.search || filters.dateFrom || filters.dateTo || filters.vendorId || filters.currencyCode || filters.amountMin || filters.amountMax);
  }, [filters]);

  const resetFilters = () => {
    setFilters({ page: 1, search: '' });
  };

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Invoice Reversal</h1>
          <p className="text-[#555555]">Select invoices to reverse with credit notes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchInvoices()}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-md text-sm font-medium transition-all duration-150 ${showFilters || hasActiveFilters
              ? 'border-[#13B5EA] bg-[#E5F6FC] text-[#13B5EA]'
              : 'border-[#E0E0E0] text-[#555555] hover:border-[#13B5EA] hover:text-[#13B5EA]'
              }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#13B5EA]" />
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-[#E0E0E0] rounded-lg p-5 mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
              />
            </div>

            {/* General Search */}
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Invoice # or Vendor..."
                  className="w-full h-10 pl-10 pr-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Currency</label>
              <input
                type="text"
                value={filters.currencyCode || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, currencyCode: e.target.value }))}
                placeholder="USD, AUD..."
                className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
              />
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Min Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="number"
                  value={filters.amountMin || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  placeholder="0.00"
                  className="w-full h-10 pl-10 pr-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Max Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="number"
                  value={filters.amountMax || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  placeholder="∞"
                  className="w-full h-10 pl-10 pr-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#F5F5F5]">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-[#555555] hover:text-[#1A1A1A] transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#8A8A8A]">
          {isLoading ? 'Loading invoices...' : `Showing ${data.length} AUTHORISED invoices`}
        </p>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-[#13B5EA] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-[#13B5EA] animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAFA]">
                <th className="py-3 px-4 border-b-2 border-[#E0E0E0]">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedInvoices.length === data.length}
                    onChange={toggleAll}
                    disabled={data.length === 0}
                    className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                  />
                </th>
                {[
                  { key: 'invoiceDate', label: 'Date' },
                  { key: 'vendorName', label: 'Vendor' },
                  { key: 'invoiceNumber', label: 'Invoice #' },
                  { key: 'amountDue', label: 'Amount Due' },
                  { key: 'currencyCode', label: 'Currency' },
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
              </tr>
            </thead>
            <tbody>
              {data.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`transition-colors duration-150 ${selectedInvoices.includes(invoice.id)
                    ? 'bg-[#E5F6FC] border-l-4 border-l-[#13B5EA]'
                    : 'hover:bg-[#FAFAFA]'
                    }`}
                >
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5]">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => toggleSelection(invoice.id)}
                      className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                    />
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5] font-mono text-sm text-[#555555]">
                    {formatDate(invoice.invoiceDate)}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5] text-sm text-[#1A1A1A] font-medium">
                    {invoice.vendorName}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5] font-mono text-sm text-[#13B5EA]">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5] text-sm text-[#1A1A1A] text-right font-mono">
                    {formatCurrency(invoice.amountDue, invoice.currencyCode)}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5]">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E5F6FC] text-[#13B5EA]">
                      {invoice.currencyCode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#8A8A8A]" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No invoices found</h3>
            <p className="text-sm text-[#555555]">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>

      {/* Selected Items Bar */}
      {selectedInvoices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#13B5EA] text-white p-4 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] animate-slide-up z-50">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-lg font-semibold">{selectedInvoices.length}</span>
                <span className="ml-2">invoices selected</span>
                <button
                  onClick={() => setSelectedInvoices([])}
                  className="ml-4 text-sm underline hover:no-underline opacity-80"
                >
                  Clear Selection
                </button>
              </div>
              <div className="h-8 w-px bg-white/30" />
              <div>
                <span className="text-sm opacity-80">Total Amount:</span>
                <span className="ml-2 font-mono font-semibold">{formatCurrency(selectedTotal, 'USD')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-80" />
                <input
                  type="date"
                  value={reversalDate}
                  onChange={(e) => setReversalDate(e.target.value)}
                  className="h-10 px-3 bg-white/10 border border-white/30 rounded-md text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white"
                />
              </div>
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-2.5 bg-white text-[#13B5EA] rounded-md font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                {isApprover ? 'Review & Execute' : 'Review & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[800px] max-h-[90vh] overflow-hidden animate-scale-in">
            {executionStep === 'preview' && (
              <>
                <div className="p-6 border-b border-[#E0E0E0]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">Review Invoice Reversals</h2>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-2 text-[#8A8A8A] hover:text-[#555555] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {/* Summary Box */}
                  <div className="bg-[#E5F6FC] rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-[#555555]">Total Invoices</p>
                        <p className="text-2xl font-bold text-[#13B5EA]">{selectedInvoices.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Total Amount</p>
                        <p className="text-2xl font-bold text-[#13B5EA]">{formatCurrency(selectedTotal, 'USD')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Reversal Date</p>
                        <p className="text-lg font-semibold text-[#13B5EA]">{formatDate(reversalDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Est. Credit Notes</p>
                        <p className="text-2xl font-bold text-[#13B5EA]">{selectedInvoices.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Invoices Table */}
                  <h3 className="text-sm font-semibold text-[#555555] uppercase tracking-wide mb-3">Selected Invoices</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#FAFAFA]">
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Invoice #</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Vendor</th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-[#555555]">Amount</th>
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoices.map(id => {
                        const inv = data.find(i => i.id === id);
                        if (!inv) return null;
                        return (
                          <tr key={id} className="border-b border-[#F5F5F5]">
                            <td className="py-2 px-3 font-mono text-sm text-[#13B5EA]">{inv.invoiceNumber}</td>
                            <td className="py-2 px-3 text-sm text-[#1A1A1A]">{inv.vendorName}</td>
                            <td className="py-2 px-3 text-sm text-right font-mono">{formatCurrency(inv.amountDue, inv.currencyCode)}</td>
                            <td className="py-2 px-3 text-sm text-[#555555]">Create Credit Note</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Warning */}
                  <div className="flex items-start gap-3 mt-6 p-4 bg-[#FFF4E5] rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-[#FFA726] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">Ready to execute</p>
                      <p className="text-sm text-[#555555] mt-1">
                        This will create a background job to process these reversals in Xero. You can track progress in Job History.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-[#E0E0E0] flex justify-end gap-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-6 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isApprover ? 'Confirm & Schedule' : 'Submit for Approval'}
                  </button>
                </div>
              </>
            )}

            {executionStep === 'executing' && (
              <div className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-[#13B5EA] animate-spin mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Creating Job...</h2>
                <p className="text-[#555555]">Please wait while we schedule your reversals</p>
              </div>
            )}

            {executionStep === 'completed' && (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-[#3BB54A]" />
                </div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">{isApprover ? 'Job Scheduled!' : 'Job Submitted!'}</h2>
                <p className="text-[#555555] mb-6">
                  Successfully created Job #{createdJobId?.substring(createdJobId.length - 8).toUpperCase()}.
                  {isApprover ? ' The worker will start processing your credit notes shortly.' : ' Waiting for approver to authorize execution.'}
                </p>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setExecutionStep('preview');
                    setSelectedInvoices([]);
                  }}
                  className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
