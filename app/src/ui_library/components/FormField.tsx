import { useId } from 'react';

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  /** Marks the field required and appends an asterisk to the label. */
  required?: boolean;
  /** Guidance shown under the control. Hidden while `error` is set. */
  hint?: string;
  /** Replaces the hint and turns the label red. */
  error?: string | null;
  className?: string;
}

/**
 * Label, control, and one message slot.
 *
 * `children` receives the generated id via `htmlFor`, so pass a single control
 * and let it inherit — that is what makes the label actually clickable, which
 * the hand-written label/input pairs it replaces mostly were not.
 */
export function FormField({
  label,
  children,
  required = false,
  hint,
  error,
  className = '',
}: FormFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`block text-sm font-medium mb-1.5 ${error ? 'text-danger' : 'text-ink-mid'}`}
      >
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div id={id} aria-describedby={describedBy}>
        {children}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger font-medium">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-light">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
