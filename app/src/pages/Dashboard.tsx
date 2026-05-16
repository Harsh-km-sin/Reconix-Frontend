import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, CreditCard, PlusCircle, ClipboardList, Building2, Settings, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { jobService } from '@/services/jobService';
import { xeroService } from '@/services/xeroService';
import type { Job, JobStatus } from '@/types';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  badge?: { count: number; type: 'info' | 'warning' | 'error' };
  color: string;
}

interface QuickStat {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}

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

  const getStatusBadge = (status: JobStatus) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-[#FFF4E5] text-[#FFA726]',
      RUNNING: 'bg-[#E5F6FC] text-[#13B5EA]',
      COMPLETED: 'bg-[#E8F5E9] text-[#3BB54A]',
      FAILED: 'bg-[#FFEBEE] text-[#E53935]',
      PARTIAL: 'bg-[#FFF4E5] text-[#FFA726]',
    };
    return styles[status] || 'bg-[#F5F5F5] text-[#8A8A8A]';
  };

  const formatShortId = (id: string) => id.substring(id.length - 8).toUpperCase();

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const modules: ModuleCard[] = [
    {
      id: 'reversal',
      title: 'Invoice Reversal',
      description: 'Create credit notes and allocate against invoices',
      icon: RefreshCw,
      path: '/reversal',
      color: '#13B5EA',
    },
    {
      id: 'allocation',
      title: 'Overpayment Allocation',
      description: 'Match overpayments to outstanding bills',
      icon: CreditCard,
      path: '/allocation',
      color: '#3BB54A',
    },
    {
      id: 'create-op',
      title: 'Create Overpayment',
      description: 'Record new overpayments in Xero',
      icon: PlusCircle,
      path: '/create-overpayment',
      color: '#FFA726',
    },
    {
      id: 'history',
      title: 'Job History',
      description: 'View past executions and audit logs',
      icon: ClipboardList,
      path: '/history',
      color: '#8A8A8A',
      badge: stats.pendingJobs > 0 ? { count: stats.pendingJobs, type: 'warning' } : undefined,
    },
    {
      id: 'companies',
      title: 'Connected Companies',
      description: 'Manage Xero integrations and sync status',
      icon: Building2,
      path: '/companies',
      color: '#13B5EA',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'User preferences and company configuration',
      icon: Settings,
      path: '/settings',
      color: '#555555',
    },
    {
      id: 'audit',
      title: 'Audit Log',
      description: 'Review security events and system changes',
      icon: ClipboardList,
      path: '/audit',
      color: '#E53935',
    },
  ];

  const quickStats: QuickStat[] = [
    { label: 'Invoices Synced', value: isLoading ? '—' : stats.invoicesSynced.toString(), subtext: 'Sync from Xero', icon: CheckCircle, trend: 'neutral' },
    { label: 'Pending Jobs', value: isLoading ? '—' : stats.pendingJobs.toString(), subtext: stats.pendingJobs > 0 ? 'Awaiting approval' : 'No pending jobs', icon: AlertCircle, trend: stats.pendingJobs > 0 ? 'neutral' : 'neutral' },
    { label: 'Failed Jobs (7d)', value: isLoading ? '—' : stats.failedJobs7d.toString(), subtext: 'Last 7 days', icon: AlertCircle, trend: stats.failedJobs7d > 0 ? 'down' : 'neutral' },
    { label: 'Active Users', value: isLoading ? '—' : stats.activeUsers.toString(), subtext: 'From your organisation', icon: TrendingUp, trend: 'neutral' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Dashboard</h1>
          <p className="text-[#555555]">Welcome back{user?.fullName ? `, ${user.fullName}` : ''}. Here&apos;s what&apos;s happening today.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white border border-[#E0E0E0] rounded-lg p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-250 relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1 rounded-l-lg h-full ${stat.trend === 'up' ? 'bg-[#3BB54A]' :
              stat.trend === 'down' ? 'bg-[#E53935]' :
                'bg-transparent'
              }`} />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#8A8A8A] mb-1">{stat.label}</p>
                <div className="flex items-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 text-[#E0E0E0] animate-spin" />}
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
                </div>
                <p className="text-xs text-[#8A8A8A] mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.trend === 'up' ? 'bg-[#E8F5E9]' :
                stat.trend === 'down' ? 'bg-[#FFEBEE]' :
                  'bg-[#E5F6FC]'
                }`}>
                <stat.icon className={`w-5 h-5 ${stat.trend === 'up' ? 'text-[#3BB54A]' :
                  stat.trend === 'down' ? 'text-[#E53935]' :
                    'text-[#13B5EA]'
                  }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <button
            key={module.id}
            onClick={() => navigate(module.path)}
            className="group bg-white border border-[#E0E0E0] rounded-lg p-6 text-left transition-all duration-250 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:border-[#13B5EA] hover:-translate-y-0.5 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-250 group-hover:scale-110"
                style={{ backgroundColor: `${module.color}15` }}
              >
                <module.icon className="w-6 h-6" style={{ color: module.color }} />
              </div>
              {module.badge && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${module.badge.type === 'error' ? 'bg-[#FFEBEE] text-[#E53935]' :
                  module.badge.type === 'warning' ? 'bg-[#FFF4E5] text-[#FFA726]' :
                    'bg-[#E5F6FC] text-[#13B5EA]'
                  }`}>
                  {module.badge.count} pending
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2 group-hover:text-[#13B5EA] transition-colors">
              {module.title}
            </h3>
            <p className="text-sm text-[#555555] mb-4 line-clamp-2">
              {module.description}
            </p>

            <div className="flex items-center text-sm font-medium text-[#13B5EA] opacity-0 group-hover:opacity-100 transition-opacity duration-250">
              Go to module
              <svg className="w-4 h-4 ml-1 transition-transform duration-250 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Recent Activity</h3>
          <button
            onClick={() => navigate('/history')}
            className="text-sm font-medium text-[#13B5EA] hover:underline flex items-center"
          >
            View All
          </button>
        </div>

        <div className="relative min-h-[120px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <Loader2 className="w-6 h-6 text-[#13B5EA] animate-spin" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center text-[#8A8A8A]">
              No recent jobs found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                  <th className="py-3 px-6 text-left text-xs font-semibold text-[#555555] uppercase tracking-wide">Job ID</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-[#555555] uppercase tracking-wide">Type</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-[#555555] uppercase tracking-wide">Date</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-[#555555] uppercase tracking-wide">Status</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-[#555555] uppercase tracking-wide">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {recentActivity.map((job) => (
                  <tr key={job.id} className="hover:bg-[#FAFAFA] transition-colors group cursor-pointer" onClick={() => navigate('/history')}>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-[#13B5EA] group-hover:underline">
                        {formatShortId(job.id)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="text-sm text-[#1A1A1A]">{job.jobType.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="text-sm text-[#555555]">{formatDateTime(job.createdAt)}</span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap text-right">
                      <span className="text-sm text-[#555555]">{job.processedCount}/{job.totalItems}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
