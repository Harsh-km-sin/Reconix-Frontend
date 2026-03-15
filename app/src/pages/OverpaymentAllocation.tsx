import { useState, useMemo, useEffect } from 'react';
import type { Overpayment, Invoice } from '@/types';
import { xeroService } from '@/services/xeroService';
import { jobService } from '@/services/jobService';
import { AlertTriangle, Loader2, RefreshCw, Search, CreditCard, Calendar, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export function OverpaymentAllocation() {
  const { user } = useAuth();
  const isApprover = user?.role === 'ADMIN' || user?.role === 'APPROVER';

  const [overpayments, setOverpayments] = useState<Overpayment[]>([]);
  const [bills, setBills] = useState<Invoice[]>([]);
  const [isLoadingOps, setIsLoadingOps] = useState(true);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [selectedOverpaymentId, setSelectedOverpaymentId] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationComplete, setAllocationComplete] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  const fetchOverpayments = async () => {
    setIsLoadingOps(true);
    try {
      const response = await xeroService.getOverpayments({
        search: searchQuery,
      });
      setOverpayments(response.items);
    } catch (error) {
      console.error('Failed to fetch overpayments:', error);
      toast.error('Failed to load overpayments');
    } finally {
      setIsLoadingOps(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOverpayments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectedOp = useMemo(() => {
    return overpayments.find(op => op.id === selectedOverpaymentId);
  }, [selectedOverpaymentId, overpayments]);

  const fetchBills = async (contactId: string) => {
    setIsLoadingBills(true);
    try {
      const response = await xeroService.getInvoices({
        vendorId: contactId,
        status: 'AUTHORISED',
      });
      // In Xero, "Bills" are just invoices with type ACCPAY (usually handled by backend filtering or context)
      // For this UI, we just show AUTHORISED invoices for that contact
      setBills(response.items);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      toast.error('Failed to load outstanding bills');
    } finally {
      setIsLoadingBills(false);
    }
  };

  useEffect(() => {
    if (selectedOp?.contact?.xeroContactId) {
      fetchBills(selectedOp.contact.xeroContactId);
      setSelectedBills([]);
    } else {
      setBills([]);
    }
  }, [selectedOp]);

  const selectedTotal = useMemo(() => {
    return selectedBills.reduce((sum, billId) => {
      const bill = bills.find(b => b.id === billId);
      return sum + (bill?.amountDue || 0);
    }, 0);
  }, [selectedBills, bills]);

  const remainingCredit = useMemo(() => {
    if (!selectedOp) return 0;
    return selectedOp.remainingCredit - selectedTotal;
  }, [selectedOp, selectedTotal]);

  const toggleBillSelection = (billId: string) => {
    setSelectedBills(prev => {
      if (prev.includes(billId)) {
        return prev.filter(id => id !== billId);
      }
      const bill = bills.find(b => b.id === billId);
      if (bill && selectedTotal + bill.amountDue <= (selectedOp?.remainingCredit || 0)) {
        return [...prev, billId];
      }
      return prev;
    });
  };

  const handleAllocate = async () => {
    if (!selectedOp) return;
    setIsAllocating(true);

    try {
      // 1. Create Job
      const job = await jobService.createJob({
        jobType: 'OVERPAYMENT_ALLOCATION',
        notes: `Allocation of overpayment ${selectedOp.xeroOverpaymentId} to ${selectedBills.length} bills`
      });

      setCreatedJobId(job.id);

      // 2. Add Items
      // For overpayment allocation, each item is one allocation (Overpayment -> Invoice)
      const items = selectedBills.map(billId => {
        const bill = bills.find(b => b.id === billId);
        return {
          itemType: 'OVERPAYMENT' as const,
          xeroOverpaymentId: selectedOp.xeroOverpaymentId,
          xeroInvoiceId: bill?.xeroInvoiceId,
          invoiceNumber: bill?.invoiceNumber,
          contactName: selectedOp.contact?.name,
          expectedAmount: bill?.amountDue
        };
      });

      await jobService.addItems(job.id, items);

      // 3. Approve Job
      if (isApprover) {
        await jobService.approveJob(job.id);
        toast.success('Allocation job created and scheduled');
      } else {
        toast.success('Allocation job created and submitted for approval');
      }

      setAllocationComplete(true);
    } catch (error) {
      console.error('Allocation failed:', error);
      toast.error('Failed to create allocation job');
    } finally {
      setIsAllocating(false);
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

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Overpayment Allocation</h1>
          <p className="text-[#555555]">Match overpayments to outstanding bills</p>
        </div>
        <button
          onClick={fetchOverpayments}
          className="flex items-center gap-2 px-4 py-2 border border-[#E0E0E0] rounded-lg text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingOps ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Split View */}
      <div className="flex gap-6 h-[calc(100%-80px)]">
        {/* Left Panel - Overpayments */}
        <div className={`${selectedOverpaymentId ? 'w-[40%]' : 'w-full'} flex flex-col transition-all duration-300`}>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vendor or OP ID..."
              className="w-full h-11 pl-10 pr-4 border border-[#E0E0E0] rounded-lg text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
            />
          </div>

          {/* Overpayment Cards */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 relative">
            {isLoadingOps && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-[#13B5EA] animate-spin" />
              </div>
            )}
            {overpayments.map((op) => (
              <button
                key={op.id}
                onClick={() => {
                  setSelectedOverpaymentId(op.id);
                }}
                className={`w-full text-left p-5 rounded-lg border transition-all duration-250 ${selectedOverpaymentId === op.id
                  ? 'bg-[#E5F6FC] border-[#13B5EA] border-l-4'
                  : 'bg-white border-[#E0E0E0] hover:border-[#13B5EA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[#1A1A1A]">{op.contact?.name || 'Unknown Vendor'}</h3>
                  <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#3BB54A] text-xs font-semibold rounded-full">
                    {op.status || 'Available'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8A8A8A] font-mono">{op.xeroOverpaymentId}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#8A8A8A]">
                      <Calendar className="w-3 h-3" />
                      {formatDate(op.overpaymentDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#8A8A8A]">Remaining</p>
                    <p className="text-lg font-bold text-[#3BB54A]">
                      {formatCurrency(op.remainingCredit, op.currencyCode)}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {!isLoadingOps && overpayments.length === 0 && (
              <div className="text-center py-12 bg-white border border-dashed border-[#E0E0E0] rounded-lg">
                <CreditCard className="w-12 h-12 text-[#E0E0E0] mx-auto mb-4" />
                <p className="text-[#8A8A8A]">No overpayments found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Bills */}
        {selectedOverpaymentId && selectedOp && (
          <div className="flex-1 flex flex-col bg-white border border-[#E0E0E0] rounded-lg animate-slide-in-right relative">
            {isLoadingBills && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-[#13B5EA] animate-spin" />
              </div>
            )}
            {/* Header */}
            <div className="p-5 border-b border-[#E0E0E0]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Bills for {selectedOp.contact?.name}</h3>
                <button
                  onClick={() => {
                    setSelectedOverpaymentId(null);
                  }}
                  className="p-1.5 text-[#8A8A8A] hover:text-[#555555] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[#555555]">
                Select bills to allocate against {selectedOp.xeroOverpaymentId}
              </p>
            </div>

            {/* Bills Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              {bills.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-[1]">
                    <tr className="border-b border-[#E0E0E0]">
                      <th className="py-3 px-4 text-left">
                        <input
                          type="checkbox"
                          checked={bills.length > 0 && selectedBills.length === bills.length}
                          onChange={() => {
                            if (selectedBills.length === bills.length) {
                              setSelectedBills([]);
                            } else {
                              setSelectedBills(bills.map(b => b.id));
                            }
                          }}
                          className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                        />
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold uppercase text-[#555555]">Invoice #</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold uppercase text-[#555555]">Date</th>
                      <th className="py-3 px-4 text-right text-xs font-semibold uppercase text-[#555555]">Amount Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr
                        key={bill.id}
                        className={`border-b border-[#F5F5F5] transition-colors ${selectedBills.includes(bill.id) ? 'bg-[#E5F6FC]' : 'hover:bg-[#FAFAFA]'
                          }`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedBills.includes(bill.id)}
                            onChange={() => toggleBillSelection(bill.id)}
                            className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-[#13B5EA]">{bill.invoiceNumber}</td>
                        <td className="py-3 px-4 text-sm text-[#555555]">{formatDate(bill.invoiceDate)}</td>
                        <td className="py-3 px-4 text-right font-mono text-sm text-[#1A1A1A]">
                          {formatCurrency(bill.amountDue, bill.currencyCode)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#8A8A8A]">No outstanding bills for this vendor</p>
                </div>
              )}
            </div>

            {/* Bottom Bar - Calculator */}
            <div className="p-5 border-t border-[#E0E0E0] bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-sm text-[#8A8A8A]">Selected</p>
                    <p className="text-xl font-bold text-[#1A1A1A]">
                      {formatCurrency(selectedTotal, selectedOp.currencyCode)}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-[#E0E0E0]" />
                  <div>
                    <p className="text-sm text-[#8A8A8A]">Remaining Credit</p>
                    <p className={`text-xl font-bold ${remainingCredit >= 0 ? 'text-[#3BB54A]' : 'text-[#E53935]'}`}>
                      {formatCurrency(remainingCredit, selectedOp.currencyCode)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={selectedBills.length === 0 || remainingCredit < 0}
                  className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md font-semibold text-sm transition-all duration-150 hover:bg-[#0E92BC] hover:scale-[1.02] active:scale-[0.98] disabled:bg-[#E0E0E0] disabled:text-[#8A8A8A] disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Allocate Selected Bills
                </button>
              </div>

              {remainingCredit < 0 && (
                <div className="flex items-center gap-2 text-sm text-[#E53935]">
                  <AlertTriangle className="w-4 h-4" />
                  Total exceeds available credit. Please deselect some bills.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[500px] animate-scale-in">
            {!allocationComplete ? (
              <>
                <div className="p-6 border-b border-[#E0E0E0]">
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">Confirm Allocation</h2>
                </div>

                <div className="p-6">
                  <div className="bg-[#E5F6FC] rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#555555]">Overpayment</p>
                        <p className="font-mono text-sm text-[#13B5EA]">{selectedOp?.xeroOverpaymentId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Bills Selected</p>
                        <p className="text-lg font-bold text-[#13B5EA]">{selectedBills.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Total Allocation</p>
                        <p className="text-lg font-bold text-[#13B5EA]">
                          {formatCurrency(selectedTotal, selectedOp?.currencyCode || 'USD')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Remaining After</p>
                        <p className="text-lg font-bold text-[#3BB54A]">
                          {formatCurrency(remainingCredit, selectedOp?.currencyCode || 'USD')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-[#FFF4E5] rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-[#FFA726] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#555555]">
                      This will create a background job to allocate the overpayment against the selected bills in Xero.
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t border-[#E0E0E0] flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isAllocating}
                    className="px-6 py-2.5 border border-[#E0E0E0] text-[#555555] rounded-md text-sm font-medium hover:border-[#13B5EA] hover:text-[#13B5EA] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAllocate}
                    disabled={isAllocating}
                    className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAllocating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isAllocating ? 'Creating Job...' : isApprover ? 'Confirm & Schedule' : 'Submit for Approval'}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-[#3BB54A]" />
                </div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">{isApprover ? 'Job Scheduled!' : 'Job Submitted!'}</h2>
                <p className="text-[#555555] mb-6">
                  Successfully created Job #{createdJobId?.substring(createdJobId.length - 8).toUpperCase()}.
                  {isApprover ? ' The worker will process these allocations in Xero shortly.' : ' Waiting for approver to authorize execution.'}
                </p>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setAllocationComplete(false);
                    setSelectedOverpaymentId(null);
                    setSelectedBills([]);
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
