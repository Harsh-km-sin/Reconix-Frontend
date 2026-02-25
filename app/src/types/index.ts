// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: 'admin' | 'approver' | 'operator';
  phoneNumber?: string;
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  status: 'active' | 'invited' | 'disabled';
  lastActive?: string;
  companies: string[];
}

// Company Types
export interface Company {
  id: string;
  name: string;
  xeroTenantId: string;
  status: 'connected' | 'sync_error' | 'token_expired';
  lastSync: string;
  syncCounts: {
    invoices: number;
    contacts: number;
    overpayments: number;
  };
  defaultCurrency: string;
  defaultBankAccount?: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate: string;
  amountDue: number;
  currency: string;
  status: 'authorised' | 'approved' | 'paid' | 'voided';
  xeroUrl?: string;
}

// Overpayment Types
export interface Overpayment {
  id: string;
  overpaymentId: string;
  vendorId: string;
  vendorName: string;
  paymentDate: string;
  remainingCredit: number;
  currency: string;
  status: 'available' | 'allocated' | 'refunded';
}

// Bill Types
export interface Bill {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  amountDue: number;
  currency: string;
  allocatedOverpaymentId?: string;
}

// Job Types
export type JobType = 'invoice_reversal' | 'overpayment_allocation' | 'overpayment_creation';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';

export interface Job {
  id: string;
  jobId: string;
  type: JobType;
  executedBy: string;
  executedById: string;
  startTime: string;
  endTime?: string;
  status: JobStatus;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  companyId: string;
  items?: JobItem[];
}

export interface JobItem {
  id: string;
  itemNumber: string;
  invoiceId?: string;
  overpaymentId?: string;
  vendorName: string;
  amount: number;
  status: 'success' | 'failed' | 'skipped';
  xeroId?: string;
  errorMessage?: string;
}

// Filter Types
export interface InvoiceFilter {
  dateFrom?: string;
  dateTo?: string;
  vendor?: string;
  currencies?: string[];
  statuses?: string[];
  amountMin?: number;
  amountMax?: number;
}

export interface JobFilter {
  dateFrom?: string;
  dateTo?: string;
  type?: JobType | 'all';
  status?: JobStatus | 'all';
  user?: string;
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
  role?: "ADMIN" | "APPROVER" | "OPERATOR";
  companyId?: string;
  companies?: { companyId: string; companyName: string; role: "ADMIN" | "APPROVER" | "OPERATOR" }[];
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
  role: 'admin' | 'approver' | 'operator';
  companyIds: string[];
  message?: string;
}
