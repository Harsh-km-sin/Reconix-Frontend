export interface SkeletonProps {
  className?: string;
}

/**
 * A shimmering placeholder the shape of the content that is coming. Prefer this
 * over a spinner when you know the layout in advance — it stops the page
 * reflowing when the data lands.
 *
 * The shimmer itself is the `.animate-shimmer` utility in index.css.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-shimmer rounded bg-line-light ${className}`} />;
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/** Placeholder rows for a table that is still loading. */
export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: columns }).map((_, column) => (
            <Skeleton key={column} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
