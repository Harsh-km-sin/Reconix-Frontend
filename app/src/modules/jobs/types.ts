import type { JobType, JobStatus } from '@/types';

// ── service DTOs ────────────────────────────────────────────────────────────

/** Query parameters for the job-list endpoint. */
export interface ListJobsOptions {
  page?: number;
  limit?: number;
  type?: JobType | 'ALL';
  status?: JobStatus | 'ALL';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** The verdict for one item in a pre-flight validation run. */
export interface ValidationReportItem {
  id: string;
  status: 'VALID' | 'WARNING' | 'INVALID' | 'ERROR';
  warnings: string[];
  errors: string[];
}

/** Response body of POST /api/v1/validation/run. */
export interface ValidationResponse {
  report: ValidationReportItem[];
}

// ── component props / state shapes ──────────────────────────────────────────

/** Which spreadsheet columns a job type needs mapped. */
export interface ColumnMapping {
  required: string[];
  optional: string[];
}

/** A parsed upload, before its columns are mapped to job fields. */
export interface FileData {
  fileName: string;
  selectedSheet: string | null;
  headers: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawRows: any[];
}

export interface ExcelColumnMapperProps {
  fileData: FileData;
  jobType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMappingComplete: (mappedData: any[]) => void;
  onBack: () => void;
}

export interface JobReviewScreenProps {
  jobType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobData: any[];
  onBack: () => void;
}

/** An outstanding Xero bill, as listed in the manual job builder. */
export interface ActiveBill {
  xeroInvoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  amountDue: number | null;
}

/**
 * One row of the review grid: an uploaded/entered line plus the vendor it is
 * grouped under and its position in the original upload.
 *
 * `originalIndex` is the key into `itemConfigs` and `validationReports`, so it
 * must survive grouping — it is the row's position before rows were bucketed.
 */
export interface JobReviewRow {
  vendor: string;
  originalIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [field: string]: any;
}

// ── spreadsheet upload contract (mirrors the backend excel module) ──────────

/** One row of a sheet, keyed by its raw header text. */
export type SheetRow = Record<string, string | number | boolean | null>;

/** What the server can tell us about a sheet before one is chosen. */
export interface SheetMeta {
  name: string;
  /** Data rows, excluding the header row. */
  rowCount: number;
  /** Header cells exactly as written in the file — the keys of each row. */
  headers: string[];
  /** Headers run through the server's alias table. Mapping hints only. */
  normalizedHeaders: string[];
  isAutoDetected: boolean;
}

/** Response of POST /excel/upload and GET /excel/:id/metadata. */
export interface UploadMetadata {
  uploadId: string;
  fileName: string;
  sizeBytes: number;
  kind: 'excel' | 'csv';
  sheets: SheetMeta[];
  autoMappings: Record<string, string>;
}

/** Response of GET /excel/:id/sheet/:name. */
export interface SheetData {
  sheetName: string;
  headers: string[];
  rowCount: number;
  rows: SheetRow[];
}
