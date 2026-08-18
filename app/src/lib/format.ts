/**
 * Display formatters. One implementation each — before this file, currency was
 * formatted four different ways and dates three, so the same timestamp rendered
 * differently depending on which page you were looking at.
 *
 * Dates use en-GB (day-first) throughout, which is what every call site already
 * used. Times are shown in the viewer's local zone.
 */

/** Shown in place of a value that is absent, not a value that is zero. */
export const EM_DASH = '—';

// ── money ───────────────────────────────────────────────────────────────────

/**
 * Format an amount as currency. Defaults to USD because that is what the app
 * displayed everywhere before; pass a company's baseCurrency where you have it.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'USD'
): string {
  if (amount === null || amount === undefined || amount === '') return EM_DASH;
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return EM_DASH;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

/** Format a plain count with thousands separators. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  return new Intl.NumberFormat('en-US').format(value);
}

// ── dates ───────────────────────────────────────────────────────────────────

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `04/03/2026` */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return EM_DASH;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** `04/03/2026, 14:07` — the default for timestamps in lists and detail panes. */
export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return EM_DASH;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** `04/03/2026, 14:07:33` — for audit trails, where the second matters. */
export function formatTimestamp(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return EM_DASH;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ── durations ───────────────────────────────────────────────────────────────

/**
 * Elapsed time between two instants: `840ms`, `2.4s`, `3m 12s`.
 *
 * Returns "In progress" when `end` is missing but `start` is present, since
 * every call site was rendering a run that had not finished yet.
 */
export function formatDuration(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  const from = toDate(start);
  if (!from) return EM_DASH;
  const to = toDate(end);
  if (!to) return 'In progress';

  const ms = to.getTime() - from.getTime();
  if (ms < 0) return EM_DASH;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// ── identifiers ─────────────────────────────────────────────────────────────

/**
 * The tail of a UUID, upper-cased — short enough to read aloud, long enough to
 * pick a row out of a list. `…8f0c-4b21-9e7a` -> `4B219E7A`.
 */
export function shortId(id: string | null | undefined, length = 8): string {
  if (!id) return EM_DASH;
  return id.slice(-length).toUpperCase();
}

/** The head of an external id, for showing which tenant a row belongs to. */
export function idPrefix(id: string | null | undefined, length = 8): string {
  if (!id) return EM_DASH;
  return id.slice(0, length);
}
