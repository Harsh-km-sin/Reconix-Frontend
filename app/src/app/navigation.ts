import type { NavItem } from '@/types';

/** Sidebar navigation, in render order. `module` gates visibility by permission. */
export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', path: '/', section: 'main', module: 'auth' },
  { id: 'new-job', label: 'Create Job', icon: 'PlusCircle', path: '/jobs/new', section: 'main', module: 'auth' },
  { id: 'history', label: 'Job History', icon: 'ClipboardList', path: '/history', section: 'operations', module: 'jobs' },
  { id: 'companies', label: 'Connected Companies', icon: 'Building2', path: '/companies', section: 'config', module: 'companies' },
  { id: 'audit', label: 'Audit Log', icon: 'Activity', path: '/audit', section: 'config', module: 'admin' },
  { id: 'roles', label: 'Roles & Permissions', icon: 'Shield', path: '/roles', section: 'config', module: 'roles:manage' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings', section: 'config', module: 'auth' },
];
