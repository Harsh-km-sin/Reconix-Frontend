// User Types
export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatar?: string;
  /** Role name (display only). Authorization is driven by permissions, not role. */
  role: string;
  roleId?: string;
  phoneNumber?: string | null;
  timezone?: string | null;
  dateFormat?: string | null;
  isActive: boolean;
  lastActive?: string;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  xeroTenantId: string;
  xeroShortCode?: string | null;
  baseCurrency?: string | null;
  defaultBankAccountId?: string | null;
  status?: 'connected' | 'sync_error' | 'token_expired'; // Computed in UI or from specialized field
  lastSync?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

// Invoice Types
export interface Invoice {
  id: string;
  xeroInvoiceId: string;
  invoiceNumber: string;
  vendorName?: string; // Mapped from contact in backend
  contact?: {
    name: string;
    xeroContactId: string;
  };
  invoiceDate: string;
  dueDate: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED' | 'PAID' | 'VOIDED';
  currencyCode: string;
  total: number;
  amountDue: number;
  amountPaid: number | null;
  reference?: string | null;
}

// Overpayment Types
export interface Overpayment {
  id: string;
  xeroOverpaymentId: string;
  contact?: {
    name: string;
    xeroContactId: string;
  };
  overpaymentDate: string;
  remainingCredit: number;
  total: number;
  currencyCode: string;
  status: string | null;
}

// Bill Types (subset of Invoice)
export interface Bill extends Invoice { }

// Job Types — single source of truth for the job-type values, the derived
// union type, and their human-readable labels.
export const JOB_TYPE = {
  INVOICE_REVERSAL: 'INVOICE_REVERSAL',
  OVERPAYMENT_ALLOCATION: 'OVERPAYMENT_ALLOCATION',
  OVERPAYMENT_CREATION: 'OVERPAYMENT_CREATION',
} as const;

export type JobType = (typeof JOB_TYPE)[keyof typeof JOB_TYPE];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  [JOB_TYPE.INVOICE_REVERSAL]: 'Invoice Reversal',
  [JOB_TYPE.OVERPAYMENT_ALLOCATION]: 'Overpayment Allocation',
  [JOB_TYPE.OVERPAYMENT_CREATION]: 'Overpayment Creation',
};

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface Job {
  id: string;
  jobType: JobType;
  status: JobStatus;
  reversalDate?: string | null;
  totalItems: number;
  processedCount: number;
  skippedCount: number;
  failedCount: number;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  createdBy?: {
    id: string;
    name: string | null;
  };
  approvedBy?: {
    id: string;
    name: string | null;
  };
  jobItems?: JobItem[];
  auditLogs?: AuditLog[];
}

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
  user?: { name: string | null } | null;
}

export type JobItemStatus = 'PENDING' | 'PROCESSED' | 'SKIPPED' | 'FAILED';

export interface JobItem {
  id: string;
  jobId: string;
  itemType: 'INVOICE' | 'OVERPAYMENT';
  xeroInvoiceId?: string | null;
  xeroOverpaymentId?: string | null;
  invoiceNumber?: string | null;
  contactName?: string | null;
  expectedAmount?: number | null;
  actualAmountDue?: number | null;
  /** Amount Xero actually processed (credit note / allocation), set on execution. */
  allocatedAmount?: number | null;
  amountMismatchAcknowledged: boolean;
  status: JobItemStatus;
  failureReason?: string | null;
  failureRawError?: any;
  executedAt?: string | null;
}

// Filter Types
export interface InvoiceFilter {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  vendorId?: string;
  currencyCode?: string;
  status?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface JobFilter {
  dateFrom?: string;
  dateTo?: string;
  type?: JobType | 'ALL';
  status?: JobStatus | 'ALL';
}

// Settings Types
export interface CompanySettings {
  companyName: string;
  xeroTenantId: string;
  defaultCurrency: string;
  defaultBankAccount?: string;
  creditNoteFormat: string;
  lineAmountType: 'exclusive' | 'inclusive';
}

export interface BatchConfiguration {
  id: string;
  name: string;
  jobType: JobType;
  description?: string;
  filters: InvoiceFilter;
  executionSettings: {
    reversalDateLogic: 'today' | 'end_of_month' | 'custom';
    cnFormatOverride?: string;
  };
  lastUsed?: string;
}

// Navigation Types (module = backend permission module; if missing, item is shown to all)
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  section?: string;
  /** Backend module name for permission check (e.g. "invoices", "companies") */
  module?: string;
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

/** Backend auth response (login / set-password). Permissions are in JWT claims only. */
export interface AuthResponseData {
  token: string;
  user: { id: string; email: string; name: string | null };
  role?: string;
  roleId?: string;
  companyId?: string;
  companies?: { companyId: string; companyName: string; role: string }[];
}

/** Company option for switcher / dropdowns */
export interface CompanyOption {
  companyId: string;
  companyName: string;
  role?: string;
}

// Form Types
export interface CreateOverpaymentData {
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  bankAccountId: string;
  description?: string;
}

export interface InviteUserData {
  emails: string[];
  roleId: string;
  companyIds: string[];
  message?: string;
}
