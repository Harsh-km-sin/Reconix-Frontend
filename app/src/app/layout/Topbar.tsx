import { Search } from 'lucide-react';
import { CompanySwitcher } from '@/app/layout/CompanySwitcher';
import { NotificationsMenu } from '@/app/layout/NotificationsMenu';
import { UserMenu } from '@/app/layout/UserMenu';
import type { AppNotification, TopbarProps } from '@/app/layout/types';

/** Nothing feeds the notification list yet; the menu renders its empty state. */
const NOTIFICATIONS: readonly AppNotification[] = [];

/** The fixed header: which company, global search, and account controls. */
export function Topbar({
  user,
  onLogout,
  companies,
  companyId,
  onSwitchCompany,
}: TopbarProps) {
  return (
    <header className="h-16 bg-surface border-b border-line flex items-center justify-between px-6 sticky top-0 z-40">
      <CompanySwitcher
        companies={companies}
        companyId={companyId}
        onSwitchCompany={onSwitchCompany}
      />

      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
          <input
            type="text"
            placeholder="Search invoices, vendors..."
            className="w-full h-10 pl-10 pr-4 bg-line-light border border-transparent rounded-md text-sm placeholder:text-ink-light focus:bg-surface focus:border-brand focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 text-sm">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-ink-mid">Connected</span>
        </div>

        <NotificationsMenu notifications={NOTIFICATIONS} />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
