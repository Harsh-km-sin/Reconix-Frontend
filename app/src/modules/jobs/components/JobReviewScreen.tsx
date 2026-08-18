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
import { jobService } from '@/modules/jobs/services/jobService';
import { validationService } from '@/modules/jobs/services/validationService';
import type { ValidationReportItem, JobReviewScreenProps } from '@/modules/jobs/types';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { api } from '@/lib/api';
import { JOB_TYPE } from '@/types';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export function JobReviewScreen({
    jobType,
    jobData,
    onBack
}: JobReviewScreenProps) {
    const navigate = useNavigate();
    const { companyId: authCompanyId, permissions } = useAuth();
    const canApprove = hasPermission(permissions, PERMISSIONS.JOBS_APPROVE);

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
                    // The amount actually being reversed/allocated: for a partial
                    // reversal this is the entered partial amount, not the full bill.
                    expectedAmount: config.type === 'PARTIAL' ? Number(config.amount) : Number(row.Amount),
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
            if (canApprove) {
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
        <div className="bg-surface border border-line rounded-xl overflow-hidden animate-slide-up shadow-lg">
            <div className="p-6 border-b border-line flex items-center justify-between bg-page">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-line-light rounded-full transition-colors text-ink-mid"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-ink">Pre-flight Review</h2>
                        <p className="text-sm text-ink-mid">Verify mapped data against live Xero records</p>
                    </div>
                </div>
                {isValidating ? (
                   <div className="flex items-center gap-2 text-brand text-sm font-semibold animate-pulse">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       Running Live Validation...
                   </div>
                ) : (
                    <div className="flex items-center gap-3">
                        {globalStatus === 'ERROR' && (
                            <button
                                onClick={runValidation}
                                className="px-3 py-1 bg-danger-light hover:bg-[#FFCDD2] text-danger-hover text-xs font-bold rounded border border-danger transition-colors animate-pulse"
                            >
                                Retry Validation
                            </button>
                        )}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                            globalStatus === 'VALID' ? 'bg-success-light text-success ring-success/30' :
                            globalStatus === 'WARNING' ? 'bg-warning-light text-warning ring-warning/30' :
                            globalStatus === 'ERROR' ? 'bg-danger-light text-danger ring-danger/30' :
                            'bg-neutral-light text-neutral ring-neutral/30'
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
                    <div className="bg-page border border-line rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">Job Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-mid mb-1.5">Job Name</label>
                                <input
                                    type="text"
                                    value={jobName}
                                    onChange={(e) => setJobName(e.target.value)}
                                    placeholder="e.g., February Vendor Recon"
                                    className="w-full h-10 px-3 border border-line rounded-md text-sm focus:border-brand focus:outline-none"
                                />
                            </div>

                            {jobType === JOB_TYPE.INVOICE_REVERSAL && (
                                <div>
                                    <label className="block text-sm font-medium text-ink-mid mb-1.5">Reversal Date</label>
                                    <input
                                        type="date"
                                        value={reversalDate}
                                        onChange={(e) => setReversalDate(e.target.value)}
                                        className="w-full h-10 px-3 border border-line rounded-md text-sm focus:border-brand focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-brand-light rounded-xl p-5 shadow-inner">
                        <h3 className="text-sm font-semibold text-brand uppercase tracking-wide mb-3">Submission Summary</h3>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-ink-mid">Total Items</span>
                            <span className="font-bold text-ink text-lg">{jobData.length}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-ink-mid">Total Value</span>
                            <span className="font-bold text-brand text-lg">{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-ink-mid">Amount Mode</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                amountMode === 'BILL_TOTAL'
                                    ? 'bg-warning-light text-warning'
                                    : 'bg-success-light text-success'
                            }`}>
                                {amountMode === 'BILL_TOTAL' ? 'Including Tax' : 'Tax Exclusive'}
                            </span>
                        </div>
                    </div>

                    {globalStatus === 'WARNING' && (
                        <div className="bg-warning-light border border-[#FFE0B2] rounded-xl p-5">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-warning uppercase tracking-wide mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                Acknowledgement Required
                            </h4>
                            <p className="text-xs text-ink-mid mb-4">Some items have warnings (e.g., amount or contact mismatches). Do you wish to proceed anyway?</p>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={acknowledged}
                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                    className="w-4 h-4 rounded border-warning text-warning focus:ring-warning"
                                />
                                <span className="text-sm font-semibold text-ink">I acknowledge these warnings</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Right Col: Data Review */}
                <div className="lg:col-span-2">
                    <div className="border border-line rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
                            <table className="w-full text-sm">
                                <thead className="bg-page sticky top-0 shadow-sm border-b border-line z-10">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-semibold text-ink-mid w-12">#</th>
                                        <th className="py-3 px-4 text-left font-semibold text-ink-mid">Reference</th>
                                        <th className="py-3 px-4 text-left font-semibold text-ink-mid">Mode</th>
                                        <th className="py-3 px-4 text-right font-semibold text-ink-mid">
                                            {amountMode === 'BILL_TOTAL' ? 'Amount to Reverse (Incl. Tax)' : 'Reversal Amount (Excl. Tax)'}
                                        </th>
                                        <th className="py-3 px-4 text-left font-semibold text-ink-mid">Validation Status</th>
                                        <th className="py-3 px-4 text-left font-semibold text-ink-mid">Issues/Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line-light">
                                    {Object.entries(
                                        jobData.reduce((acc: Record<string, any[]>, row, i) => {
                                            const vendor = row['Vendor Name'] || 'Other / Unknown';
                                            if (!acc[vendor]) acc[vendor] = [];
                                            acc[vendor].push({ ...row, originalIndex: i });
                                            return acc;
                                        }, {})
                                    ).map(([vendor, vendorItems]) => (
                                        <React.Fragment key={vendor}>
                                            <tr className="bg-[#F8F9FA] border-y border-line">
                                                <td colSpan={5} className="py-2.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-brand" />
                                                        <span className="font-bold text-ink uppercase text-[11px] tracking-widest">{vendor}</span>
                                                        <span className="text-[10px] text-ink-light font-medium ml-2">({vendorItems.length} items)</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {vendorItems.map((item) => {
                                                const report = validationReports[`item-${item.originalIndex}`];
                                                return (
                                                    <tr key={item.originalIndex} className={`hover:bg-page transition-colors ${report?.status === 'INVALID' ? 'bg-danger-light/30' : ''}`}>
                                                        <td className="py-3 px-4 text-ink-light text-xs">{item.originalIndex + 1}</td>
                                                        <td className="py-3 px-4 font-mono text-brand whitespace-nowrap text-xs">
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
                                                                    className="bg-line-light border border-line rounded px-2 py-1 text-[10px] focus:outline-none focus:border-brand"
                                                                >
                                                                    <option value="FULL">Full</option>
                                                                    <option value="PARTIAL">Partial</option>
                                                                </select>
                                                            ) : (
                                                                <span className="text-[10px] text-ink-light">Default</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            {itemConfigs[item.originalIndex]?.type === 'PARTIAL' ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span className="text-[10px] text-ink-mid" title={amountMode === 'BILL_TOTAL' ? 'Total including tax' : 'Tax exclusive'}>$</span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={itemConfigs[item.originalIndex]?.amount}
                                                                        onChange={(e) => setItemConfigs(prev => ({
                                                                            ...prev,
                                                                            [item.originalIndex]: { ...prev[item.originalIndex], amount: Number(e.target.value) }
                                                                        }))}
                                                                        className="w-20 text-right bg-surface border border-brand rounded px-1 py-0.5 text-xs font-mono"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="font-mono text-ink text-xs">
                                                                    {formatCurrency(Number(item.Amount) || 0)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {isValidating ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="w-3 h-3 text-brand animate-spin" />
                                                                    <span className="text-[10px] text-ink-mid">Checking...</span>
                                                                </div>
                                                            ) : !report ? (
                                                                <div className="flex items-center gap-1.5 text-neutral font-medium text-[10px]">
                                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                                    Not checked
                                                                </div>
                                                            ) : report.status === 'VALID' ? (
                                                                <div className="flex items-center gap-1.5 text-success font-medium text-[10px]">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    Verified
                                                                </div>
                                                            ) : report.status === 'WARNING' ? (
                                                                <div className="flex items-center gap-1.5 text-warning font-medium text-[10px]">
                                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                                    Warning
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-danger font-medium text-[10px]">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    Invalid
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 max-w-[200px]">
                                                            {!report && (
                                                                <span className="text-[9px] text-neutral italic">Validation did not run</span>
                                                            )}
                                                            {report?.errors.map((err: string, idx: number) => (
                                                                <p key={idx} className="text-[9px] text-danger font-bold leading-tight mb-0.5">• {err}</p>
                                                            ))}
                                                            {report?.warnings.map((warn: string, idx: number) => (
                                                                <p key={idx} className="text-[9px] text-warning font-bold leading-tight mb-0.5">• {warn}</p>
                                                            ))}
                                                            {report?.status === 'VALID' && <span className="text-[9px] text-ink-light italic">No issues detected</span>}
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

            <div className="p-6 border-t border-line flex justify-end gap-3 bg-page">
                <button
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 border border-line text-ink-mid bg-surface rounded-md font-medium hover:bg-line-light transition-colors disabled:opacity-50"
                >
                    Back to Selection
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isValidating || globalStatus === 'INVALID' || globalStatus === 'ERROR' || globalStatus === 'PENDING' || (globalStatus === 'WARNING' && !acknowledged)}
                    className="flex items-center gap-2 px-8 py-2.5 bg-brand text-white rounded-md font-bold hover:bg-brand-hover disabled:opacity-50 transition-all shadow-md"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {canApprove ? 'Submit & Execute' : 'Submit for Approval'}
                </button>
            </div>
        </div>
    );
}
