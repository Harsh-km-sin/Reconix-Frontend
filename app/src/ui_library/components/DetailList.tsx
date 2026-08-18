import { EM_DASH } from '@/lib/format';

export interface DetailItem {
  label: string;
  /** Rendered as-is. An em dash is shown when this is null/undefined/''. */
  value: React.ReactNode;
  /** Make this row span the full width in a multi-column layout. */
  wide?: boolean;
}

export type DetailListColumns = 1 | 2 | 3;

export interface DetailListProps {
  items: ReadonlyArray<DetailItem>;
  columns?: DetailListColumns;
  className?: string;
}

const GRID: Record<DetailListColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

const isEmpty = (value: React.ReactNode) =>
  value === null || value === undefined || value === '';

/** Label/value pairs for a detail pane. Replaces ad-hoc grids of &lt;p&gt; tags. */
export function DetailList({ items, columns = 2, className = '' }: DetailListProps) {
  return (
    <dl className={`grid gap-4 ${GRID[columns]} ${className}`}>
      {items.map((item) => (
        <div key={item.label} className={item.wide ? 'sm:col-span-full' : undefined}>
          <dt className="text-xs font-medium text-ink-light uppercase tracking-wide">
            {item.label}
          </dt>
          <dd className="text-sm text-ink mt-1 break-words">
            {isEmpty(item.value) ? EM_DASH : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
