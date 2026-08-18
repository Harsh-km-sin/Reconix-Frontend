import { DatePicker } from '@/ui_library/components/DatePicker';

export interface DateRange {
  /** ISO `YYYY-MM-DD`, or '' for unbounded. */
  from: string;
  to: string;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A from/to pair.
 *
 * The two ends constrain each other — `to` cannot be set before `from` and vice
 * versa — so an impossible range cannot be entered and then sent to the API.
 */
export function DateRangePicker({
  value,
  onChange,
  disabled = false,
  className = '',
}: DateRangePickerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DatePicker
        value={value.from}
        max={value.to || undefined}
        disabled={disabled}
        aria-label="From date"
        onChange={(from) => onChange({ ...value, from })}
        className="flex-1"
      />
      <span className="text-sm text-ink-light flex-shrink-0">to</span>
      <DatePicker
        value={value.to}
        min={value.from || undefined}
        disabled={disabled}
        aria-label="To date"
        onChange={(to) => onChange({ ...value, to })}
        className="flex-1"
      />
    </div>
  );
}
