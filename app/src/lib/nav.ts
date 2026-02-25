import type { NavItem } from '@/types';

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', path: '/', section: 'main', module: 'auth' },
  { id: 'reversal', label: 'Invoice Reversal', icon: 'RefreshCw', path: '/reversal', section: 'main', module: 'invoices' },
  { id: 'allocation', label: 'Overpayment Allocation', icon: 'CreditCard', path: '/allocation', section: 'main', module: 'overpayments' },
  { id: 'create-op', label: 'Create Overpayment', icon: 'PlusCircle', path: '/create-overpayment', section: 'operations', module: 'overpayments' },
  { id: 'history', label: 'Job History', icon: 'ClipboardList', path: '/history', section: 'operations', module: 'jobs' },
  { id: 'companies', label: 'Connected Companies', icon: 'Building2', path: '/companies', section: 'config', module: 'companies' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings', section: 'config', module: 'auth' },
];
