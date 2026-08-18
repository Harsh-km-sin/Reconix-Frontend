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
export { ToastContainer } from './feedback/ToastContainer';

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
