export interface ActionCardBadge {
  count: number;
  type: 'info' | 'warning' | 'error';
}

export interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  /**
   * A design token name — `brand`, `success`, `warning`, `danger`, `ink-light`.
   * The tile derives both the icon colour and its tint from it, so a tile can
   * never carry a colour that is not in the palette.
   */
  tone?: string;
  badge?: ActionCardBadge;
  /** Staggered entrance in a grid; pass the index. */
  index?: number;
  className?: string;
}

const BADGE_CLASSES: Record<ActionCardBadge['type'], string> = {
  info: 'bg-brand-light text-brand',
  warning: 'bg-warning-light text-warning',
  error: 'bg-danger-light text-danger',
};

/** A clickable feature tile, as used on the dashboard grid. */
export function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  tone = 'brand',
  badge,
  index = 0,
  className = '',
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms` }}
      className={`group bg-surface border border-line rounded-lg p-6 text-left transition-all duration-250 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:border-brand hover:-translate-y-0.5 animate-slide-up ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-250 group-hover:scale-110"
          style={{ backgroundColor: `rgb(var(--${tone}) / 0.08)` }}
        >
          <Icon className="w-6 h-6" style={{ color: `rgb(var(--${tone}))` }} />
        </div>
        {badge && (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${BADGE_CLASSES[badge.type]}`}
          >
            {badge.count} pending
          </span>
        )}
      </div>
      <h3 className="font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-mid">{description}</p>
    </button>
  );
}
