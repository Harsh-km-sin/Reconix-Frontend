import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, X } from 'lucide-react';

export type ErrorStateVariant = 'inline' | 'card' | 'page';

export interface ErrorStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
}

export interface ErrorStateProps {
  /** Short headline, e.g. "Sync failed". */
  title?: string;
  /** Human-readable reason. Prefer the backend's message (see getErrorMessage). */
  message: string;
  /** Optional technical detail, shown behind a "Details" toggle. */
  detail?: string | null;
  /** inline = compact banner · card = bordered block · page = centered empty-state */
  variant?: ErrorStateVariant;
  /** Optional recovery action, e.g. Retry / Reconnect. */
  action?: ErrorStateAction;
  /** Show a dismiss (×) button. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * System-wide failure surface. Use everywhere an operation can fail so users see
 * the real reason and a way forward, instead of a generic toast.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  detail,
  variant = 'inline',
  action,
  onDismiss,
  className = '',
}: ErrorStateProps) {
  const [showDetail, setShowDetail] = useState(false);
  const ActionIcon = action?.icon;

  const actionButton = action && (
    <button
      onClick={action.onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger text-white rounded-md text-xs font-semibold hover:bg-danger-hover transition-colors"
    >
      {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
      {action.label}
    </button>
  );

  const detailBlock = detail && (
    <div className="mt-2">
      <button
        onClick={() => setShowDetail((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-ink-light hover:text-ink-mid transition-colors"
      >
        {showDetail ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Details
      </button>
      {showDetail && (
        <pre className="mt-1.5 p-2 bg-page border border-[#EEEEEE] rounded text-[11px] text-ink-mid whitespace-pre-wrap break-words max-h-40 overflow-auto">
          {detail}
        </pre>
      )}
    </div>
  );

  if (variant === 'page') {
    return (
      <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
        <div className="w-14 h-14 rounded-full bg-danger-light flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-danger" />
        </div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="text-sm text-ink-mid mt-1 max-w-md">{message}</p>
        <div className="max-w-md w-full">{detailBlock}</div>
        {action && <div className="mt-5">{actionButton}</div>}
      </div>
    );
  }

  const containerClass =
    variant === 'card'
      ? 'p-4 bg-surface border border-[#FFCDD2] rounded-xl'
      : 'p-3 bg-danger-light border border-[#FFCDD2] rounded-lg';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-sm text-ink-mid mt-0.5 break-words">{message}</p>
          {detailBlock}
          {action && <div className="mt-3">{actionButton}</div>}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 text-ink-light hover:text-ink-mid rounded transition-colors" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
