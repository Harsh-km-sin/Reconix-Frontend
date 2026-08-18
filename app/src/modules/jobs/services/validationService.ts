import { api } from '@/lib/api';

export interface ValidationReportItem {
    id: string;
    status: 'VALID' | 'WARNING' | 'INVALID' | 'ERROR';
    warnings: string[];
    errors: string[];
}

export interface ValidationResponse {
    report: ValidationReportItem[];
}

export const validationService = {
    runValidation: async (data: { jobId?: string, items?: any[] }) => {
        return api.post<ValidationResponse>('validation/run', data);
    }
};
