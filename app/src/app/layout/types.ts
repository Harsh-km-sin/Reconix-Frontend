import type React from 'react';
import type { User, CompanyOption } from '@/types';

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
