/** One audit-log row as returned by GET /api/v1/audit. */
export interface AuditLog {
  id: string;
  companyId: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  beforeState: any;
  afterState: any;
  xeroRequest: any;
  xeroResponse: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/** Query parameters for the audit-log list endpoint. */
export interface ListAuditLogsOptions {
  userId?: string;
  action?: string;
  resourceId?: string;
  resourceType?: string;
  page?: number;
  limit?: number;
}
