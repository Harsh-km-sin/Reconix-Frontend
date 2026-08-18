import { useMemo, useState } from 'react';
import { navItems } from '@/app/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import { Sidebar } from '@/app/layout/Sidebar';
import { Topbar } from '@/app/layout/Topbar';
import type { LayoutProps } from '@/app/layout/types';

/**
 * The application shell: nav rail, header, and the page slot.
 *
 * Access control happens here, once. Sidebar receives an already-filtered list
 * so it never has to know what a permission is.
 */
export function Layout({
  children,
  user,
  onLogout,
  permissions = [],
  companies = [],
  companyId = null,
  onSwitchCompany,
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => (item.module ? hasModuleAccess(permissions, item.module) : true)),
    [permissions]
  );

  return (
    <div className="min-h-screen bg-page flex">
      <Sidebar
        navItems={visibleNavItems}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-250 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <Topbar
          user={user}
          onLogout={onLogout}
          companies={companies}
          companyId={companyId}
          onSwitchCompany={onSwitchCompany}
        />

        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
