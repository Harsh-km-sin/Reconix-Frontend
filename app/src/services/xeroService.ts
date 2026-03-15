import { api } from '../lib/api';
import type { Invoice, Overpayment, InvoiceFilter } from '../types';
import type { ListResponse } from './jobService';

export interface ListInvoicesOptions extends InvoiceFilter {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const xeroService = {
    getInvoices: async (options: ListInvoicesOptions = {}) => {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.dateFrom) params.append('dateFrom', options.dateFrom);
        if (options.dateTo) params.append('dateTo', options.dateTo);
        if (options.search) params.append('search', options.search);
        if (options.vendorId) params.append('vendorId', options.vendorId);
        if (options.status) params.append('status', options.status);
        if (options.currencyCode) params.append('currencyCode', options.currencyCode);
        if (options.amountMin) params.append('amountMin', options.amountMin.toString());
        if (options.amountMax) params.append('amountMax', options.amountMax.toString());
        if (options.sortBy) params.append('sortBy', options.sortBy);
        if (options.sortOrder) params.append('sortOrder', options.sortOrder);

        const queryString = params.toString();
        const path = queryString ? `xero/invoices?${queryString}` : 'xero/invoices';
        return api.get<ListResponse<Invoice>>(path);
    },

    getOverpayments: async (options: { page?: number; limit?: number; search?: string; vendorId?: string } = {}) => {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.search) params.append('search', options.search);
        if (options.vendorId) params.append('vendorId', options.vendorId);

        const queryString = params.toString();
        const path = queryString ? `xero/overpayments?${queryString}` : 'xero/overpayments';
        return api.get<ListResponse<Overpayment>>(path);
    },

    getContacts: async (options: { search?: string; isSupplier?: boolean; isCustomer?: boolean } = {}) => {
        const params = new URLSearchParams();
        if (options.search) params.append('search', options.search);
        if (options.isSupplier !== undefined) params.append('isSupplier', options.isSupplier.toString());
        if (options.isCustomer !== undefined) params.append('isCustomer', options.isCustomer.toString());

        return api.get<any[]>(`xero/contacts?${params.toString()}`);
    },

    getAccounts: async (options: { search?: string; type?: string } = {}) => {
        const params = new URLSearchParams();
        if (options.search) params.append('search', options.search);
        if (options.type) params.append('type', options.type);

        return api.get<any[]>(`xero/accounts?${params.toString()}`);
    }
};
