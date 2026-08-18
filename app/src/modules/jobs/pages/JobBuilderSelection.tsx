import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileUp, Pencil, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { JOB_TYPE, type JobType } from '@/types';
import { JOB_TYPE_PARAM, parseJobType } from '@/modules/jobs/navigation';

export function JobBuilderSelection() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Pre-select when the Dashboard (or a bookmark) passes ?type=...
    const [selectedType, setSelectedType] = useState<JobType | null>(parseJobType(searchParams.get(JOB_TYPE_PARAM)));

    return (
        <div className="max-w-[1000px] mx-auto animate-fade-in p-8">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-ink mb-3">Create New Job</h1>
                <p className="text-ink-mid text-lg">Select the type of job you want to build</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 relative">
                <button
                    onClick={() => setSelectedType(JOB_TYPE.INVOICE_REVERSAL)}
                    className={`text-left p-8 rounded-xl border-2 transition-all duration-200 ${selectedType === JOB_TYPE.INVOICE_REVERSAL
                            ? 'border-brand bg-brand-light shadow-[0_8px_24px_rgba(19,181,234,0.15)]'
                            : 'border-line hover:border-[#CBD5E1] bg-surface hover:shadow-lg'
                        }`}
                >
                    <div className="w-14 h-14 bg-surface rounded-lg shadow-sm flex items-center justify-center mb-6">
                        <FileSpreadsheet className={`w-7 h-7 ${selectedType === JOB_TYPE.INVOICE_REVERSAL ? 'text-brand' : 'text-ink-light'}`} />
                    </div>
                    <h3 className="text-xl font-bold text-ink mb-3">Invoice Reversal</h3>
                    <p className="text-ink-mid leading-relaxed">
                        Bulk-create credit notes against AP invoices with FX-neutral reversal.
                    </p>
                    <div className={`mt-6 inline-flex items-center text-sm font-semibold ${selectedType === JOB_TYPE.INVOICE_REVERSAL ? 'text-brand' : 'text-transparent'}`}>
                        SELECTED
                    </div>
                </button>

                <button
                    onClick={() => setSelectedType(JOB_TYPE.OVERPAYMENT_ALLOCATION)}
                    className={`text-left p-8 rounded-xl border-2 transition-all duration-200 ${selectedType === JOB_TYPE.OVERPAYMENT_ALLOCATION
                            ? 'border-brand bg-brand-light shadow-[0_8px_24px_rgba(19,181,234,0.15)]'
                            : 'border-line hover:border-[#CBD5E1] bg-surface hover:shadow-lg'
                        }`}
                >
                    <div className="w-14 h-14 bg-surface rounded-lg shadow-sm flex items-center justify-center mb-6">
                        <svg className={`w-7 h-7 ${selectedType === JOB_TYPE.OVERPAYMENT_ALLOCATION ? 'text-brand' : 'text-ink-light'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-ink mb-3">Overpayment Allocation</h3>
                    <p className="text-ink-mid leading-relaxed">
                        Allocate overpayments against outstanding bills with exact supplier matching.
                    </p>
                    <div className={`mt-6 inline-flex items-center text-sm font-semibold ${selectedType === JOB_TYPE.OVERPAYMENT_ALLOCATION ? 'text-brand' : 'text-transparent'}`}>
                        SELECTED
                    </div>
                </button>
            </div>

            {selectedType && (
                <div className="animate-slide-up bg-surface rounded-xl border border-line p-8 shadow-sm text-center">
                    <h3 className="text-xl font-semibold text-ink mb-8">How would you like to build this job?</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[600px] mx-auto">
                        <button
                            onClick={() => navigate(`/jobs/new/upload?type=${selectedType}`)}
                            className="flex flex-col items-center p-6 rounded-lg border border-line hover:border-brand hover:bg-page transition-all group"
                        >
                            <div className="w-12 h-12 bg-line-light group-hover:bg-brand-light rounded-full flex items-center justify-center mb-4 transition-colors">
                                <FileUp className="w-6 h-6 text-ink-mid group-hover:text-brand" />
                            </div>
                            <h4 className="font-semibold text-ink mb-2">Upload Excel</h4>
                            <p className="text-sm text-ink-mid text-center mb-4">
                                Upload your .xlsx file. We'll auto-detect your columns or let you map them.
                            </p>
                            <span className="mt-auto text-sm text-brand font-medium flex items-center">
                                Start Upload <ArrowRight className="w-4 h-4 ml-1" />
                            </span>
                        </button>

                        <button
                            onClick={() => navigate(`/jobs/new/manual?type=${selectedType}`)}
                            className="flex flex-col items-center p-6 rounded-lg border border-line hover:border-brand hover:bg-page transition-all group"
                        >
                            <div className="w-12 h-12 bg-line-light group-hover:bg-brand-light rounded-full flex items-center justify-center mb-4 transition-colors">
                                <Pencil className="w-6 h-6 text-ink-mid group-hover:text-brand" />
                            </div>
                            <h4 className="font-semibold text-ink mb-2">Build Manually</h4>
                            <p className="text-sm text-ink-mid text-center mb-4">
                                Search and select suppliers and bills directly from your Xero data.
                            </p>
                            <span className="mt-auto text-sm text-brand font-medium flex items-center">
                                Start Building <ArrowRight className="w-4 h-4 ml-1" />
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
