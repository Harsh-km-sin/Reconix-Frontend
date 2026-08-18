import { Fragment, useMemo } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox } from 'lucide-react';
import { EmptyState } from '@/ui_library/feedback/EmptyState';
import { ErrorState } from '@/ui_library/feedback/ErrorState';
import { LoadingState } from '@/ui_library/feedback/LoadingState';
import { Pagination } from '@/ui_library/components/Pagination';
import type { SortOrder } from '@/ui_library/hooks/useTableState';

export type ColumnAlign = 'left' | 'center' | 'right';

export interface Column<T> {
  /** Stable id. Also the value passed to `onSort`, so it doubles as the API sort key. */
  key: string;
  header: React.ReactNode;
  /** Cell contents. Return a node, not a string, when you need a badge or a link. */
  render: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: ColumnAlign;
  /** Extra classes on both header and body cells, e.g. `min-w-[200px]`. */
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

/**
 * How the table paginates.
 *
 * `server` is for endpoints that page for you — JobHistory. `client` is for a
 * list already held in full — JobReviewScreen. Supporting both from the start
 * is deliberate: the two behave differently, and a table that knows only one of
 * them gets forked the first time it meets the other.
 */
export type DataTablePagination =
  | { mode: 'none' }
  | { mode: 'client'; pageSize: number; page: number; onPageChange: (page: number) => void }
  | {
      mode: 'server';
      page: number;
      limit: number;
      total: number;
      onPageChange: (page: number) => void;
    };

export interface DataTableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  /** Must be stable across renders — React uses it as the row key. */
  rowKey: (row: T, index: number) => string;

  isLoading?: boolean;
  /** A message, not an Error. Pass what the user should read. */
  error?: string | null;
  onRetry?: () => void;

  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  /** Replaces the default EmptyState entirely. */
  empty?: React.ReactNode;

  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  /** Renders a full-width row beneath `row`, e.g. an expanded error detail. */
  renderSubRow?: (row: T, index: number) => React.ReactNode;

  /**
   * Bucket rows under headings, e.g. line items grouped by vendor. Groups
   * appear in first-seen order; `index` passed to `render` stays the row's
   * index in the original array, so numbering survives grouping.
   */
  groupBy?: (row: T, index: number) => string;
  /** Required when `groupBy` is set. Rendered in a full-width row above each group. */
  renderGroupHeader?: (groupKey: string, rows: readonly T[]) => React.ReactNode;

  sortBy?: string | null;
  sortOrder?: SortOrder;
  onSort?: (key: string) => void;

  pagination?: DataTablePagination;
  /** Header stays put while the body scrolls. Needs a bounded height on the wrapper. */
  stickyHeader?: boolean;
  /** Applied to the scroll container, e.g. `max-h-[600px]`. */
  bodyClassName?: string;
  className?: string;
}

