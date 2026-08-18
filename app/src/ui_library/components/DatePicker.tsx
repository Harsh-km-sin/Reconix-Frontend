import { Calendar as CalendarIcon, X } from 'lucide-react';

export interface DatePickerProps {
  /** ISO date, `YYYY-MM-DD`. Empty string means unset. */
  value: string;
  onChange: (value: string) => void;
  /** ISO bounds, both inclusive. */
  min?: string;
  max?: string;
  disabled?: boolean;
  invalid?: boolean;
  'aria-label'?: string;
  className?: string;
}

/**
 * A single date.
 *
 * Native `input[type=date]` on purpose: the values that travel to the API are
 * ISO strings either way, and the native picker is localised, keyboard
 * accessible and works on mobile without shipping a calendar widget.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  invalid = false,
  className = '',
  ...rest
}: DatePickerProps) {
  return (
    <div className={`relative ${className}`}>
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light pointer-events-none" />
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={rest['aria-label']}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-10 pl-10 pr-9 bg-surface border rounded-md text-sm text-ink focus:ring-2 focus:outline-none transition-all disabled:opacity-50 ${
          invalid
            ? 'border-danger focus:border-danger focus:ring-danger/10'
            : 'border-line focus:border-brand focus:ring-brand/10'
        }`}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear date"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-light hover:text-ink-mid rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
