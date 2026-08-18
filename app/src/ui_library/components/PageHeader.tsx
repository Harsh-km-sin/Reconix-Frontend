export interface PageHeaderProps {
  title: string;
  /** One line on what this page is for. */
  description?: string;
  /** Buttons and controls, right-aligned on the title row. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The title block every page opens with. Centralised so heading size, spacing
 * and the actions slot stay identical across the app.
 */
export function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink mb-2">{title}</h1>
        {description && <p className="text-ink-mid">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
