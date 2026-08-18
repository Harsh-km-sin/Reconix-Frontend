import { formatCurrency } from '@/lib/format';

export interface MoneyProps {
  amount: number | string | null | undefined;
  /** ISO code. Defaults to USD, matching lib/format. */
  currency?: string;
  /**
   * Tint negatives red and positives green. Off by default: on an invoice list
   * a negative is normal, not an error.
   */
  signed?: boolean;
  /** Tabular figures so columns of numbers line up. */
  mono?: boolean;
  className?: string;
}

/**
 * A currency amount. Always right-alignable and always formatted the same way,
 * because it goes through lib/format like everything else.
 */
export function Money({
  amount,
  currency,
  signed = false,
  mono = true,
  className = '',
}: MoneyProps) {
  const numeric = typeof amount === 'number' ? amount : Number(amount);
  const tone =
    signed && Number.isFinite(numeric)
      ? numeric < 0
        ? 'text-danger'
        : numeric > 0
          ? 'text-success'
          : ''
      : '';

  return (
    <span className={`${mono ? 'font-mono tabular-nums' : ''} ${tone} ${className}`}>
      {formatCurrency(amount, currency)}
    </span>
  );
}
