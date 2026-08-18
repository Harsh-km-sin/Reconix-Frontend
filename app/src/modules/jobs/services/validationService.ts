import { api } from '@/lib/api';
import type { ValidationResponse } from '@/modules/jobs/types';

export const validationService = {
    runValidation: async (data: { jobId?: string, items?: any[] }) => {
        return api.post<ValidationResponse>('validation/run', data);
    }
};
