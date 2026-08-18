import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  RefreshCw,
  CreditCard,
  PlusCircle,
  ClipboardList,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Activity,
  Shield,
} from 'lucide-react';
import type { NavItem } from '@/types';
import type { SidebarProps } from '@/app/layout/types';

/** Nav items name their icon as a string, so the string has to resolve to a component. */
const iconMap: Record<string, React.ElementType> = {
  Home,
  RefreshCw,
  CreditCard,
  PlusCircle,
  ClipboardList,
  Building2,
  Settings,
  Activity,
  Shield,
};

/** Sidebar sections, in render order. */
const SECTIONS = [
  { key: 'main', label: 'Main Actions' },
  { key: 'operations', label: 'Operations' },
  { key: 'config', label: 'Configuration' },
] as const;

interface NavButtonProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
}

function NavButton({ item, collapsed, active, onClick }: NavButtonProps) {
  const Icon = iconMap[item.icon] ?? Home;

  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
        active ? 'bg-brand-light text-brand' : 'text-ink-mid hover:bg-line-light hover:text-ink'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                item.id === 'history' ? 'bg-danger-light text-danger' : 'bg-brand-light text-brand'
              }`}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

/**
 * The left navigation rail.
 *
 * The three sections used to be three copies of the same 25-line block, which
 * is why the badge colour rule had already drifted between them; there is now
 * one NavButton and the rule lives in it.
 */
export function Sidebar({ navItems, collapsed, onToggleCollapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-page border-r border-line transition-all duration-250 z-50 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="h-16 flex items-center px-4 border-b border-line">
        <img src="/logo.png" alt="Xero Automation" className="h-8 w-8" />
        {!collapsed && (
          <span className="ml-3 font-semibold text-ink text-sm">Xero Automation</span>
        )}
      </div>

      <nav
        className="p-3 flex flex-col gap-1 overflow-y-auto custom-scrollbar"
        style={{ height: 'calc(100% - 128px)' }}
      >
        {SECTIONS.map(({ key, label }, sectionIndex) => {
          const items = navItems.filter((item) => item.section === key);
          if (items.length === 0) return null;

          return (
            <div key={key} className="contents">
              {!collapsed && (
                <div
                  className={`text-xs font-semibold text-ink-light uppercase tracking-wide px-3 py-2 ${
                    sectionIndex > 0 ? 'mt-4' : ''
                  }`}
                >
                  {label}
                </div>
              )}
              {items.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  active={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-line bg-page">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-md text-ink-light hover:bg-line-light hover:text-ink-mid transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {!collapsed && (
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-light hover:text-ink-mid transition-colors">
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
