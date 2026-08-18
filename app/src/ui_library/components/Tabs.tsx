export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  /** Small count shown after the label, e.g. a pending total. */
  badge?: number;
}

export type TabsOrientation = 'horizontal' | 'vertical';

export interface TabsProps<T extends string = string> {
  tabs: ReadonlyArray<TabItem<T>>;
  active: T;
  onChange: (id: T) => void;
  /** `vertical` renders the sidebar-style rail used on Settings. */
  orientation?: TabsOrientation;
  className?: string;
}

/**
 * Tab navigation for switching panels within a page.
 *
 * This is the presentational rail only — the caller owns which tab is active
 * and what each panel contains, so a page can keep tab state in the URL.
 */
export function Tabs<T extends string = string>({
  tabs,
  active,
  onChange,
  orientation = 'horizontal',
  className = '',
}: TabsProps<T>) {
  const vertical = orientation === 'vertical';

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={
        vertical
          ? `flex flex-col bg-surface border border-line rounded-lg overflow-hidden ${className}`
          : `flex items-center gap-1 border-b border-line ${className}`
      }
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;

        const base = 'flex items-center gap-3 text-sm font-medium transition-colors';
        const shape = vertical
          ? `w-full px-4 py-3 text-left border-l-4 ${
              isActive
                ? 'bg-brand-light text-brand border-l-brand'
                : 'text-ink-mid hover:bg-line-light border-l-transparent'
            }`
          : `px-4 py-2.5 border-b-2 -mb-px ${
              isActive
                ? 'text-brand border-b-brand'
                : 'text-ink-mid hover:text-ink border-b-transparent'
            }`;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`${base} ${shape}`}
          >
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-brand-light text-brand text-xs font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
