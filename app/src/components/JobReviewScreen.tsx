import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobService } from '@/services/jobService';
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
    const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0]);
    const [jobName, setJobName] = useState('');

    const totalAmount = jobData.reduce((sum, item) => sum + Number(item.Amount || 0), 0);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // 1. Create Job
            const job = await jobService.createJob({
                jobType: jobType as any,
                reversalDate: jobType === 'INVOICE_REVERSAL' ? reversalDate : undefined,
                notes: jobName || `${jobType.replace('_', ' ')} from Upload`
            });

            // 2. Map items to backend schema
            const items = jobData.map(row => ({
                itemType: jobType === 'INVOICE_REVERSAL' ? 'INVOICE' : 'OVERPAYMENT',
                invoiceNumber: row['Invoice Number'],
                contactName: row['Vendor Name'],
                expectedAmount: Number(row.Amount)
            }));

            // 3. Add items
            await jobService.addItems(job.id, items);

            // 4. Approve if able
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
        <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors text-[#555555]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-[#1A1A1A]">Pre-flight Review</h2>
                        <p className="text-sm text-[#555555]">Verify mapped data before processing</p>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Job Options */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide mb-4">Job Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#555555] mb-1.5">Job Name (Optional)</label>
                                <input
                                    type="text"
                                    value={jobName}
                                    onChange={(e) => setJobName(e.target.value)}
                                    placeholder="e.g., February Vendor Recon"
                                    className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none focus:ring-2 focus:ring-[#13B5EA]/10"
                                />
                            </div>

                            {jobType === 'INVOICE_REVERSAL' && (
                                <div>
                                    <label className="block text-sm font-medium text-[#555555] mb-1.5">Reversal Date</label>
                                    <input
                                        type="date"
                                        value={reversalDate}
                                        onChange={(e) => setReversalDate(e.target.value)}
                                        className="w-full h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none focus:ring-2 focus:ring-[#13B5EA]/10"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#E5F6FC] rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-[#13B5EA] uppercase tracking-wide mb-3">Summary</h3>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[#555555]">Total Items</span>
                            <span className="font-bold text-[#1A1A1A] text-lg">{jobData.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[#555555]">Total Value</span>
                            <span className="font-bold text-[#13B5EA] text-lg">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Col: Data Review */}
                <div className="lg:col-span-2">
                    <div className="flex items-start gap-3 p-4 bg-[#FFF4E5] rounded-xl mb-6">
                        <AlertTriangle className="w-5 h-5 text-[#FFA726] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-[#1A1A1A]">Heads up: Xero Validation Happens Server-Side</p>
                            <p className="text-sm text-[#555555] mt-1">
                                This preview shows your parsed Excel data. The final balance checking against live Xero balances will happen when the job executes.
                            </p>
                        </div>
                    </div>

                    <div className="border border-[#E0E0E0] rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#FAFAFA] sticky top-0 shadow-sm border-b border-[#E0E0E0]">
                                <tr>
                                    <th className="py-2.5 px-4 text-left font-semibold text-[#555555]">Reference</th>
                                    <th className="py-2.5 px-4 text-left font-semibold text-[#555555]">Vendor</th>
                                    <th className="py-2.5 px-4 text-right font-semibold text-[#555555]">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobData.slice(0, 50).map((row, i) => (
                                    <tr key={i} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                                        <td className="py-2.5 px-4 font-mono text-[#13B5EA]">
                                            {row['Invoice Number'] || row['Reference'] || '—'}
                                        </td>
                                        <td className="py-2.5 px-4 text-[#1A1A1A]">{row['Vendor Name'] || '—'}</td>
                                        <td className="py-2.5 px-4 text-right font-mono">
                                            {formatCurrency(Number(row.Amount) || 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {jobData.length > 50 && (
                            <div className="p-3 text-center text-xs text-[#8A8A8A] bg-[#FAFAFA] italic border-t border-[#E0E0E0]">
                                Showing first 50 of {jobData.length} items
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-[#E0E0E0] flex justify-end gap-3 bg-[#FAFAFA]">
                <button
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 border border-[#E0E0E0] text-[#555555] bg-white rounded-md font-medium hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
                >
                    Mapping Editor
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#13B5EA] text-white rounded-md font-bold hover:bg-[#0E92BC] disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isApprover ? 'Submit & Execute Schedule' : 'Submit for Approval'}
                </button>
            </div>
        </div>
    );
}
