import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  /** 1-based. */
  page: number;
  /** Rows per page. */
  limit: number;
  /** Total rows across all pages. */
  total: number;
  onPageChange: (page: number) => void;
  /** Hide the "Showing x–y of z" line. */
  hideSummary?: boolean;
  className?: string;
}

/** How many numbered buttons to show around the current page. */
const WINDOW = 2;

function pageNumbers(page: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const pages = new Set<number>([1, pageCount]);
  for (let p = page - WINDOW; p <= page + WINDOW; p++) {
    if (p > 1 && p < pageCount) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | '…'> = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) out.push('…');
    out.push(p);
    previous = p;
  }
  return out;
}

/**
 * Page navigation for a list. Both AuditLog and JobHistory had grown their own
 * copy; DataTable renders this one.
 */
export function Pagination({
  page,
  limit,
  total,
  onPageChange,
  hideSummary = false,
  className = '',
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  if (pageCount <= 1 && hideSummary) return null;

  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  const step = (to: number) => onPageChange(Math.min(pageCount, Math.max(1, to)));

  const arrowClass =
    'p-2 rounded-md border border-line text-ink-mid transition-colors ' +
    'hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed ' +
    'disabled:hover:border-line disabled:hover:text-ink-mid';

  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-3 border-t border-line ${className}`}>
      {!hideSummary && (
        <p className="text-sm text-ink-light">
          {total === 0 ? 'No results' : `Showing ${first}–${last} of ${total}`}
        </p>
      )}

      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => step(page - 1)}
            disabled={page <= 1}
            className={arrowClass}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers(page, pageCount).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-2 text-ink-light select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => step(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`min-w-9 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-brand text-white'
                    : 'text-ink-mid hover:bg-line-light'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => step(page + 1)}
            disabled={page >= pageCount}
            className={arrowClass}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
