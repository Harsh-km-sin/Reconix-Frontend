import { Loader2 } from 'lucide-react';

export type LoadingStateVariant = 'inline' | 'card' | 'page';

export interface LoadingStateProps {
  /** What is being waited on, e.g. "Loading jobs…". Omit for a bare spinner. */
  message?: string;
  /** inline = sits in a row · card = fills a panel · page = fills the viewport */
  variant?: LoadingStateVariant;
  className?: string;
}

const SPINNER_SIZE: Record<LoadingStateVariant, string> = {
  inline: 'w-4 h-4',
  card: 'w-8 h-8',
  page: 'w-12 h-12',
};

/**
 * The one busy indicator. Mirrors ErrorState's variants so a panel can swap
 * between loading / error / empty without its layout jumping.
 */
export function LoadingState({ message, variant = 'card', className = '' }: LoadingStateProps) {
  const spinner = <Loader2 className={`${SPINNER_SIZE[variant]} text-brand animate-spin`} />;

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 text-sm text-ink-mid ${className}`}>
        {spinner}
        {message}
      </span>
    );
  }

  const padding = variant === 'page' ? 'min-h-screen' : 'py-16';

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${padding} ${className}`}>
      {spinner}
      {message && <p className="text-sm text-ink-mid">{message}</p>}
    </div>
  );
}
