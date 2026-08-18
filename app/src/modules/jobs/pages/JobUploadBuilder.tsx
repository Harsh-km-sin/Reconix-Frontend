import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { FileUp, FileSpreadsheet, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ExcelColumnMapper } from '@/modules/jobs/components/ExcelColumnMapper';
import { JobReviewScreen } from '@/modules/jobs/components/JobReviewScreen';
import { excelService } from '@/modules/jobs/services/excelService';
import { JOB_TYPE_LABELS, type JobType } from '@/types';
import { JOB_TYPE_PARAM } from '@/modules/jobs/navigation';
import { getErrorMessage } from '@/lib/errors';
import { ErrorState } from '@/ui_library/feedback/ErrorState';
import { PageHeader } from '@/ui_library/components/PageHeader';
import type { FileData, UploadMetadata } from '@/modules/jobs/types';

/** Mirrors the server's multer limit; checked here only to fail fast. */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function JobUploadBuilder() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get(JOB_TYPE_PARAM) || 'Unknown';

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showReview, setShowReview] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mappedData, setMappedData] = useState<any[]>([]);
    const [upload, setUpload] = useState<UploadMetadata | null>(null);
    const [fileData, setFileData] = useState<FileData | null>(null);

    const getJobTitle = () => JOB_TYPE_LABELS[type as JobType] ?? 'Custom Job';

    const reset = () => {
        setUpload(null);
        setFileData(null);
        setError(null);
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > MAX_UPLOAD_BYTES) {
            toast.error('File size exceeds the 25MB limit');
            return;
        }

        setIsProcessing(true);
        setError(null);
        try {
            // The server parses on upload, so this one call returns the sheet
            // list, each sheet's headers and its row count.
            setUpload(await excelService.upload(file));
        } catch (err) {
            const message = getErrorMessage(err, 'Failed to upload the file.');
            setError(message);
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        disabled: isProcessing || !!upload,
    });

    const handleSheetSelect = async (sheetName: string) => {
        if (!upload) return;
        setIsProcessing(true);
        setError(null);

        try {
            const sheet = await excelService.getSheet(upload.uploadId, sheetName);

            if (sheet.rows.length === 0) {
                toast.error('The selected sheet is empty');
                return;
            }

            setFileData({
                fileName: upload.fileName,
                selectedSheet: sheet.sheetName,
                headers: sheet.headers,
                rawRows: sheet.rows,
            });
            toast.success(`Selected sheet: ${sheet.sheetName}`);
        } catch (err) {
            const message = getErrorMessage(err, 'Failed to read sheet data.');
            setError(message);
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMappingComplete = (data: any[]) => {
        setMappedData(data);
        setShowReview(true);
        toast.success(`Successfully mapped ${data.length} rows`);
    };

    return (
        <div className="max-w-[1000px] mx-auto animate-fade-in p-8">
            <PageHeader
                title={`Upload Data for ${getJobTitle()}`}
                description="Step 1: Upload your spreadsheet to begin"
                className="mb-8"
            />

            {error && (
                <ErrorState
                    variant="card"
                    title="Upload failed"
                    message={error}
                    onDismiss={() => setError(null)}
                    className="mb-6"
                />
            )}

            {!upload ? (
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
                        {isProcessing
                            ? 'Uploading…'
                            : isDragActive
                              ? 'Drop your file here'
                              : 'Click to upload or drag & drop'}
                    </h3>
                    <p className="text-ink-light max-w-sm mx-auto">
                        Upload your spreadsheet containing the job data. We support .xlsx, .xls and
                        .csv up to 25MB.
                    </p>
                </div>
            ) : !fileData ? (
                <div className="bg-surface border border-line rounded-xl overflow-hidden animate-slide-up">
                    <div className="p-6 border-b border-line flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-success-light rounded-lg flex items-center justify-center">
                                <FileSpreadsheet className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-ink">{upload.fileName}</h3>
                                <p className="text-sm text-ink-light">
                                    {upload.sheets.length} sheet{upload.sheets.length === 1 ? '' : 's'} discovered
                                </p>
                            </div>
                        </div>
                        <button onClick={reset} className="text-sm text-danger hover:underline">
                            Cancel &amp; Upload Different File
                        </button>
                    </div>

                    <div className="p-6">
                        <h4 className="text-sm font-semibold text-ink-mid uppercase tracking-wide mb-4">
                            Select Target Sheet
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {upload.sheets.map((sheet) => (
                                <button
                                    key={sheet.name}
                                    onClick={() => handleSheetSelect(sheet.name)}
                                    disabled={isProcessing}
                                    className="flex items-center justify-between p-4 border border-line rounded-lg hover:border-brand hover:bg-brand-light transition-colors group text-left"
                                >
                                    <span className="min-w-0 pr-4">
                                        <span className="block font-medium text-ink truncate">
                                            {sheet.name}
                                        </span>
                                        {/* Row counts come from the server now, so the picker can
                                            show what is in each sheet before one is chosen. */}
                                        <span className="block text-xs text-ink-light">
                                            {sheet.rowCount} rows
                                            {sheet.isAutoDetected ? ' · recognised layout' : ''}
                                        </span>
                                    </span>
                                    {isProcessing ? (
                                        <Loader2 className="w-4 h-4 text-brand animate-spin flex-shrink-0" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4 text-ink-light group-hover:text-brand flex-shrink-0" />
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
                    onBack={() => setFileData(null)}
                />
            )}

            {!upload && (
                <div className="mt-8 bg-brand-light rounded-lg p-5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-ink">Upload Guidelines</h4>
                        <ul className="mt-2 text-sm text-ink-mid space-y-1 ml-4 list-disc">
                            <li>Ensure your columns have a clear header row.</li>
                            <li>Only the first 10,000 rows will be processed in a single chunk.</li>
                            <li>Dates should be formatted cleanly (e.g., YYYY-MM-DD or DD/MM/YYYY).</li>
                            <li>Values must be numeric and not strings like &quot;$1,000&quot;.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
