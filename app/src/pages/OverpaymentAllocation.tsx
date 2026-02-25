import { useState, useMemo } from 'react';
import type { Overpayment, Bill } from '@/types';
import { Search, CreditCard, Calendar, Check, X, AlertTriangle, Loader2 } from 'lucide-react';

const overpayments: Overpayment[] = [];
const bills: Bill[] = [];

export function OverpaymentAllocation() {
  const [selectedOverpayment, setSelectedOverpayment] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationComplete, setAllocationComplete] = useState(false);

  const filteredOverpayments = useMemo(() => {
    return overpayments.filter(op => 
      op.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.overpaymentId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const selectedOp = useMemo(() => {
    return overpayments.find(op => op.id === selectedOverpayment);
  }, [selectedOverpayment]);

  const matchedBills = useMemo(() => {
    if (!selectedOp) return [];
    return bills.filter(bill => bill.vendorId === selectedOp.vendorId);
  }, [selectedOp]);

  const selectedTotal = useMemo(() => {
    return selectedBills.reduce((sum, billId) => {
      const bill = bills.find(b => b.id === billId);
      return sum + (bill?.amountDue || 0);
    }, 0);
  }, [selectedBills]);

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
    setIsAllocating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAllocating(false);
    setAllocationComplete(true);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Overpayment Allocation</h1>
        <p className="text-[#555555]">Match overpayments to outstanding bills</p>
      </div>

      {/* Split View */}
      <div className="flex gap-6 h-[calc(100%-80px)]">
        {/* Left Panel - Overpayments */}
        <div className={`${selectedOverpayment ? 'w-[45%]' : 'w-full'} flex flex-col transition-all duration-300`}>
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
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            {filteredOverpayments.map((op) => (
              <button
                key={op.id}
                onClick={() => {
                  setSelectedOverpayment(op.id);
                  setSelectedBills([]);
                }}
                className={`w-full text-left p-5 rounded-lg border transition-all duration-250 ${
                  selectedOverpayment === op.id
                    ? 'bg-[#E5F6FC] border-[#13B5EA] border-l-4'
                    : 'bg-white border-[#E0E0E0] hover:border-[#13B5EA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[#1A1A1A]">{op.vendorName}</h3>
                  <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#3BB54A] text-xs font-semibold rounded-full">
                    Available
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8A8A8A] font-mono">{op.overpaymentId}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#8A8A8A]">
                      <Calendar className="w-3 h-3" />
                      {formatDate(op.paymentDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#8A8A8A]">Remaining</p>
                    <p className="text-lg font-bold text-[#3BB54A]">
                      {formatCurrency(op.remainingCredit, op.currency)}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {filteredOverpayments.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-[#E0E0E0] mx-auto mb-4" />
                <p className="text-[#8A8A8A]">No overpayments found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Bills */}
        {selectedOverpayment && selectedOp && (
          <div className="flex-1 flex flex-col bg-white border border-[#E0E0E0] rounded-lg animate-slide-in-right">
            {/* Header */}
            <div className="p-5 border-b border-[#E0E0E0]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Bills for {selectedOp.vendorName}</h3>
                <button
                  onClick={() => {
                    setSelectedOverpayment(null);
                    setSelectedBills([]);
                  }}
                  className="p-1.5 text-[#8A8A8A] hover:text-[#555555] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[#555555]">
                Select bills to allocate against {selectedOp.overpaymentId}
              </p>
            </div>

            {/* Bills Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              {matchedBills.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-[#E0E0E0]">
                      <th className="py-3 px-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedBills.length === matchedBills.length}
                          onChange={() => {
                            if (selectedBills.length === matchedBills.length) {
                              setSelectedBills([]);
                            } else {
                              setSelectedBills(matchedBills.map(b => b.id));
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
                    {matchedBills.map((bill) => (
                      <tr
                        key={bill.id}
                        className={`border-b border-[#F5F5F5] transition-colors ${
                          selectedBills.includes(bill.id) ? 'bg-[#E5F6FC]' : 'hover:bg-[#FAFAFA]'
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
                        <td className="py-3 px-4 text-sm text-[#555555]">{formatDate(bill.date)}</td>
                        <td className="py-3 px-4 text-right font-mono text-sm text-[#1A1A1A]">
                          {formatCurrency(bill.amountDue, bill.currency)}
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
                      {formatCurrency(selectedTotal, selectedOp.currency)}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-[#E0E0E0]" />
                  <div>
                    <p className="text-sm text-[#8A8A8A]">Remaining Credit</p>
                    <p className={`text-xl font-bold ${remainingCredit >= 0 ? 'text-[#3BB54A]' : 'text-[#E53935]'}`}>
                      {formatCurrency(remainingCredit, selectedOp.currency)}
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
                        <p className="font-mono text-sm text-[#13B5EA]">{selectedOp?.overpaymentId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Bills Selected</p>
                        <p className="text-lg font-bold text-[#13B5EA]">{selectedBills.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Total Allocation</p>
                        <p className="text-lg font-bold text-[#13B5EA]">
                          {formatCurrency(selectedTotal, selectedOp?.currency || 'USD')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#555555]">Remaining After</p>
                        <p className="text-lg font-bold text-[#3BB54A]">
                          {formatCurrency(remainingCredit, selectedOp?.currency || 'USD')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-[#FFF4E5] rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-[#FFA726] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#555555]">
                      This will allocate the overpayment against the selected bills in Xero. This action cannot be undone.
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
                    {isAllocating ? 'Allocating...' : 'Confirm Allocation'}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-[#3BB54A]" />
                </div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Allocation Complete!</h2>
                <p className="text-[#555555] mb-6">
                  Successfully allocated {formatCurrency(selectedTotal, selectedOp?.currency || 'USD')} across {selectedBills.length} bills
                </p>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setAllocationComplete(false);
                    setSelectedOverpayment(null);
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
