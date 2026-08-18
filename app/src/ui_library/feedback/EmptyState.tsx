import { Inbox } from 'lucide-react';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
}

export interface EmptyStateProps {
  /** Short headline, e.g. "No jobs yet". */
  title: string;
  /**
   * Why it is empty and what to do about it. Say whether this is "nothing here
   * yet" or "nothing matched your filters" — they need different next steps.
   */
  message?: string;
  /** Defaults to an inbox. Pass a lucide icon that matches the domain. */
  icon?: React.ElementType;
  /** The way out, e.g. "Clear filters" or "Create job". */
  action?: EmptyStateAction;
  className?: string;
}

/**
 * Shown when a list succeeded but returned nothing. Distinct from ErrorState:
 * empty is not a failure, so it must not look like one.
 */
export function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  action,
  className = '',
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-line-light flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-ink-light" />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {message && <p className="text-sm text-ink-mid mt-1 max-w-md">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-md text-sm font-semibold hover:bg-brand-hover transition-colors"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
