import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';

export type Trend = 'up' | 'down' | 'neutral';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Context under the value, e.g. "vs. last week". */
  subtext?: string;
  icon?: React.ElementType;
  trend?: Trend;
  /** Swaps the value for a small spinner while the number is being fetched. */
  isLoading?: boolean;
  className?: string;
}

const TREND_ICON: Record<Trend, React.ElementType | null> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: null,
};

const TREND_TONE: Record<Trend, string> = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-ink-light',
};

/** A single headline metric. */
export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  isLoading = false,
  className = '',
}: StatCardProps) {
  const TrendIcon = trend ? TREND_ICON[trend] : null;

  return (
    <div className={`bg-surface border border-line rounded-lg p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-mid uppercase tracking-wide">{label}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-line animate-spin" />
            ) : (
              <p className="text-2xl font-bold text-ink">{value}</p>
            )}
            {TrendIcon && trend && <TrendIcon className={`w-4 h-4 ${TREND_TONE[trend]}`} />}
          </div>
          {subtext && <p className="text-xs text-ink-light mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-brand" />
          </div>
        )}
      </div>
    </div>
  );
}
