import { api } from '@/lib/api';

export interface AuditLog {
    id: string;
    companyId: string;
    userId: string | null;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    beforeState: any;
    afterState: any;
    xeroRequest: any;
    xeroResponse: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

export interface ListAuditLogsOptions {
    userId?: string;
    action?: string;
    resourceId?: string;
    resourceType?: string;
    page?: number;
    limit?: number;
}

export interface ListResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export const auditService = {
    listLogs: async (options: ListAuditLogsOptions = {}) => {
        const params = new URLSearchParams();
        if (options.userId) params.append('userId', options.userId);
        if (options.action) params.append('action', options.action);
        if (options.resourceId) params.append('resourceId', options.resourceId);
        if (options.resourceType) params.append('resourceType', options.resourceType);
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());

        const queryString = params.toString();
        const path = queryString ? `audit?${queryString}` : 'audit';
        return api.get<ListResponse<AuditLog>>(path);
    }
};
