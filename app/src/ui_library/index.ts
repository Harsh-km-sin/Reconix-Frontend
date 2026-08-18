/**
 * Public surface of the UI library.
 *
 * Side-effect free: this file only re-exports, so a bundler can drop anything
 * an entry point does not reach. Primitives are intentionally NOT re-exported
 * here — deep-import them (`@/ui_library/primitives/button`) so pulling one
 * component never drags the whole shadcn layer into a chunk.
 *
 * Nothing in `ui_library/` may import from `modules/`.
 */

// ── feedback ────────────────────────────────────────────────────────────────
export { ErrorState } from './feedback/ErrorState';
export type { ErrorStateProps, ErrorStateAction, ErrorStateVariant } from './feedback/ErrorState';
export { LoadingState } from './feedback/LoadingState';
export type { LoadingStateProps, LoadingStateVariant } from './feedback/LoadingState';
export { EmptyState } from './feedback/EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './feedback/EmptyState';
export { Skeleton, SkeletonTable } from './feedback/Skeleton';
export type { SkeletonProps, SkeletonTableProps } from './feedback/Skeleton';
export { ToastContainer } from './feedback/ToastContainer';

// ── components ──────────────────────────────────────────────────────────────
export { DataTable } from './components/DataTable';
export type {
  DataTableProps,
  DataTablePagination,
  Column,
  ColumnAlign,
} from './components/DataTable';
export { Pagination } from './components/Pagination';
export type { PaginationProps } from './components/Pagination';
export { Modal } from './components/Modal';
export type { ModalProps, ModalSize } from './components/Modal';
export { ConfirmDialog } from './components/ConfirmDialog';
export type { ConfirmDialogProps } from './components/ConfirmDialog';
export { PageHeader } from './components/PageHeader';
export type { PageHeaderProps } from './components/PageHeader';
export { Tabs } from './components/Tabs';
export type { TabsProps, TabItem, TabsOrientation } from './components/Tabs';

// ── hooks ───────────────────────────────────────────────────────────────────
export { useIsMobile } from './hooks/useMobile';
export { useDebounce } from './hooks/useDebounce';
export { usePolling } from './hooks/usePolling';
export { useTableState } from './hooks/useTableState';
export type {
  TableState,
  UseTableStateOptions,
  UseTableStateResult,
  SortOrder,
} from './hooks/useTableState';
