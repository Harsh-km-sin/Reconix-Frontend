import { api } from '@/lib/api';
import type { Job, JobType } from '@/types';
import type { Paginated } from '@/lib/types/api';
import type { ListJobsOptions } from '@/modules/jobs/types';

export const jobService = {
    listJobs: async (options: ListJobsOptions = {}) => {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.type && options.type !== 'ALL') params.append('type', options.type);
        if (options.status && options.status !== 'ALL') params.append('status', options.status);
        if (options.dateFrom) params.append('dateFrom', options.dateFrom);
        if (options.dateTo) params.append('dateTo', options.dateTo);
        if (options.sortBy) params.append('sortBy', options.sortBy);
        if (options.sortOrder) params.append('sortOrder', options.sortOrder);

        const queryString = params.toString();
        const path = queryString ? `jobs?${queryString}` : 'jobs';
        return api.get<Paginated<Job>>(path);
    },

    getJob: async (jobId: string) => {
        return api.get<Job>(`jobs/${jobId}`);
    },

    createJob: async (data: { jobType: JobType; reversalDate?: string; notes?: string }) => {
        return api.post<Job>('jobs', data);
    },

    addItems: async (jobId: string, items: any[]) => {
        return api.post<void>(`jobs/${jobId}/items`, { items });
    },

    approveJob: async (jobId: string) => {
        return api.post<Job>(`jobs/${jobId}/approve`);
    },

    deleteJob: async (jobId: string) => {
        return api.delete<void>(`jobs/${jobId}`);
    },

    acknowledgeItem: async (jobId: string, itemId: string) => {
        return api.patch<void>(`jobs/${jobId}/items/${itemId}/acknowledge`);
    },

    removeItem: async (jobId: string, itemId: string) => {
        return api.delete<void>(`jobs/${jobId}/items/${itemId}`);
    },
    
    retryJob: async (jobId: string) => {
        return api.post<void>(`jobs/${jobId}/retry`);
    },
    
    cancelJob: async (jobId: string) => {
        return api.post<void>(`jobs/${jobId}/cancel`);
    }
};