const ALIGN: Record<ColumnAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * The one table.
 *
 * Replaces seven hand-rolled `table` blocks that each had their own header
 * styling, their own empty state, and — in two cases — their own pagination.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'Nothing to show',
  emptyMessage,
  emptyIcon = Inbox,
  empty,
  onRowClick,
  rowClassName,
  renderSubRow,
  groupBy,
  renderGroupHeader,
  sortBy = null,
  sortOrder = 'desc',
  onSort,
  pagination = { mode: 'none' },
  stickyHeader = false,
  bodyClassName = '',
  className = '',
}: DataTableProps<T>) {
  // Client mode slices here; server mode trusts the caller to have done it.
  const visibleRows = useMemo(() => {
    if (pagination.mode !== 'client') return rows;
    const start = (pagination.page - 1) * pagination.pageSize;
    return rows.slice(start, start + pagination.pageSize);
  }, [rows, pagination]);

  // Grouped rows keep their original index so numbering columns stay meaningful.
  const groups = useMemo(() => {
    if (!groupBy) return null;
    const buckets = new Map<string, Array<{ row: T; index: number }>>();
    visibleRows.forEach((row, index) => {
      const key = groupBy(row, index);
      const bucket = buckets.get(key);
      if (bucket) bucket.push({ row, index });
      else buckets.set(key, [{ row, index }]);
    });
    return [...buckets.entries()];
  }, [visibleRows, groupBy]);

  const columnCount = columns.length;

  const body = () => {
    if (error) {
      return (
        <tr>
          <td colSpan={columnCount} className="p-4">
            <ErrorState
              variant="card"
              title="Could not load this list"
              message={error}
              action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
            />
          </td>
        </tr>
      );
    }

    if (isLoading && rows.length === 0) {
      return (
        <tr>
          <td colSpan={columnCount}>
            <LoadingState />
          </td>
        </tr>
      );
    }

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={columnCount}>
            {empty ?? <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />}
          </td>
        </tr>
      );
    }

    const renderRow = (row: T, index: number) => {
      const subRow = renderSubRow?.(row, index);

      return (
        <Fragment key={rowKey(row, index)}>
          <tr
            onClick={onRowClick ? () => onRowClick(row, index) : undefined}
            className={`transition-colors ${
              onRowClick ? 'cursor-pointer hover:bg-brand-light' : 'hover:bg-page'
            } ${rowClassName?.(row, index) ?? ''}`}
          >
            {columns.map((column) => (
              <td
                key={column.key}
                className={`py-3.5 px-4 text-sm text-ink-mid ${ALIGN[column.align ?? 'left']} ${
                  column.className ?? ''
                } ${column.cellClassName ?? ''}`}
              >
                {column.render(row, index)}
              </td>
            ))}
          </tr>
          {subRow && (
            <tr>
              <td colSpan={columnCount} className="px-4 pb-3">
                {subRow}
              </td>
            </tr>
          )}
        </Fragment>
      );
    };

    if (!groups) return visibleRows.map((row, index) => renderRow(row, index));

    return groups.map(([groupKey, entries]) => (
      <Fragment key={groupKey}>
        <tr className="bg-page border-y border-line">
          <td colSpan={columnCount} className="py-2.5 px-4">
            {renderGroupHeader?.(groupKey, entries.map((e) => e.row))}
          </td>
        </tr>
        {entries.map(({ row, index }) => renderRow(row, index))}
      </Fragment>
    ));
  };

  const total =
    pagination.mode === 'server'
      ? pagination.total
      : pagination.mode === 'client'
        ? rows.length
        : 0;

  return (
    <div
      className={`bg-surface border border-line rounded-lg overflow-hidden relative ${className}`}
    >
      {/* Horizontal scroll lives here so the header scrolls with the body. */}
      <div className={`overflow-x-auto ${bodyClassName}`}>
        <table className="w-full border-collapse">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : undefined}>
            <tr className="bg-page border-b-2 border-line">
              {columns.map((column) => {
                const isSorted = sortBy === column.key;
                const canSort = column.sortable && onSort;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-mid ${
                      ALIGN[column.align ?? 'left']
                    } ${column.className ?? ''} ${column.headerClassName ?? ''}`}
                  >
                    {canSort ? (
                      <button
                        onClick={() => onSort(column.key)}
                        className="inline-flex items-center gap-1 hover:text-brand transition-colors uppercase"
                      >
                        {column.header}
                        {!isSorted ? (
                          <ChevronsUpDown className="w-3 h-3 opacity-40" />
                        ) : sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-light">{body()}</tbody>
        </table>
      </div>

      {/* A refresh over existing rows dims them rather than replacing them, so the
          table does not collapse and jump under the cursor. */}
      {isLoading && rows.length > 0 && (
        <div className="absolute inset-0 bg-surface/50 flex items-center justify-center z-20">
          <LoadingState />
        </div>
      )}

      {pagination.mode !== 'none' && !error && rows.length > 0 && (
        <Pagination
          page={pagination.page}
          limit={pagination.mode === 'server' ? pagination.limit : pagination.pageSize}
          total={total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
