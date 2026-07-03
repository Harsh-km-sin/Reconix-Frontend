import React, { useState, useEffect } from 'react';
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
import { api } from '@/lib/api';
import { JOB_TYPE } from '@/types';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

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
    const { companyId: authCompanyId, permissions } = useAuth();
    const canSelfApprove = hasPermission(permissions, PERMISSIONS.SELF_APPROVE_JOBS);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [validationReports, setValidationReports] = useState<Record<string, ValidationReportItem>>({});
    const [acknowledged, setAcknowledged] = useState(false);
    const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0]);
    const [jobName, setJobName] = useState('');
    const [itemConfigs, setItemConfigs] = useState<Record<number, { type: 'FULL' | 'PARTIAL', amount: number }>>({});
    const [hasValidationError, setHasValidationError] = useState(false);
    const [amountMode, setAmountMode] = useState<'TAX_EXCLUSIVE' | 'BILL_TOTAL'>('TAX_EXCLUSIVE');

    // Fetch company reversal amount mode setting
    useEffect(() => {
        if (!authCompanyId) return;
        api.get<any>(`companies/${authCompanyId}`)
            .then((company) => {
                if (company?.partialReversalAmountMode === 'BILL_TOTAL') {
                    setAmountMode('BILL_TOTAL');
                }
            })
            .catch(() => { /* Fallback to default TAX_EXCLUSIVE */ });
    }, [authCompanyId]);

    // Initialize configs
    useEffect(() => {
        const configs: Record<number, { type: 'FULL' | 'PARTIAL', amount: number }> = {};
        jobData.forEach((item, i) => {
            configs[i] = { type: 'FULL', amount: Number(item.Amount || 0) };
        });
        setItemConfigs(configs);
    }, [jobData]);

    const totalAmount = Object.values(itemConfigs).reduce((sum, cfg) => sum + cfg.amount, 0);

    const runValidation = async () => {
        if (jobData.length === 0) {
            setIsValidating(false);
            return;
        }
        setIsValidating(true);
        setHasValidationError(false);
        try {
            const itemsToValidate = jobData.map((row, i) => ({
                id: `item-${i}`,
                itemType: jobType === JOB_TYPE.INVOICE_REVERSAL ? JOB_TYPE.INVOICE_REVERSAL : JOB_TYPE.OVERPAYMENT_ALLOCATION,
                invoiceNumber: row['Invoice Number'],
                xeroInvoiceId: row.xeroInvoiceId,
                expectedAmount: Number(row.Amount),
                contactName: row.xeroInvoiceId ? undefined : row['Vendor Name'],
            }));

            const response = await validationService.runValidation({ items: itemsToValidate });
            const reportMap: Record<string, ValidationReportItem> = {};
            response.report.forEach(r => {
                reportMap[r.id] = r;
            });
            setValidationReports(reportMap);
        } catch (error) {
            console.error('Validation failed:', error);
            toast.error('Live Xero validation failed. Check your connection or active organization.');
            setHasValidationError(true);
        } finally {
            setIsValidating(false);
        }
    };

    // Run live validation on load
    useEffect(() => {
        runValidation();
    }, [jobData, jobType]);

    const globalStatus = (() => {
        if (hasValidationError) return 'ERROR';
        if (Object.keys(validationReports).length === 0) return 'PENDING';
        return Object.values(validationReports).reduce((status, r) => {
            if (r.status === 'ERROR' || r.status === 'INVALID') return 'INVALID';
            if (r.status === 'WARNING' && status !== 'INVALID') return 'WARNING';
            return status;
        }, 'VALID' as 'VALID' | 'WARNING' | 'INVALID' | 'ERROR' | 'PENDING');
    })();

    const handleSubmit = async () => {
        if (globalStatus === 'INVALID' || globalStatus === 'ERROR' || globalStatus === 'PENDING') {
            toast.error('Cannot submit job without a successful validation check');
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
                reversalDate: jobType === JOB_TYPE.INVOICE_REVERSAL ? reversalDate : undefined,
                notes: jobName || `${jobType.replace('_', ' ')} manual build`
            });

            const items = jobData.map((row, i) => {
                const config = itemConfigs[i];
                return {
                    itemType: jobType === JOB_TYPE.INVOICE_REVERSAL ? 'INVOICE' : 'OVERPAYMENT',
                    invoiceNumber: row['Invoice Number'],
                    xeroInvoiceId: row.dbInvoiceId,
                    contactName: row['Vendor Name'],
                    expectedAmount: Number(row.Amount),
                    reversalConfig: jobType === JOB_TYPE.INVOICE_REVERSAL ? {
                        reversalType: config.type,
                        partialAmount: config.type === 'PARTIAL' ? config.amount : undefined,
                        amountMode: config.type === 'PARTIAL' ? amountMode : undefined
                    } : undefined
                };
            });

            await jobService.addItems(job.id, items);

            // Users with the self-approve capability (e.g. ADMIN) approve and run
            // their own job in one step; everyone else saves it as PENDING for a
            // separate approver (four-eyes).
            if (canSelfApprove) {
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
                    <div className="flex items-center gap-3">
                        {globalStatus === 'ERROR' && (
                            <button
                                onClick={runValidation}
                                className="px-3 py-1 bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#D32F2F] text-xs font-bold rounded border border-[#E53935] transition-colors animate-pulse"
                            >
                                Retry Validation
                            </button>
                        )}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                            globalStatus === 'VALID' ? 'bg-[#E8F5E9] text-[#3BB54A] ring-[#3BB54A]/30' :
                            globalStatus === 'WARNING' ? 'bg-[#FFF4E5] text-[#FFA726] ring-[#FFA726]/30' :
                            globalStatus === 'ERROR' ? 'bg-[#FFEBEE] text-[#E53935] ring-[#E53935]/30' :
                            'bg-[#ECEFF1] text-[#546E7A] ring-[#546E7A]/30'
                        }`}>
                            {globalStatus === 'VALID' ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {globalStatus === 'VALID' ? 'Validation Passed' : 
                             globalStatus === 'WARNING' ? 'Warnings Detected' : 
                             globalStatus === 'ERROR' ? 'Validation Failed to Run' : 
                             'Validation Pending'}
                        </div>
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

                            {jobType === JOB_TYPE.INVOICE_REVERSAL && (
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
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[#555555]">Total Value</span>
                            <span className="font-bold text-[#13B5EA] text-lg">{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[#555555]">Amount Mode</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                amountMode === 'BILL_TOTAL'
                                    ? 'bg-[#FFF4E5] text-[#FFA726]'
                                    : 'bg-[#E8F5E9] text-[#3BB54A]'
                            }`}>
                                {amountMode === 'BILL_TOTAL' ? 'Including Tax' : 'Tax Exclusive'}
                            </span>
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
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
                            <table className="w-full text-sm">
                                <thead className="bg-[#FAFAFA] sticky top-0 shadow-sm border-b border-[#E0E0E0] z-10">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555] w-12">#</th>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555]">Reference</th>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555]">Mode</th>
                                        <th className="py-3 px-4 text-right font-semibold text-[#555555]">
                                            {amountMode === 'BILL_TOTAL' ? 'Amount to Reverse (Incl. Tax)' : 'Reversal Amount (Excl. Tax)'}
                                        </th>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555]">Validation Status</th>
                                        <th className="py-3 px-4 text-left font-semibold text-[#555555]">Issues/Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F5F5F5]">
                                    {Object.entries(
                                        jobData.reduce((acc: Record<string, any[]>, row, i) => {
                                            const vendor = row['Vendor Name'] || 'Other / Unknown';
                                            if (!acc[vendor]) acc[vendor] = [];
                                            acc[vendor].push({ ...row, originalIndex: i });
                                            return acc;
                                        }, {})
                                    ).map(([vendor, vendorItems]) => (
                                        <React.Fragment key={vendor}>
                                            <tr className="bg-[#F8F9FA] border-y border-[#E0E0E0]">
                                                <td colSpan={5} className="py-2.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-[#13B5EA]" />
                                                        <span className="font-bold text-[#1A1A1A] uppercase text-[11px] tracking-widest">{vendor}</span>
                                                        <span className="text-[10px] text-[#8A8A8A] font-medium ml-2">({vendorItems.length} items)</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {vendorItems.map((item) => {
                                                const report = validationReports[`item-${item.originalIndex}`];
                                                return (
                                                    <tr key={item.originalIndex} className={`hover:bg-[#FAFAFA] transition-colors ${report?.status === 'INVALID' ? 'bg-[#FFEBEE]/30' : ''}`}>
                                                        <td className="py-3 px-4 text-[#8A8A8A] text-xs">{item.originalIndex + 1}</td>
                                                        <td className="py-3 px-4 font-mono text-[#13B5EA] whitespace-nowrap text-xs">
                                                            {item['Invoice Number'] || item['Reference'] || '—'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {jobType === JOB_TYPE.INVOICE_REVERSAL ? (
                                                                <select
                                                                    value={itemConfigs[item.originalIndex]?.type || 'FULL'}
                                                                    onChange={(e) => setItemConfigs(prev => ({
                                                                        ...prev,
                                                                        [item.originalIndex]: { 
                                                                            ...prev[item.originalIndex], 
                                                                            type: e.target.value as 'FULL' | 'PARTIAL',
                                                                            amount: e.target.value === 'FULL' ? Number(item.Amount) : prev[item.originalIndex].amount
                                                                        }
                                                                    }))}
                                                                    className="bg-[#F5F5F5] border border-[#E0E0E0] rounded px-2 py-1 text-[10px] focus:outline-none focus:border-[#13B5EA]"
                                                                >
                                                                    <option value="FULL">Full</option>
                                                                    <option value="PARTIAL">Partial</option>
                                                                </select>
                                                            ) : (
                                                                <span className="text-[10px] text-[#8A8A8A]">Default</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            {itemConfigs[item.originalIndex]?.type === 'PARTIAL' ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span className="text-[10px] text-[#555555]" title={amountMode === 'BILL_TOTAL' ? 'Total including tax' : 'Tax exclusive'}>$</span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={itemConfigs[item.originalIndex]?.amount}
                                                                        onChange={(e) => setItemConfigs(prev => ({
                                                                            ...prev,
                                                                            [item.originalIndex]: { ...prev[item.originalIndex], amount: Number(e.target.value) }
                                                                        }))}
                                                                        className="w-20 text-right bg-white border border-[#13B5EA] rounded px-1 py-0.5 text-xs font-mono"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="font-mono text-[#1A1A1A] text-xs">
                                                                    {formatCurrency(Number(item.Amount) || 0)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {isValidating ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="w-3 h-3 text-[#13B5EA] animate-spin" />
                                                                    <span className="text-[10px] text-[#555555]">Checking...</span>
                                                                </div>
                                                            ) : !report ? (
                                                                <div className="flex items-center gap-1.5 text-[#546E7A] font-medium text-[10px]">
                                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                                    Not checked
                                                                </div>
                                                            ) : report.status === 'VALID' ? (
                                                                <div className="flex items-center gap-1.5 text-[#3BB54A] font-medium text-[10px]">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    Verified
                                                                </div>
                                                            ) : report.status === 'WARNING' ? (
                                                                <div className="flex items-center gap-1.5 text-[#FFA726] font-medium text-[10px]">
                                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                                    Warning
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-[#E53935] font-medium text-[10px]">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    Invalid
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 max-w-[200px]">
                                                            {!report && (
                                                                <span className="text-[9px] text-[#546E7A] italic">Validation did not run</span>
                                                            )}
                                                            {report?.errors.map((err: string, idx: number) => (
                                                                <p key={idx} className="text-[9px] text-[#E53935] font-bold leading-tight mb-0.5">• {err}</p>
                                                            ))}
                                                            {report?.warnings.map((warn: string, idx: number) => (
                                                                <p key={idx} className="text-[9px] text-[#FFA726] font-bold leading-tight mb-0.5">• {warn}</p>
                                                            ))}
                                                            {report?.status === 'VALID' && <span className="text-[9px] text-[#8A8A8A] italic">No issues detected</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
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
                    disabled={isSubmitting || isValidating || globalStatus === 'INVALID' || globalStatus === 'ERROR' || globalStatus === 'PENDING' || (globalStatus === 'WARNING' && !acknowledged)}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#13B5EA] text-white rounded-md font-bold hover:bg-[#0E92BC] disabled:opacity-50 transition-all shadow-md"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {canSelfApprove ? 'Submit & Execute' : 'Submit for Approval'}
                </button>
            </div>
        </div>
    );
}
