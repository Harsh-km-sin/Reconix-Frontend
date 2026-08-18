import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { RefreshCw, CreditCard, PlusCircle, ClipboardList, Building2, Settings, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { jobService } from '@/modules/jobs/services/jobService';
import { xeroService } from '@/modules/xero/services/xeroService';
import type { Job } from '@/types';
import { JOB_TYPE } from '@/types';
import { jobBuilderPath } from '@/modules/jobs/navigation';
import type { ModuleCard, QuickStat } from '@/modules/dashboard/types';
import { formatDateTime, shortId } from '@/lib/format';
import { jobStatus, toneBadgeClasses } from '@/lib/status';
import { PageHeader } from '@/ui_library/components/PageHeader';
import { DataTable, type Column } from '@/ui_library/components/DataTable';
import { StatCard } from '@/ui_library/components/StatCard';
import { ActionCard } from '@/ui_library/components/ActionCard';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    invoicesSynced: 0,
    pendingJobs: 0,
    failedJobs7d: 0,
    activeUsers: 1, // Fallback until a user count endpoint is needed
  });
  const [recentActivity, setRecentActivity] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Dashboard data on mount
  useEffect(() => {
    let mounted = true;

    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Run fetch requests concurrently
        const [
          invoicesRes,
          pendingJobsRes,
          failedJobsRes,
          activityRes
        ] = await Promise.all([
          xeroService.getInvoices({ limit: 1 }),
          jobService.listJobs({ limit: 1, status: 'PENDING' }),
          jobService.listJobs({ limit: 1, status: 'FAILED', dateFrom: sevenDaysAgo.toISOString() }),
          jobService.listJobs({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
        ]);

        if (mounted) {
          setStats({
            invoicesSynced: invoicesRes.total || 0,
            pendingJobs: pendingJobsRes.total || 0,
            failedJobs7d: failedJobsRes.total || 0,
            activeUsers: 1, // Placeholder
          });
          setRecentActivity(activityRes.items || []);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const modules: ModuleCard[] = [
    {
      id: 'reversal',
      title: 'Invoice Reversal',
      description: 'Create credit notes and allocate against invoices',
      icon: RefreshCw,
      path: jobBuilderPath(JOB_TYPE.INVOICE_REVERSAL),
      color: 'brand',
    },
    {
      id: 'allocation',
      title: 'Overpayment Allocation',
      description: 'Match overpayments to outstanding bills',
      icon: CreditCard,
      path: jobBuilderPath(JOB_TYPE.OVERPAYMENT_ALLOCATION),
      color: 'success',
    },
    {
      id: 'create-op',
      title: 'Create Overpayment',
      description: 'Record new overpayments in Xero',
      icon: PlusCircle,
      path: '/create-overpayment',
      color: 'warning',
    },
    {
      id: 'history',
      title: 'Job History',
      description: 'View past executions and audit logs',
      icon: ClipboardList,
      path: '/history',
      color: 'ink-light',
      badge: stats.pendingJobs > 0 ? { count: stats.pendingJobs, type: 'warning' } : undefined,
    },
    {
      id: 'companies',
      title: 'Connected Companies',
      description: 'Manage Xero integrations and sync status',
      icon: Building2,
      path: '/companies',
      color: 'brand',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'User preferences and company configuration',
      icon: Settings,
      path: '/settings',
      color: 'ink-mid',
    },
    {
      id: 'audit',
      title: 'Audit Log',
      description: 'Review security events and system changes',
      icon: ClipboardList,
      path: '/audit',
      color: 'danger',
    },
  ];

  const quickStats: QuickStat[] = [
    { label: 'Invoices Synced', value: isLoading ? '—' : stats.invoicesSynced.toString(), subtext: 'Sync from Xero', icon: CheckCircle, trend: 'neutral' },
    { label: 'Pending Jobs', value: isLoading ? '—' : stats.pendingJobs.toString(), subtext: stats.pendingJobs > 0 ? 'Awaiting approval' : 'No pending jobs', icon: AlertCircle, trend: stats.pendingJobs > 0 ? 'neutral' : 'neutral' },
    { label: 'Failed Jobs (7d)', value: isLoading ? '—' : stats.failedJobs7d.toString(), subtext: 'Last 7 days', icon: AlertCircle, trend: stats.failedJobs7d > 0 ? 'down' : 'neutral' },
    { label: 'Active Users', value: isLoading ? '—' : stats.activeUsers.toString(), subtext: 'From your organisation', icon: TrendingUp, trend: 'neutral' },
  ];

  const activityColumns = useMemo<Column<Job>[]>(
    () => [
      {
        key: 'id',
        header: 'Job ID',
        className: 'whitespace-nowrap',
        render: (job) => (
          <span className="font-mono text-sm font-medium text-brand">{shortId(job.id)}</span>
        ),
      },
      {
        key: 'jobType',
        header: 'Type',
        className: 'whitespace-nowrap',
        render: (job) => <span className="text-ink">{job.jobType.replace(/_/g, ' ')}</span>,
      },
      {
        key: 'createdAt',
        header: 'Date',
        className: 'whitespace-nowrap',
        render: (job) => formatDateTime(job.createdAt),
      },
      {
        key: 'status',
        header: 'Status',
        className: 'whitespace-nowrap',
        render: (job) => (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${toneBadgeClasses[jobStatus(job.status).tone]}`}
          >
            {job.status}
          </span>
        ),
      },
      {
        key: 'items',
        header: 'Items',
        align: 'right',
        className: 'whitespace-nowrap',
        render: (job) => `${job.processedCount}/${job.totalItems}`,
      },
    ],
    []
  );

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description={`Welcome back${user?.fullName ? `, ${user.fullName}` : ''}. Here's what's happening today.`}
        className="mb-8"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            subtext={stat.subtext}
            icon={stat.icon}
            trend={stat.trend}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <ActionCard
            key={module.id}
            title={module.title}
            description={module.description}
            icon={module.icon}
            tone={module.color}
            badge={module.badge}
            index={index}
            onClick={() => navigate(module.path)}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-surface border border-line rounded-lg overflow-hidden">
        <div className="p-6 border-b border-line flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">Recent Activity</h3>
          <button
            onClick={() => navigate('/history')}
            className="text-sm font-medium text-brand hover:underline flex items-center"
          >
            View All
          </button>
        </div>

        <DataTable
          columns={activityColumns}
          rows={recentActivity}
          rowKey={(job) => job.id}
          isLoading={isLoading}
          emptyIcon={ClipboardList}
          emptyTitle="No recent jobs"
          emptyMessage="Jobs you run will show up here."
          onRowClick={() => navigate('/history')}
          className="border-0 rounded-none min-h-[120px]"
        />
      </div>
    </div>
  );
}
