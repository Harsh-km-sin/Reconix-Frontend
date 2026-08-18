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

// ── inputs ──────────────────────────────────────────────────────────────────
export { SearchInput } from './components/SearchInput';
export type { SearchInputProps } from './components/SearchInput';
export { Select } from './components/Select';
export type { SelectProps, SelectOption } from './components/Select';
export { DatePicker } from './components/DatePicker';
export type { DatePickerProps } from './components/DatePicker';
export { DateRangePicker } from './components/DateRangePicker';
export type { DateRangePickerProps, DateRange } from './components/DateRangePicker';
export { FilterBar } from './components/FilterBar';
export type { FilterBarProps } from './components/FilterBar';
export { FormField } from './components/FormField';
export type { FormFieldProps } from './components/FormField';

// ── display ─────────────────────────────────────────────────────────────────
export { StatCard } from './components/StatCard';
export type { StatCardProps, Trend } from './components/StatCard';
export { ActionCard } from './components/ActionCard';
export type { ActionCardProps, ActionCardBadge } from './components/ActionCard';
export { StatusBadge } from './components/StatusBadge';
export type { StatusBadgeProps, StatusBadgeVariant, StatusBadgeSize } from './components/StatusBadge';
export { Money } from './components/Money';
export type { MoneyProps } from './components/Money';
export { DetailList } from './components/DetailList';
export type { DetailListProps, DetailItem, DetailListColumns } from './components/DetailList';

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
