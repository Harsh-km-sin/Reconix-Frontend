import { useState, useMemo, useCallback } from 'react';
import type { Invoice, InvoiceFilter } from '@/types';

export function useInvoiceFilter(invoices: Invoice[]) {
  const [filters, setFilters] = useState<InvoiceFilter>({});

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Date range filter
      if (filters.dateFrom && new Date(invoice.date) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(invoice.date) > new Date(filters.dateTo)) {
        return false;
      }

      // Vendor filter
      if (filters.vendor && !invoice.vendorName.toLowerCase().includes(filters.vendor.toLowerCase())) {
        return false;
      }

      // Currency filter
      if (filters.currencies?.length && !filters.currencies.includes(invoice.currency)) {
        return false;
      }

      // Status filter
      if (filters.statuses?.length && !filters.statuses.includes(invoice.status)) {
        return false;
      }

      // Amount range filter
      if (filters.amountMin !== undefined && invoice.amountDue < filters.amountMin) {
        return false;
      }
      if (filters.amountMax !== undefined && invoice.amountDue > filters.amountMax) {
        return false;
      }

      return true;
    });
  }, [invoices, filters]);

  const setFilter = useCallback(<K extends keyof InvoiceFilter>(key: K, value: InvoiceFilter[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== undefined && value !== '' && 
      (!Array.isArray(value) || value.length > 0)
    );
  }, [filters]);

  return {
    filters,
    filteredInvoices,
    setFilter,
    resetFilters,
    hasActiveFilters,
  };
}
