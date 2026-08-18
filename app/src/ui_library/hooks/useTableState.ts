import { useCallback, useMemo, useState } from 'react';
import { useDebounce as useDebouncedValue } from './useDebounce';

export type SortOrder = 'asc' | 'desc';

export interface TableState {
  page: number;
  limit: number;
  search: string;
  sortBy: string | null;
  sortOrder: SortOrder;
}

export interface UseTableStateOptions extends Partial<TableState> {
  /** Debounce applied to `search` before it reaches `queryParams`. */
  searchDelay?: number;
}

export interface UseTableStateResult extends TableState {
  /** `search`, debounced — the value to send to the API. */
  debouncedSearch: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  /** Also resets to page 1, since the old page number is meaningless. */
  setSearch: (search: string) => void;
  /** Toggles direction when re-sorting the same column, else sorts ascending. */
  toggleSort: (column: string) => void;
  reset: () => void;
  /** Everything a list endpoint needs, ready to spread into the options object. */
  queryParams: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: SortOrder;
  };
}

/**
 * Pagination, search and sort for a table, in one place.
 *
 * Both AuditLog and JobHistory grew their own copy of this; DataTable (F6)
 * consumes this hook so every table behaves the same way.
 */
export function useTableState(options: UseTableStateOptions = {}): UseTableStateResult {
  const {
    page: initialPage = 1,
    limit: initialLimit = 20,
    search: initialSearch = '',
    sortBy: initialSortBy = null,
    sortOrder: initialSortOrder = 'desc',
    searchDelay = 300,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [search, setSearchState] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<string | null>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const debouncedSearch = useDebouncedValue(search, searchDelay);

  // Changing what is being listed invalidates the current page number.
  const setSearch = useCallback((next: string) => {
    setSearchState(next);
    setPage(1);
  }, []);

  const setLimit = useCallback((next: number) => {
    setLimitState(next);
    setPage(1);
  }, []);

  const toggleSort = useCallback((column: string) => {
    setSortBy((currentColumn) => {
      if (currentColumn === column) {
        setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortOrder('asc');
      }
      return column;
    });
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimitState(initialLimit);
    setSearchState(initialSearch);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [initialPage, initialLimit, initialSearch, initialSortBy, initialSortOrder]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(sortBy ? { sortBy, sortOrder } : {}),
    }),
    [page, limit, debouncedSearch, sortBy, sortOrder]
  );

  return {
    page,
    limit,
    search,
    debouncedSearch,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSearch,
    toggleSort,
    reset,
    queryParams,
  };
}
