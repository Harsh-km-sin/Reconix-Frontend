import type { InvoiceFilter } from '@/types';

// ── service DTOs ────────────────────────────────────────────────────────────

/** Query parameters for the Xero invoice-list endpoint. */
export interface ListInvoicesOptions extends InvoiceFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** One recorded sync run (SyncLog). */
export interface SyncLogItem {
  id: string;
  syncType: 'FULL' | 'INCREMENTAL' | 'CONTACTS' | 'INVOICES' | 'OVERPAYMENTS';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  recordsFetched: number | null;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

// ── page / component shapes ─────────────────────────────────────────────────

/** A connected Xero organisation as shown on the Connected Companies page. */
export interface CompanyItem {
  companyId: string;
  tenantId: string;
  tenantName: string;
  tenantType: string;
  connectedAt: string;
  lastSyncedAt: string | null;
  isActive: boolean;
  invoiceCount: number;
  contactCount: number;
  overpaymentCount: number;
  lastSync?: {
    syncType: string;
    status: string;
    recordsFetched: number | null;
    startedAt: string;
    completedAt: string | null;
    errorMessage: string | null;
  } | null;
}

export interface SyncLogsModalProps {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
}
