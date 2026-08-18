import type React from 'react';
import type { User, CompanyOption, NavItem } from '@/types';

export interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  /** JWT permissions (module names + "module:write"); used to filter nav items */
  permissions?: readonly string[];
  /** Companies from auth (for company switcher); admin sees all */
  companies?: CompanyOption[];
  /** Current company id from auth */
  companyId?: string | null;
  /** Called when user clicks a different company; receives target companyId */
  onSwitchCompany?: (companyId: string) => Promise<boolean>;
}

export interface SidebarProps {
  /** Already filtered by permission — Sidebar does not do access control. */
  navItems: readonly NavItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export interface TopbarProps {
  user: User | null;
  onLogout: () => void;
  companies: readonly CompanyOption[];
  companyId: string | null;
  onSwitchCompany?: (companyId: string) => Promise<boolean>;
}

export interface CompanySwitcherProps {
  companies: readonly CompanyOption[];
  companyId: string | null;
  onSwitchCompany?: (companyId: string) => Promise<boolean>;
}

export interface UserMenuProps {
  user: User | null;
  onLogout: () => void;
}

/** One entry in the notifications dropdown. */
export interface AppNotification {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
}

export interface NotificationsMenuProps {
  notifications: readonly AppNotification[];
}
