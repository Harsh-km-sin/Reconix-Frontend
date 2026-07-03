import type { NavItem } from '@/types';
import { JOB_TYPE, type JobType } from '@/types';

/** Query-string key used to preselect a job type on the builder page. */
export const JOB_TYPE_PARAM = 'type';

/** Path to the job builder, optionally preselecting a job type. */
export const jobBuilderPath = (jobType?: JobType): string =>
  jobType ? `/jobs/new?${JOB_TYPE_PARAM}=${jobType}` : '/jobs/new';

/** Narrow an arbitrary string (e.g. from the URL) to a valid JobType, or null. */
export const parseJobType = (value: string | null): JobType | null =>
  (Object.values(JOB_TYPE) as string[]).includes(value ?? '') ? (value as JobType) : null;

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', path: '/', section: 'main', module: 'auth' },
  { id: 'new-job', label: 'Create Job', icon: 'PlusCircle', path: '/jobs/new', section: 'main', module: 'auth' },
  { id: 'history', label: 'Job History', icon: 'ClipboardList', path: '/history', section: 'operations', module: 'jobs' },
  { id: 'companies', label: 'Connected Companies', icon: 'Building2', path: '/companies', section: 'config', module: 'companies' },
  { id: 'audit', label: 'Audit Log', icon: 'Activity', path: '/audit', section: 'config', module: 'admin' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings', section: 'config', module: 'auth' },
];
