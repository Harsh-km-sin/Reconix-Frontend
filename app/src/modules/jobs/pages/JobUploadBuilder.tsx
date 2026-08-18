import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { FileUp, FileSpreadsheet, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ExcelColumnMapper } from '@/modules/jobs/components/ExcelColumnMapper';
import { JobReviewScreen } from '@/modules/jobs/components/JobReviewScreen';
import { JOB_TYPE_LABELS, type JobType } from '@/types';
import { JOB_TYPE_PARAM } from '@/modules/jobs/navigation';

export function JobUploadBuilder() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get(JOB_TYPE_PARAM) || 'Unknown';

    const [isProcessing, setIsProcessing] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [mappedData, setMappedData] = useState<any[]>([]);
    const [fileData, setFileData] = useState<{
        fileName: string;
        sheets: string[];
        selectedSheet: string | null;
        headers: string[];
        rawRows: any[];
        workbook: XLSX.WorkBook | null;
    } | null>(null);

    const getJobTitle = () => JOB_TYPE_LABELS[type as JobType] ?? 'Custom Job';

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Check size limit (25MB)
        if (file.size > 25 * 1024 * 1024) {
            toast.error('File size exceeds the 25MB limit');
            return;
        }

        setIsProcessing(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheets = workbook.SheetNames;

            if (sheets.length === 0) {
                throw new Error('No sheets found in the Excel file');
            }

            setFileData({
                fileName: file.name,
                sheets,
                selectedSheet: null,
                headers: [],
                rawRows: [],
                workbook
            });

        } catch (error) {
            console.error('Failed to parse Excel file:', error);
            toast.error('Failed to read Excel file. Please ensure it is a valid .xlsx file.');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1,
        disabled: isProcessing || !!fileData
    });

    const handleSheetSelect = async (sheetName: string) => {
        if (!fileData || !fileData.workbook) return;
        setIsProcessing(true);

        try {
            const worksheet = fileData.workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

            if (jsonData.length === 0) {
                toast.error('The selected sheet is empty');
                return;
            }

            const headers = Object.keys(jsonData[0] || {});

            setFileData(prev => prev ? {
                ...prev,
                selectedSheet: sheetName,
                headers,
                rawRows: jsonData
            } : null);

            toast.success(`Selected sheet: ${sheetName}`);
        } catch (error) {
            toast.error('Failed to read sheet data');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMappingComplete = (data: any[]) => {
        setMappedData(data);
        setShowReview(true);
        toast.success(`Successfully mapped ${data.length} rows`);
    };


    return (
        <div className="max-w-[1000px] mx-auto animate-fade-in p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-ink mb-2">Upload Data for {getJobTitle()}</h1>
                <p className="text-ink-mid">Step 1: Upload your Excel file to begin</p>
            </div>

            {!fileData ? (
                <div
                    {...getRootProps()}
                    className={`bg-surface border-2 border-dashed rounded-xl p-16 text-center transition-colors cursor-pointer
            ${isDragActive ? 'border-brand bg-brand-light' : 'border-line hover:border-brand hover:bg-page'}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-line-light rounded-full flex items-center justify-center mx-auto mb-6">
                        {isProcessing ? (
                            <Loader2 className="w-8 h-8 text-brand animate-spin" />
                        ) : (
                            <FileUp className={`w-8 h-8 ${isDragActive ? 'text-brand' : 'text-ink-light'}`} />
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-ink mb-3">
                        {isDragActive ? 'Drop your Excel file here' : 'Click to upload or drag & drop'}
                    </h3>
                    <p className="text-ink-light max-w-sm mx-auto">
                        Upload your spreadsheet containing the job data. We support .xlsx and .xls formats up to 25MB.
                    </p>
                </div>
            ) : !fileData.selectedSheet ? (
                <div className="bg-surface border border-line rounded-xl overflow-hidden animate-slide-up">
                    <div className="p-6 border-b border-line flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-success-light rounded-lg flex items-center justify-center">
                                <FileSpreadsheet className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-ink">{fileData.fileName}</h3>
                                <p className="text-sm text-ink-light">{fileData.sheets.length} sheets discovered</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFileData(null)}
                            className="text-sm text-danger hover:underline"
                        >
                            Cancel & Upload Different File
                        </button>
                    </div>

                    <div className="p-6">
                        <h4 className="text-sm font-semibold text-ink-mid uppercase tracking-wide mb-4">Select Target Sheet</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {fileData.sheets.map(sheet => (
                                <button
                                    key={sheet}
                                    onClick={() => handleSheetSelect(sheet)}
                                    disabled={isProcessing}
                                    className="flex items-center justify-between p-4 border border-line rounded-lg hover:border-brand hover:bg-brand-light transition-colors group"
                                >
                                    <span className="font-medium text-ink truncate pr-4">{sheet}</span>
                                    {isProcessing ? (
                                        <Loader2 className="w-4 h-4 text-brand animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4 text-ink-light group-hover:text-brand" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : showReview ? (
                <JobReviewScreen 
                    jobType={type}
                    jobData={mappedData}
                    onBack={() => setShowReview(false)}
                />
            ) : (
                <ExcelColumnMapper
                    fileData={fileData}
                    jobType={type}
                    onMappingComplete={handleMappingComplete}
                    onBack={() => setFileData({ ...fileData, selectedSheet: null })}
                />
            )}

            {/* Information Panel */}
            {!fileData && (
                <div className="mt-8 bg-brand-light rounded-lg p-5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-ink">Upload Guidelines</h4>
                        <ul className="mt-2 text-sm text-ink-mid space-y-1 ml-4 list-disc">
                            <li>Ensure your columns have a clear header row.</li>
                            <li>Only the first 10,000 rows will be processed in a single chunk.</li>
                            <li>Dates should be formatted cleanly (e.g., YYYY-MM-DD or DD/MM/YYYY).</li>
                            <li>Values must be numeric and not strings like "$1,000".</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
