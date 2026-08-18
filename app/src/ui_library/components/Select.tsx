import { ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  /** Shown as a disabled first option when `value` is empty. */
  placeholder?: string;
  disabled?: boolean;
  /** Renders a red border; pair with FormField to show the message. */
  invalid?: boolean;
  'aria-label'?: string;
  className?: string;
}

/**
 * A native select, styled to match the rest of the inputs.
 *
 * Deliberately native rather than the Radix listbox: these are short, static
 * option lists, and the native control gets keyboard and mobile behaviour right
 * for free.
 */
export function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  invalid = false,
  className = '',
  ...rest
}: SelectProps<T>) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={rest['aria-label']}
        onChange={(e) => onChange(e.target.value as T)}
        className={`w-full h-10 pl-3 pr-9 bg-surface border rounded-md text-sm text-ink appearance-none focus:ring-2 focus:outline-none transition-all disabled:opacity-50 ${
          invalid
            ? 'border-danger focus:border-danger focus:ring-danger/10'
            : 'border-line focus:border-brand focus:ring-brand/10'
        }`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light pointer-events-none" />
    </div>
  );
}
