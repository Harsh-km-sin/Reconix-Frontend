import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navItems } from '@/app/navigation';
import { hasModuleAccess } from '@/lib/permissions';
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
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Activity,
  Shield,
} from 'lucide-react';
import type { LayoutProps } from '@/app/layout/types';

// Icon mapping
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

export function Layout({ children, user, onLogout, permissions = [], companies = [], companyId = null, onSwitchCompany }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) =>
      item.module ? hasModuleAccess(permissions, item.module) : true
    );
  }, [permissions]);

  const notifications: { id: number; type: string; title: string; message: string; time: string }[] = [];

  const currentCompanyName = companyId
    ? companies.find((c) => c.companyId === companyId)?.companyName ?? 'Select company'
    : companies[0]?.companyName ?? 'Select company';

  const mainNavItems = filteredNavItems.filter((item) => item.section === 'main');
  const operationsNavItems = filteredNavItems.filter((item) => item.section === 'operations');
  const configNavItems = filteredNavItems.filter((item) => item.section === 'config');

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-page flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-page border-r border-line transition-all duration-250 z-50 ${sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-line">
          <img src="/logo.png" alt="Xero Automation" className="h-8 w-8" />
          {!sidebarCollapsed && (
            <span className="ml-3 font-semibold text-ink text-sm">Xero Automation</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 flex flex-col gap-1 overflow-y-auto custom-scrollbar" style={{ height: 'calc(100% - 128px)' }}>
          {/* Main Actions */}
          {!sidebarCollapsed && (
            <div className="text-xs font-semibold text-ink-light uppercase tracking-wide px-3 py-2">
              Main Actions
            </div>
          )}
          {mainNavItems.map(item => {
            const Icon = iconMap[item.icon] || Home;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${isActive(item.path)
                    ? 'bg-brand-light text-brand'
                    : 'text-ink-mid hover:bg-line-light hover:text-ink'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.id === 'history' ? 'bg-danger-light text-danger' : 'bg-brand-light text-brand'
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}

          {/* Operations */}
          {!sidebarCollapsed && (
            <div className="text-xs font-semibold text-ink-light uppercase tracking-wide px-3 py-2 mt-4">
              Operations
            </div>
          )}
          {operationsNavItems.map(item => {
            const Icon = iconMap[item.icon] || Home;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${isActive(item.path)
                    ? 'bg-brand-light text-brand'
                    : 'text-ink-mid hover:bg-line-light hover:text-ink'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-danger-light text-danger">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}

          {/* Configuration */}
          {!sidebarCollapsed && (
            <div className="text-xs font-semibold text-ink-light uppercase tracking-wide px-3 py-2 mt-4">
              Configuration
            </div>
          )}
          {configNavItems.map(item => {
            const Icon = iconMap[item.icon] || Home;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${isActive(item.path)
                    ? 'bg-brand-light text-brand'
                    : 'text-ink-mid hover:bg-line-light hover:text-ink'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-line bg-page">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-md text-ink-light hover:bg-line-light hover:text-ink-mid transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {!sidebarCollapsed && (
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-light hover:text-ink-mid transition-colors">
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-250 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
        {/* Top Navigation */}
        <header className="h-16 bg-surface border-b border-line flex items-center justify-between px-6 sticky top-0 z-40">
          {/* Left - Company Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowCompanySwitcher(!showCompanySwitcher)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-line-light transition-all bg-surface border border-transparent hover:border-line shadow-sm hover:shadow-md h-10"
            >
              <div className="w-6 h-6 rounded bg-brand-light flex items-center justify-center">
                 <Building2 className="w-3.5 h-3.5 text-brand" />
              </div>
              <span className="font-bold text-sm text-ink">{currentCompanyName}</span>
              <ChevronRight className={`w-4 h-4 text-ink-light transition-transform ${showCompanySwitcher ? 'rotate-90' : ''}`} />
            </button>

            {showCompanySwitcher && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-line py-3 animate-slide-up z-[60] overflow-hidden">
                <div className="px-4 pb-2 mb-2 border-b border-line-light flex items-center justify-between">
                  <span className="text-[10px] font-black text-ink-light uppercase tracking-[0.1em]">Organizations</span>
                  <span className="text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full">{companies.length} Organizations</span>
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-thin">
                  {companies.length === 0 ? (
                    <div className="px-4 py-4 text-center text-sm text-ink-light italic">No companies assigned</div>
                  ) : (
                    companies.map((company) => (
                      <button
                        key={company.companyId}
                        disabled={switchingCompany !== null}
                        onClick={async () => {
                          if (company.companyId === companyId) { setShowCompanySwitcher(false); return; }
                          setSwitchingCompany(company.companyId);
                          const ok = onSwitchCompany ? await onSwitchCompany(company.companyId) : false;
                          setSwitchingCompany(null);
                          if (ok) { setShowCompanySwitcher(false); window.location.reload(); }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-light transition-colors relative group ${company.companyId === companyId ? 'bg-page' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${company.companyId === companyId ? 'bg-brand text-white shadow-lg' : 'bg-line-light text-ink-light group-hover:bg-surface group-hover:text-brand'}`}>
                          {switchingCompany === company.companyId ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : company.companyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-sm font-bold truncate ${company.companyId === companyId ? 'text-ink' : 'text-ink-mid group-hover:text-ink'}`}>
                            {company.companyName}
                          </p>
                          <p className="text-[10px] text-ink-light font-medium">Xero Organization</p>
                        </div>
                        {company.companyId === companyId && (
                           <div className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgb(var(--brand))]" />
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div className="mt-2 px-3 pt-2 border-t border-line-light">
                  <button
                    onClick={() => { navigate('/companies'); setShowCompanySwitcher(false); }}
                    className="w-full h-9 flex items-center justify-center gap-2 text-xs font-bold text-brand hover:bg-brand-light rounded-lg transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Organization Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center - Search */}
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

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-ink-mid">Connected</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-md hover:bg-line-light transition-colors"
              >
                <Bell className="w-5 h-5 text-ink-mid" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-surface rounded-lg shadow-lg border border-line py-2 animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-line-light">
                    <span className="font-semibold text-sm text-ink">Notifications</span>
                    <button className="text-xs text-brand hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-ink-light">No notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="px-4 py-3 hover:bg-line-light transition-colors border-b border-line-light last:border-b-0">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${notif.type === 'success' ? 'bg-success' :
                                notif.type === 'error' ? 'bg-danger' : 'bg-brand'
                              }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-ink">{notif.title}</p>
                              <p className="text-xs text-ink-mid mt-0.5">{notif.message}</p>
                              <p className="text-xs text-ink-light mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-line mt-2 pt-2 px-4">
                    <button className="text-sm text-brand hover:underline">View All</button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-line-light transition-colors"
              >
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                  alt={user?.fullName || 'User avatar'}
                  className="w-8 h-8 rounded-full"
                />
                <ChevronLeft className={`w-4 h-4 text-ink-light transition-transform ${showUserMenu ? '-rotate-90' : 'rotate-90'}`} />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-surface rounded-lg shadow-lg border border-line py-2 animate-fade-in">
                  <div className="px-4 py-3 border-b border-line-light">
                    <p className="font-semibold text-sm text-ink">{user?.fullName}</p>
                    <p className="text-xs text-ink-light">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-mid hover:bg-line-light transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-mid hover:bg-line-light transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="border-t border-line mt-2 pt-2">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-light transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
