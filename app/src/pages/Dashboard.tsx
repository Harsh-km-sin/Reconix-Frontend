import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, CreditCard, PlusCircle, ClipboardList, Building2, Settings, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

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
  value: string;
  subtext: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  ];

  const quickStats: QuickStat[] = [
    { label: 'Invoices Synced', value: '—', subtext: 'Sync from Xero', icon: CheckCircle, trend: 'neutral' },
    { label: 'Pending Jobs', value: '—', subtext: 'No pending jobs', icon: AlertCircle, trend: 'neutral' },
    { label: 'Failed Jobs (7d)', value: '—', subtext: 'None', icon: AlertCircle, trend: 'neutral' },
    { label: 'Active Users', value: '—', subtext: 'From your organisation', icon: TrendingUp, trend: 'neutral' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Dashboard</h1>
        <p className="text-[#555555]">Welcome back{user?.fullName ? `, ${user.fullName}` : ''}. Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white border border-[#E0E0E0] rounded-lg p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-250"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#8A8A8A] mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
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
                  {module.badge.count} {module.badge.count === 1 ? 'pending' : 'pending'}
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
      <div className="mt-8 bg-white border border-[#E0E0E0] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Recent Activity</h3>
          <button
            onClick={() => navigate('/history')}
            className="text-sm text-[#13B5EA] hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-4">
          {[].length === 0 ? (
            <p className="text-sm text-[#8A8A8A] py-4">No recent activity</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
