import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search,
    ArrowRight,
    Check,
    Loader2,
    Plus,
    Trash2,
    Package
} from 'lucide-react';
import { xeroService } from '@/modules/xero/services/xeroService';
import { JobReviewScreen } from '@/modules/jobs/components/JobReviewScreen';
import toast from 'react-hot-toast';

export function JobManualBuilder() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'Unknown';

    // Flow state
    const [step, setStep] = useState(1); // 1: Build Basket (Search/Select), 2: Review

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Basket state (collection of selected items from different suppliers)
    const [basket, setBasket] = useState<Record<string, {
        supplier: any;
        bills: any[];
        selectedBillIds: Set<string>;
    }>>({});

    // Current supplier interface
    const [activeSupplier, setActiveSupplier] = useState<any | null>(null);
    const [activeBills, setActiveBills] = useState<any[]>([]);
    const [isLoadingActiveBills, setIsLoadingActiveBills] = useState(false);

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
                setSuppliers(results.items || []);
            } catch (error) {
                console.error('Supplier search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectSupplier = async (supplier: any) => {
        setSearchQuery('');
        setSuppliers([]);
        setActiveSupplier(supplier);
        setIsLoadingActiveBills(true);
        try {
            const response = await xeroService.getInvoices({
                vendorId: supplier.xeroContactId,
                status: 'AUTHORISED'
            });
            setActiveBills(response.items);

            // Initialize in basket if not exists
            if (!basket[supplier.xeroContactId]) {
                setBasket(prev => ({
                    ...prev,
                    [supplier.xeroContactId]: {
                        supplier,
                        bills: response.items,
                        selectedBillIds: new Set()
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to fetch bills:', error);
            toast.error('Failed to fetch unpaid bills for this supplier');
        } finally {
            setIsLoadingActiveBills(false);
        }
    };

    const toggleBillSelection = (billId: string) => {
        if (!activeSupplier) return;

        setBasket(prev => {
            const supplierData = prev[activeSupplier.xeroContactId];
            const newSelected = new Set(supplierData.selectedBillIds);
            if (newSelected.has(billId)) {
                newSelected.delete(billId);
            } else {
                newSelected.add(billId);
            }
            return {
                ...prev,
                [activeSupplier.xeroContactId]: {
                    ...supplierData,
                    selectedBillIds: newSelected
                }
            };
        });
    };

    const removeFromBasket = (contactId: string) => {
        setBasket(prev => {
            const newState = { ...prev };
            delete newState[contactId];
            return newState;
        });
        if (activeSupplier?.xeroContactId === contactId) {
            setActiveSupplier(null);
            setActiveBills([]);
        }
    };

    const totalSelectedCount = Object.values(basket).reduce(
        (sum, data) => sum + data.selectedBillIds.size, 0
    );

    const getFlattenedJobData = () => {
        const flattened: any[] = [];
        Object.values(basket).forEach(data => {
            data.bills.forEach(bill => {
                if (data.selectedBillIds.has(bill.xeroInvoiceId)) {
                    flattened.push({
                        'Invoice Number': bill.invoiceNumber,
                        'Vendor Name': data.supplier.name,
                        'Amount': bill.amountDue,
                        'xeroInvoiceId': bill.xeroInvoiceId, // Xero UUID (for validation)
                        'dbInvoiceId': bill.id              // DB CUID (for foreign key)
                    });
                }
            });
        });
        return flattened;
    };

    if (step === 2) {
        return (
            <div className="max-w-[1200px] mx-auto p-8 animate-fade-in">
                <JobReviewScreen
                    jobType={type}
                    jobData={getFlattenedJobData()}
                    onBack={() => setStep(1)}
                />
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto animate-fade-in p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Manual Job Builder</h1>
                    <p className="text-[#555555]">Build your job by selecting suppliers and their outstanding bills from Xero.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-[#E5F6FC] px-4 py-2 rounded-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#13B5EA]" />
                        <span className="font-bold text-[#13B5EA]">{totalSelectedCount} Invoices Selected</span>
                    </div>
                    <button
                        disabled={totalSelectedCount === 0}
                        onClick={() => setStep(2)}
                        className="px-8 py-2.5 bg-[#13B5EA] text-white rounded-lg font-bold hover:bg-[#0E92BC] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                    >
                        Review & Proceed <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Supplier Selection & Basket */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Search */}
                    <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-[#13B5EA]" /> Add Supplier
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                            <input
                                type="text"
                                placeholder="Search Xero contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 border border-[#E0E0E0] rounded-lg text-sm focus:border-[#13B5EA] focus:outline-none transition-all"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 text-[#13B5EA] animate-spin" />
                                </div>
                            )}
                        </div>

                        {suppliers.length > 0 && (
                            <div className="mt-4 border border-[#F5F5F5] rounded-lg overflow-hidden divide-y divide-[#F5F5F5] max-h-60 overflow-y-auto shadow-lg bg-white">
                                {suppliers.map(s => (
                                    <button
                                        key={s.xeroContactId}
                                        onClick={() => handleSelectSupplier(s)}
                                        className="w-full text-left p-3 text-sm hover:bg-[#E5F6FC] transition-colors flex items-center justify-between group"
                                    >
                                        <span className="font-medium text-[#1A1A1A] group-hover:text-[#13B5EA] truncate">{s.name}</span>
                                        <ArrowRight className="w-4 h-4 text-[#E0E0E0] group-hover:text-[#13B5EA]" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Basket / Selected Suppliers */}
                    <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-[#FAFAFA] border-b border-[#E0E0E0] font-bold text-xs text-[#555555] uppercase tracking-wider">
                            Selected Suppliers
                        </div>
                        <div className="divide-y divide-[#F5F5F5]">
                            {Object.values(basket).length === 0 ? (
                                <div className="p-8 text-center text-[#8A8A8A] text-sm italic">
                                    No suppliers selected yet
                                </div>
                            ) : (
                                Object.values(basket).map(item => (
                                    <div
                                        key={item.supplier.xeroContactId}
                                        className={`p-4 transition-colors cursor-pointer flex items-center justify-between group ${activeSupplier?.xeroContactId === item.supplier.xeroContactId ? 'bg-[#E5F6FC]' : 'hover:bg-[#FAFAFA]'}`}
                                        onClick={() => handleSelectSupplier(item.supplier)}
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#1A1A1A] truncate">{item.supplier.name}</p>
                                            <p className="text-xs text-[#13B5EA] font-bold">{item.selectedBillIds.size} invoices selected</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFromBasket(item.supplier.xeroContactId); }}
                                            className="p-2 text-[#8A8A8A] hover:text-[#E53935] hover:bg-[#FFEBEE] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Bill Selection */}
                <div className="lg:col-span-2">
                    {activeSupplier ? (
                        <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-sm animate-slide-up overflow-hidden">
                            <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-[#1A1A1A]">{activeSupplier.name}</h3>
                                    <p className="text-sm text-[#555555]">Select outstanding invoices to include in the job</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-[#13B5EA]">
                                        {basket[activeSupplier.xeroContactId]?.selectedBillIds.size || 0}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-[#8A8A8A] tracking-wider">Selected</p>
                                </div>
                            </div>

                            {isLoadingActiveBills ? (
                                <div className="p-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-10 h-10 text-[#13B5EA] animate-spin" />
                                    <p className="text-[#555555] font-medium">Fetching Xero data...</p>
                                </div>
                            ) : (
                                <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
                                    <table className="w-full">
                                        <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0] sticky top-0">
                                            <tr>
                                                <th className="py-3 px-6 text-left w-12"></th>
                                                <th className="py-3 px-6 text-left text-xs font-bold text-[#555555] uppercase tracking-wider">Invoice #</th>
                                                <th className="py-3 px-6 text-left text-xs font-bold text-[#555555] uppercase tracking-wider">Date</th>
                                                <th className="py-3 px-6 text-right text-xs font-bold text-[#555555] uppercase tracking-wider">Due Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F5F5F5]">
                                            {activeBills.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center text-[#8A8A8A]">
                                                        <Package className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                                        <p className="font-medium text-lg">No outstanding bills found</p>
                                                        <p className="text-sm">This supplier has no unpaid AUTHORISED invoices in Xero.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                activeBills.map(bill => {
                                                    const isSelected = basket[activeSupplier.xeroContactId]?.selectedBillIds.has(bill.xeroInvoiceId);
                                                    return (
                                                        <tr
                                                            key={bill.xeroInvoiceId}
                                                            onClick={() => toggleBillSelection(bill.xeroInvoiceId)}
                                                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#E5F6FC]' : 'hover:bg-[#F9FAFB]'}`}
                                                        >
                                                            <td className="py-4 px-6">
                                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#13B5EA] border-[#13B5EA]' : 'border-[#E0E0E0]'}`}>
                                                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 font-mono text-xs font-bold text-[#1A1A1A]">{bill.invoiceNumber}</td>
                                                            <td className="py-4 px-6 text-xs text-[#555555]">{new Date(bill.invoiceDate).toLocaleDateString()}</td>
                                                            <td className="py-4 px-6 text-right font-mono font-bold text-[#1A1A1A]">
                                                                ${Number(bill.amountDue || 0).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-[#FAFAFA] border-2 border-dashed border-[#E0E0E0] rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                                <Search className="w-8 h-8 text-[#E0E0E0]" />
                            </div>
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">No Supplier Active</h3>
                            <p className="text-[#555555] max-w-xs">
                                Search and select a supplier on the left to start adding invoices to your job.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
