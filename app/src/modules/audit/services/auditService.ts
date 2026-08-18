import { api } from '@/lib/api';
import type { Paginated } from '@/lib/types/api';
import type { AuditLog, ListAuditLogsOptions } from '@/modules/audit/types';

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
        return api.get<Paginated<AuditLog>>(path);
    }
};
