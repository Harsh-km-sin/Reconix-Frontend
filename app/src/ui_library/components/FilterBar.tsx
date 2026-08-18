import { SlidersHorizontal, X } from 'lucide-react';

export interface FilterBarProps {
  children: React.ReactNode;
  /**
   * How many filters are currently narrowing the list. When > 0 the reset
   * button appears — so pass the count of *active* filters, not of controls.
   */
  activeCount?: number;
  onReset?: () => void;
  /** Right-aligned extras, e.g. an export button. */
  actions?: React.ReactNode;
  className?: string;
}

/** The filter row above a table: controls on the left, reset and actions right. */
export function FilterBar({
  children,
  activeCount = 0,
  onReset,
  actions,
  className = '',
}: FilterBarProps) {
  return (
    <div
      className={`bg-surface border border-line rounded-lg p-4 mb-4 flex flex-wrap items-center gap-3 ${className}`}
    >
      <SlidersHorizontal className="w-4 h-4 text-ink-light flex-shrink-0" />

      {children}

      <div className="flex items-center gap-2 ml-auto">
        {activeCount > 0 && onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ink-mid hover:text-brand transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
