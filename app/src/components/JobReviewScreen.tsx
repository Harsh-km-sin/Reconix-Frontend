import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Check, 
  Loader2, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobService } from '@/services/jobService';
import { validationService, type ValidationReportItem } from '@/services/validationService';
import { useAuth } from '@/hooks/useAuth';

export function JobReviewScreen({
    jobType,
    jobData,
    onBack
}: {
    jobType: string;
    jobData: any[];
    onBack: () => void;
}) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isApprover = user?.role === 'ADMIN' || user?.role === 'APPROVER';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [validationReports, setValidationReports] = useState<Record<string, ValidationReportItem>>({});
    const [acknowledged, setAcknowledged] = useState(false);
    const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0]);
    const [jobName, setJobName] = useState('');

    const totalAmount = jobData.reduce((sum, item) => sum + Number(item.Amount || 0), 0);

    // Run live validation on load
    useEffect(() => {
        const runValidation = async () => {
            setIsValidating(true);
            try {
                const itemsToValidate = jobData.map((row, i) => ({
                    id: `item-${i}`,
                    itemType: jobType === 'INVOICE_REVERSAL' ? 'INVOICE_REVERSAL' : 'OVERPAYMENT_ALLOCATION',
                    invoiceNumber: row['Invoice Number'],
                    expectedAmount: Number(row.Amount),
                    contactName: row['Vendor Name']
                }));

                const response = await validationService.runValidation({ items: itemsToValidate });
                const reportMap: Record<string, ValidationReportItem> = {};
                response.report.forEach(r => {
                    reportMap[r.id] = r;
                });
                setValidationReports(reportMap);
            } catch (error) {
                console.error('Validation failed:', error);
                toast.error('Live Xero validation failed. Check your connection.');
            } finally {
                setIsValidating(false);
            }
        };

        runValidation();
    }, [jobData, jobType]);

    const globalStatus = Object.values(validationReports).reduce((status, r) => {
        if (r.status === 'ERROR' || r.status === 'INVALID') return 'INVALID';
        if (r.status === 'WARNING' && status !== 'INVALID') return 'WARNING';
        return status;
    }, 'VALID' as 'VALID' | 'WARNING' | 'INVALID');

    const handleSubmit = async () => {
        if (globalStatus === 'INVALID') {
            toast.error('Cannot submit job with validation errors');
            return;
        }
        if (globalStatus === 'WARNING' && !acknowledged) {
            toast.error('Please acknowledge the warnings before proceeding');
            return;
        }

        setIsSubmitting(true);
        try {
            const job = await jobService.createJob({
                jobType: jobType as any,
                reversalDate: jobType === 'INVOICE_REVERSAL' ? reversalDate : undefined,
                notes: jobName || `${jobType.replace('_', ' ')} manual build`
            });

            const items = jobData.map(row => ({
                itemType: jobType === 'INVOICE_REVERSAL' ? 'INVOICE' : 'OVERPAYMENT',
                invoiceNumber: row['Invoice Number'],
                contactName: row['Vendor Name'],
                expectedAmount: Number(row.Amount)
            }));

            await jobService.addItems(job.id, items);

            if (isApprover) {
                await jobService.approveJob(job.id);
                toast.success('Job created and scheduled for execution!');
            } else {
                toast.success('Job submitted for approval!');
            }

            navigate('/history');
        } catch (error) {
            console.error('Job submission failed:', error);
            toast.error('Failed to submit job');
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden animate-slide-up shadow-lg">
            <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors text-[#555555]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-[#1A1A1A]">Pre-flight Review</h2>
                        <p className="text-sm text-[#555555]">Verify mapped data against live Xero records</p>
                    </div>
                </div>
                {isValidating ? (
                   <div className="flex items-center gap-2 text-[#13B5EA] text-sm font-semibold animate-pulse">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       Running Live Validation...
                   </div>
                ) : (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                        globalStatus === 'VALID' ? 'bg-[#E8F5E9] text-[#3BB54A] ring-[#3BB54A]/30' :
                        globalStatus === 'WARNING' ? 'bg-[#FFF4E5] text-[#FFA726] ring-[#FFA726]/30' :
                        'bg-[#FFEBEE] text-[#E53935] ring-[#E53935]/30'
                    }`}>
                        {globalStatus === 'VALID' ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {globalStatus === 'VALID' ? 'Validation Passed' : globalStatus === 'WARNING' ? 'Warnings Detected' : 'Validation Failed'}
                    </div>
                )}
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Job Options */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide mb-4">Job Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#555555] mb-1.5">Job Name</label>
                                <input
                                    type="text"
                                    value={jobName}
                                    onChange={(e) => setJobName(e.target.value)}
                                    placeholder="e.g., February Vendor Recon"
                                    className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
                                />
                            </div>

                            {jobType === 'INVOICE_REVERSAL' && (
                                <div>
                                    <label className="block text-sm font-medium text-[#555555] mb-1.5">Reversal Date</label>
                                    <input
                                        type="date"
                                        value={reversalDate}
                                        onChange={(e) => setReversalDate(e.target.value)}
                                        className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#E5F6FC] rounded-xl p-5 shadow-inner">
                        <h3 className="text-sm font-semibold text-[#13B5EA] uppercase tracking-wide mb-3">Submission Summary</h3>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[#555555]">Total Items</span>
                            <span className="font-bold text-[#1A1A1A] text-lg">{jobData.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[#555555]">Total Value</span>
                            <span className="font-bold text-[#13B5EA] text-lg">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    {globalStatus === 'WARNING' && (
                        <div className="bg-[#FFF4E5] border border-[#FFE0B2] rounded-xl p-5">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-[#FFA726] uppercase tracking-wide mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                Acknowledgement Required
                            </h4>
                            <p className="text-xs text-[#555555] mb-4">Some items have warnings (e.g., amount or contact mismatches). Do you wish to proceed anyway?</p>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={acknowledged}
                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#FFA726] text-[#FFA726] focus:ring-[#FFA726]"
                                />
                                <span className="text-sm font-semibold text-[#1A1A1A]">I acknowledge these warnings</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Right Col: Data Review */}
                <div className="lg:col-span-2">
                    <div className="border border-[#E0E0E0] rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin">
                            <table className="w-full text-sm">
                                <thead className="bg-[#FAFAFA] sticky top-0 shadow-sm border-b border-[#E0E0E0] z-10">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555]">Status</th>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555]">Reference</th>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555]">Vendor</th>
                                        <th className="py-3 px-4 text-right font-semibold text-[#555555]">Amount</th>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555]">Issues</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F5F5F5]">
                                    {jobData.map((row, i) => {
                                        const report = validationReports[`item-${i}`];
                                        return (
                                            <tr key={i} className={`hover:bg-[#FAFAFA] transition-colors ${report?.status === 'INVALID' ? 'bg-[#FFEBEE]/30' : ''}`}>
                                                <td className="py-3 px-4">
                                                    {isValidating ? (
                                                        <Loader2 className="w-4 h-4 text-[#13B5EA] animate-spin" />
                                                    ) : report?.status === 'VALID' ? (
                                                        <CheckCircle2 className="w-4 h-4 text-[#3BB54A]" />
                                                    ) : report?.status === 'WARNING' ? (
                                                        <AlertCircle className="w-4 h-4 text-[#FFA726]" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-[#E53935]" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-[#13B5EA] whitespace-nowrap">
                                                    {row['Invoice Number'] || row['Reference'] || '—'}
                                                </td>
                                                <td className="py-3 px-4 text-[#1A1A1A] font-medium">{row['Vendor Name'] || '—'}</td>
                                                <td className="py-3 px-4 text-right font-mono text-[#1A1A1A]">
                                                    {formatCurrency(Number(row.Amount) || 0)}
                                                </td>
                                                <td className="py-3 px-4 max-w-[200px]">
                                                    {report?.errors.map((err, idx) => (
                                                        <p key={idx} className="text-[10px] text-[#E53935] font-semibold">{err}</p>
                                                    ))}
                                                    {report?.warnings.map((warn, idx) => (
                                                        <p key={idx} className="text-[10px] text-[#FFA726] font-semibold">{warn}</p>
                                                    ))}
                                                    {report?.status === 'VALID' && <span className="text-[10px] text-[#3BB54A]">Matched</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-[#E0E0E0] flex justify-end gap-3 bg-[#FAFAFA]">
                <button
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 border border-[#E0E0E0] text-[#555555] bg-white rounded-md font-medium hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
                >
                    Back to Selection
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isValidating || globalStatus === 'INVALID' || (globalStatus === 'WARNING' && !acknowledged)}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#13B5EA] text-white rounded-md font-bold hover:bg-[#0E92BC] disabled:opacity-50 transition-all shadow-md"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isApprover ? 'Submit & Execute Schedule' : 'Submit for Approval'}
                </button>
            </div>
        </div>
    );
}
