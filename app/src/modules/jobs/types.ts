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
