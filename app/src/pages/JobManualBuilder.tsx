import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  User, 
  ArrowRight, 
  Check, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { xeroService } from '@/services/xeroService';
import { JobReviewScreen } from '@/components/JobReviewScreen';
import toast from 'react-hot-toast';

export function JobManualBuilder() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'Unknown';
    
    // Flow state
    const [step, setStep] = useState(1); // 1: Search Supplier, 2: Select Bills, 3: Review
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Selection state
    const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
    const [bills, setBills] = useState<any[]>([]);
    const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
    const [isLoadingBills, setIsLoadingBills] = useState(false);

    // Search for suppliers
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 3) {
            setSuppliers([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await xeroService.getContacts({ 
                    search: searchQuery,
                    isSupplier: true 
                });
                setSuppliers(results);
            } catch (error) {
                console.error('Supplier search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Fetch bills when supplier is selected
    const handleSelectSupplier = async (supplier: any) => {
        setSelectedSupplier(supplier);
        setIsLoadingBills(true);
        try {
            const response = await xeroService.getInvoices({
                vendorId: supplier.ContactID,
                status: 'AUTHORISED'
            });
            setBills(response.items);
            setStep(2);
        } catch (error) {
            console.error('Failed to fetch bills:', error);
            toast.error('Failed to fetch unpaid bills for this supplier');
        } finally {
            setIsLoadingBills(false);
        }
    };

    const toggleBillSelection = (billId: string) => {
        const newSelected = new Set(selectedBillIds);
        if (newSelected.has(billId)) {
            newSelected.delete(billId);
        } else {
            newSelected.add(billId);
        }
        setSelectedBillIds(newSelected);
    };

    const getSelectedBillsData = () => {
        return bills
            .filter(bill => selectedBillIds.has(bill.xeroInvoiceId))
            .map(bill => ({
                'Invoice Number': bill.invoiceNumber,
                'Vendor Name': selectedSupplier.Name,
                'Amount': bill.amountDue
            }));
    };

    if (step === 3) {
        return (
            <div className="max-w-[1200px] mx-auto p-8 animate-fade-in">
                <JobReviewScreen 
                    jobType={type} 
                    jobData={getSelectedBillsData()} 
                    onBack={() => setStep(2)} 
                />
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto animate-fade-in p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Manual Job Builder</h1>
                <div className="flex items-center gap-2 text-sm">
                    <span className={step >= 1 ? 'text-[#13B5EA] font-semibold' : 'text-[#8A8A8A]'}>1. Select Supplier</span>
                    <ChevronRight className="w-4 h-4 text-[#E0E0E0]" />
                    <span className={step >= 2 ? 'text-[#13B5EA] font-semibold' : 'text-[#8A8A8A]'}>2. Select Bills</span>
                    <ChevronRight className="w-4 h-4 text-[#E0E0E0]" />
                    <span className={step >= 3 ? 'text-[#13B5EA] font-semibold' : 'text-[#8A8A8A]'}>3. Review</span>
                </div>
            </div>

            {step === 1 && (
                <div className="space-y-6">
                    <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 shadow-sm">
                        <div className="max-w-xl">
                            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Find a Supplier</h3>
                            <p className="text-sm text-[#555555] mb-6">Search for a vendor in Xero to see their outstanding bills.</p>
                            
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A8A8A]" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Start typing supplier name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 border border-[#E0E0E0] rounded-lg text-sm focus:border-[#13B5EA] focus:outline-none focus:ring-4 focus:ring-[#13B5EA]/10 transition-all"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-5 h-5 text-[#13B5EA] animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {suppliers.length > 0 && (
                        <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden shadow-sm animate-slide-up">
                            <div className="divide-y divide-[#F5F5F5]">
                                {suppliers.map((s) => (
                                    <button
                                        key={s.ContactID}
                                        onClick={() => handleSelectSupplier(s)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-[#E5F6FC] transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center text-[#8A8A8A] group-hover:bg-white group-hover:text-[#13B5EA] transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-[#1A1A1A]">{s.Name}</p>
                                                <p className="text-xs text-[#8A8A8A]">{s.EmailAddress || 'No email recorded'}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[#E0E0E0] group-hover:text-[#13B5EA] transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchQuery.length >= 3 && suppliers.length === 0 && !isSearching && (
                        <div className="bg-[#FAFAFA] border border-dashed border-[#E0E0E0] rounded-xl p-12 text-center">
                            <p className="text-[#8A8A8A]">No suppliers found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            )}

            {step === 2 && selectedSupplier && (
                <div className="space-y-6">
                    <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setStep(1)}
                                className="p-2 hover:bg-[#F5F5F5] rounded-full text-[#555555] transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h3 className="font-bold text-[#1A1A1A]">{selectedSupplier.Name}</h3>
                                <p className="text-sm text-[#555555]">Select which invoices to include in the {type.replace('_', ' ').toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="bg-[#E5F6FC] text-[#13B5EA] px-4 py-2 rounded-lg font-bold">
                            {selectedBillIds.size} Selected
                        </div>
                    </div>

                    <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                                <tr>
                                    <th className="py-3 px-6 text-left w-12">
                                        {/* Header checkbox could go here for Select All */}
                                    </th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold text-[#555555] uppercase">Invoice #</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold text-[#555555] uppercase">Date</th>
                                    <th className="py-3 px-6 text-right text-xs font-semibold text-[#555555] uppercase">Total</th>
                                    <th className="py-3 px-6 text-right text-xs font-semibold text-[#555555] uppercase">Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5F5F5]">
                                {bills.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-[#8A8A8A]">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                            No outstanding bills found for this supplier.
                                        </td>
                                    </tr>
                                ) : (
                                    bills.map((bill) => (
                                        <tr 
                                            key={bill.id} 
                                            onClick={() => toggleBillSelection(bill.xeroInvoiceId)}
                                            className={`cursor-pointer transition-colors ${selectedBillIds.has(bill.xeroInvoiceId) ? 'bg-[#E5F6FC]' : 'hover:bg-[#F9FAFB]'}`}
                                        >
                                            <td className="py-4 px-6">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedBillIds.has(bill.xeroInvoiceId) ? 'bg-[#13B5EA] border-[#13B5EA]' : 'border-[#E0E0E0]'}`}>
                                                    {selectedBillIds.has(bill.xeroInvoiceId) && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-sm text-[#1A1A1A]">{bill.invoiceNumber}</td>
                                            <td className="py-4 px-6 text-sm text-[#555555]">{new Date(bill.invoiceDate).toLocaleDateString()}</td>
                                            <td className="py-4 px-6 text-right text-sm font-medium text-[#555555]">${bill.total.toFixed(2)}</td>
                                            <td className="py-4 px-6 text-right text-sm font-bold text-[#1A1A1A]">${bill.amountDue.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setStep(1)}
                            className="px-6 py-2.5 border border-[#E0E0E0] text-[#555555] hover:bg-[#FAFAFA] rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={selectedBillIds.size === 0}
                            onClick={() => setStep(3)}
                            className="px-8 py-2.5 bg-[#13B5EA] text-white rounded-lg font-bold hover:bg-[#0E92BC] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                        >
                            Review & Proceed
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
