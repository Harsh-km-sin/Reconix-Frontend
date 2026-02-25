import { useState, useMemo } from 'react';
import type { Invoice } from '@/types';
import { useInvoiceFilter } from '@/hooks/useInvoiceFilter';

const invoices: Invoice[] = [];
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Eye,
  X,
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export function InvoiceReversal() {
  const { filters, filteredInvoices, setFilter, resetFilters, hasActiveFilters } = useInvoiceFilter(invoices);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Invoice; direction: 'asc' | 'desc' } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [executionStep, setExecutionStep] = useState<'preview' | 'executing' | 'completed'>('preview');
  const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0]);

  const currencies = [...new Set(invoices.map(inv => inv.currency))];
  const statuses = [...new Set(invoices.map(inv => inv.status))];

  const sortedInvoices = useMemo(() => {
    if (!sortConfig) return filteredInvoices;
    
    return [...filteredInvoices].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInvoices, sortConfig]);

  const handleSort = (key: keyof Invoice) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
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
    if (selectedInvoices.length === sortedInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(sortedInvoices.map(inv => inv.id));
    }
  };

  const selectedTotal = useMemo(() => {
    return selectedInvoices.reduce((sum, id) => {
      const inv = invoices.find(i => i.id === id);
      return sum + (inv?.amountDue || 0);
    }, 0);
  }, [selectedInvoices]);

  const handleExecute = async () => {
    setExecutionStep('executing');
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setExecutionStep('completed');
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      authorised: 'bg-[#E8F5E9] text-[#3BB54A]',
      approved: 'bg-[#FFF4E5] text-[#FFA726]',
      paid: 'bg-[#E5F6FC] text-[#13B5EA]',
      voided: 'bg-[#F5F5F5] text-[#8A8A8A]',
    };
    return styles[status] || 'bg-[#F5F5F5] text-[#8A8A8A]';
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
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-md text-sm font-medium transition-all duration-150 ${
              showFilters || hasActiveFilters
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
          <button className="px-4 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-all duration-150">
            Save Configuration
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
                onChange={(e) => setFilter('dateFrom', e.target.value)}
                className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilter('dateTo', e.target.value)}
                className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
              />
            </div>

            {/* Vendor Search */}
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Vendor</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="text"
                  value={filters.vendor || ''}
                  onChange={(e) => setFilter('vendor', e.target.value)}
                  placeholder="Search vendors..."
                  className="w-full h-10 pl-10 pr-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Currency</label>
              <select
                value={filters.currencies?.[0] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilter('currencies', value ? [value] : undefined);
                }}
                className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
              >
                <option value="">All currencies</option>
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(status => (
                  <label key={status} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.statuses?.includes(status) || false}
                      onChange={(e) => {
                        const current = filters.statuses || [];
                        const updated = e.target.checked
                          ? [...current, status]
                          : current.filter(s => s !== status);
                        setFilter('statuses', updated.length > 0 ? updated : undefined);
                      }}
                      className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                    />
                    <span className="text-sm text-[#555555] capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-[#555555] mb-1.5">Min Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="number"
                  value={filters.amountMin || ''}
                  onChange={(e) => setFilter('amountMin', e.target.value ? parseFloat(e.target.value) : undefined)}
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
                  onChange={(e) => setFilter('amountMax', e.target.value ? parseFloat(e.target.value) : undefined)}
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
          Showing {sortedInvoices.length} of {invoices.length} invoices
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
      <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAFA]">
                <th className="py-3 px-4 border-b-2 border-[#E0E0E0]">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === sortedInvoices.length && sortedInvoices.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                  />
                </th>
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'vendorName', label: 'Vendor' },
                  { key: 'invoiceNumber', label: 'Invoice #' },
                  { key: 'amountDue', label: 'Amount Due' },
                  { key: 'currency', label: 'Currency' },
                  { key: 'status', label: 'Status' },
                ].map(column => (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column.key as keyof Invoice)}
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`transition-colors duration-150 ${
                    selectedInvoices.includes(invoice.id)
                      ? 'bg-[#D1F0FA] border-l-4 border-l-[#13B5EA]'
                      : 'hover:bg-[#E5F6FC]'
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
                    {formatDate(invoice.date)}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5] text-sm text-[#1A1A1A] font-medium">
                    {invoice.vendorName}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5] font-mono text-sm text-[#13B5EA]">
                    <a href="#" className="hover:underline">{invoice.invoiceNumber}</a>
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5] text-sm text-[#1A1A1A] text-right font-mono">
                    {formatCurrency(invoice.amountDue, invoice.currency)}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5]">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E5F6FC] text-[#13B5EA]">
                      {invoice.currency}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5]">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 border-b border-[#F5F5F5]">
                    <button className="p-1.5 text-[#8A8A8A] hover:text-[#13B5EA] transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedInvoices.length === 0 && (
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
                <span className="text-sm opacity-80">Total:</span>
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
                Review & Execute
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
                        <th className="py-2 px-3 text-left text-xs font-semibold text-[#555555]">Expected CN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoices.map(id => {
                        const inv = invoices.find(i => i.id === id);
                        if (!inv) return null;
                        return (
                          <tr key={id} className="border-b border-[#F5F5F5]">
                            <td className="py-2 px-3 font-mono text-sm text-[#13B5EA]">{inv.invoiceNumber}</td>
                            <td className="py-2 px-3 text-sm text-[#1A1A1A]">{inv.vendorName}</td>
                            <td className="py-2 px-3 text-sm text-right font-mono">{formatCurrency(inv.amountDue, inv.currency)}</td>
                            <td className="py-2 px-3 font-mono text-sm text-[#555555]">CN-{inv.invoiceNumber}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Warning */}
                  <div className="flex items-start gap-3 mt-6 p-4 bg-[#FFF4E5] rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-[#FFA726] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">Please review carefully</p>
                      <p className="text-sm text-[#555555] mt-1">
                        These reversals will create AUTHORISED credit notes in Xero. This action cannot be undone.
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
                    className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors"
                  >
                    Execute Reversals
                  </button>
                </div>
              </>
            )}

            {executionStep === 'executing' && (
              <div className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-[#13B5EA] animate-spin mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Processing Reversals...</h2>
                <p className="text-[#555555]">Please wait while we create credit notes in Xero</p>
                <div className="mt-6 max-w-md mx-auto">
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#13B5EA] rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            )}

            {executionStep === 'completed' && (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-[#3BB54A]" />
                </div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Reversals Completed!</h2>
                <p className="text-[#555555] mb-6">
                  Successfully created {selectedInvoices.length} credit notes in Xero
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
