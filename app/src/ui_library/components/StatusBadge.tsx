import { toneBadgeClasses, toneSolidClasses, type StatusMeta, type Tone } from '@/lib/status';

export type StatusBadgeVariant = 'soft' | 'solid';
export type StatusBadgeSize = 'sm' | 'md';

export interface StatusBadgeProps {
  /**
   * Pass the result of a `lib/status` resolver — `jobStatus(job.status)`,
   * `syncStatus(log.status)` — rather than a raw string, so label and colour
   * always agree.
   */
  status: StatusMeta;
  variant?: StatusBadgeVariant;
  size?: StatusBadgeSize;
  /** Leading icon, e.g. a clock for a run in progress. */
  icon?: React.ElementType;
  /** Show the raw value instead of the resolver's label. */
  label?: string;
  className?: string;
}

const SIZE: Record<StatusBadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
};

const TONE_CLASSES: Record<StatusBadgeVariant, Record<Tone, string>> = {
  soft: toneBadgeClasses,
  solid: toneSolidClasses,
};

/** A status pill. One component, so every badge in the app is the same shape. */
export function StatusBadge({
  status,
  variant = 'soft',
  size = 'md',
  icon: Icon,
  label,
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${SIZE[size]} ${
        TONE_CLASSES[variant][status.tone]
      } ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {label ?? status.label}
    </span>
  );
}
