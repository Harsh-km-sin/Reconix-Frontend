import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { timezones, bankAccounts } from '@/constants/options';
import { api, ApiClientError } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { 
  User as UserIcon, 
  Lock, 
  Bell, 
  Building2, 
  Globe, 
  Users, 
  Save, 
  Check, 
  Plus,
  MoreVertical,
  Mail,
  Loader2,
} from 'lucide-react';

type SettingsTab = 'profile' | 'password' | 'notifications' | 'company' | 'users' | 'batch';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { user: authUser, companies: authCompanies, companyId: authCompanyId } = useAuth();
  const currentCompanyName = authCompanyId
    ? authCompanies.find((c) => c.companyId === authCompanyId)?.companyName ?? authCompanies[0]?.companyName ?? '—'
    : authCompanies[0]?.companyName ?? '—';

  // Profile form state (synced from auth user in useEffect)
  const [profile, setProfile] = useState({
    fullName: '',
    phoneNumber: '',
    timezone: 'America/New_York',
    dateFormat: 'DD/MM/YYYY' as 'DD/MM/YYYY' | 'MM/DD/YYYY',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Invite form state
  const [inviteData, setInviteData] = useState({
    emails: '',
    role: 'operator' as User['role'],
    companyIds: [] as string[],
    message: '',
  });
  const [inviteCompanies, setInviteCompanies] = useState<{ companyId: string; companyName: string }[]>([]);
  const [inviteCompaniesLoading, setInviteCompaniesLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [usersList, setUsersList] = useState<Array<{ id: string; email: string; fullName?: string; role?: string; status?: string }>>([]);
  const [usersListLoading, setUsersListLoading] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    job_complete: true,
    job_failed: true,
    sync_error: true,
    user_invited: true,
    weekly_report: false,
  });
  const [companySettings, setCompanySettings] = useState<{
    baseCurrency: string;
    defaultBankAccountId: string;
    defaultCnNumberFormat: string;
    defaultLineAmountType: string;
  }>({
    baseCurrency: 'USD',
    defaultBankAccountId: '',
    defaultCnNumberFormat: 'CN-{ref}',
    defaultLineAmountType: 'exclusive',
  });
  const [companySettingsLoading, setCompanySettingsLoading] = useState(false);
  const batchConfigs: { name: string; type: string; description: string; lastUsed: string }[] = [];
  const { success: toastSuccess, error: toastError } = useToast();
  const { updateProfile: updateAuthProfile } = useAuth();

  useEffect(() => {
    if (!authUser?.id) return;
    api
      .get<{ name?: string | null; phoneNumber?: string | null; timezone?: string | null; dateFormat?: string | null; preferences?: Record<string, boolean> | null }>('users/me')
      .then((data) => {
        setProfile((p) => ({
          ...p,
          fullName: data.name ?? '',
          phoneNumber: data.phoneNumber ?? '',
          timezone: data.timezone ?? 'America/New_York',
          dateFormat: (data.dateFormat as 'DD/MM/YYYY' | 'MM/DD/YYYY') || 'DD/MM/YYYY',
        }));
        if (data.preferences && typeof data.preferences === 'object') {
          setPreferences((prev) => ({ ...prev, ...data.preferences }));
        }
      })
      .catch(() => {});
  }, [authUser?.id]);

  useEffect(() => {
    if (!showInviteModal) return;
    setInviteCompaniesLoading(true);
    setInviteError('');
    api
      .get<{ companyId: string; companyName: string; role?: string }[]>('companies')
      .then((list) => setInviteCompanies(list.map((c) => ({ companyId: c.companyId, companyName: c.companyName }))))
      .catch((err) => {
        setInviteError(err instanceof ApiClientError ? err.message : 'Failed to load companies');
        setInviteCompanies([]);
      })
      .finally(() => setInviteCompaniesLoading(false));
  }, [showInviteModal]);

  useEffect(() => {
    if (authUser) {
      setProfile((p) => ({ ...p, fullName: authUser.name ?? '' }));
    }
  }, [authUser?.id, authUser?.name]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    setUsersListLoading(true);
    api
      .get<Array<{ id: string; email: string; name?: string; role?: string }>>('users')
      .then((list) => setUsersList(list.map((u) => ({ id: u.id, email: u.email, fullName: u.name, role: u.role?.toLowerCase(), status: 'active' }))))
      .catch(() => setUsersList([]))
      .finally(() => setUsersListLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'company' || !authCompanyId) return;
    setCompanySettingsLoading(true);
    api
      .get<{ baseCurrency?: string | null; defaultBankAccountId?: string | null; defaultCnNumberFormat?: string | null; defaultLineAmountType?: string | null }>(`companies/${authCompanyId}`)
      .then((data) => {
        setCompanySettings((s) => ({
          ...s,
          baseCurrency: data.baseCurrency ?? 'USD',
          defaultBankAccountId: data.defaultBankAccountId ?? '',
          defaultCnNumberFormat: data.defaultCnNumberFormat ?? 'CN-{ref}',
          defaultLineAmountType: data.defaultLineAmountType ?? 'exclusive',
        }));
      })
      .catch(() => {})
      .finally(() => setCompanySettingsLoading(false));
  }, [activeTab, authCompanyId]);

  const showSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const data = await api.patch<{ name?: string | null }>('users/me', {
        name: profile.fullName || null,
        phoneNumber: profile.phoneNumber || null,
        timezone: profile.timezone || null,
        dateFormat: profile.dateFormat || null,
      });
      if (data.name !== undefined) updateAuthProfile({ fullName: data.name ?? undefined });
      showSaveSuccess();
    } catch {
      toastError('Error', 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword) return;
    setIsSaving(true);
    try {
      await api.post('auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showSaveSuccess();
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await api.patch('users/me', { preferences });
      showSaveSuccess();
    } catch {
      toastError('Error', 'Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!authCompanyId) return;
    setIsSaving(true);
    try {
      await api.patch(`companies/${authCompanyId}`, {
        baseCurrency: companySettings.baseCurrency || null,
        defaultBankAccountId: companySettings.defaultBankAccountId || null,
        defaultCnNumberFormat: companySettings.defaultCnNumberFormat || null,
        defaultLineAmountType: companySettings.defaultLineAmountType || null,
      });
      showSaveSuccess();
    } catch {
      toastError('Error', 'Failed to save company settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvite = async () => {
    setInviteError('');
    const emails = inviteData.emails
      .split(/[\s,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) {
      setInviteError('Enter at least one email address.');
      return;
    }
    setIsSaving(true);
    const role = inviteData.role.toUpperCase() as 'ADMIN' | 'APPROVER' | 'OPERATOR';
    const assignments = inviteData.companyIds.map((companyId) => ({ companyId, role }));
    let ok = 0;
    let lastErr = '';
    for (const email of emails) {
      try {
        await api.post('users/invite', { email, assignments });
        ok++;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : 'Invite failed';
      }
    }
    setIsSaving(false);
    if (ok === emails.length) {
      toastSuccess('Invitation sent', ok === 1 ? 'An invite email was sent.' : `${ok} invite emails were sent.`);
      setShowInviteModal(false);
      setInviteData((prev) => ({ ...prev, emails: '', companyIds: [] }));
    } else if (ok > 0) {
      setInviteError(`${ok} sent. ${lastErr}`);
    } else {
      setInviteError(lastErr);
    }
  };

  const getRoleBadge = (role: User['role']) => {
    const styles: Record<string, string> = {
      admin: 'bg-[#E5F6FC] text-[#13B5EA]',
      approver: 'bg-[#E8F5E9] text-[#3BB54A]',
      operator: 'bg-[#FFF4E5] text-[#FFA726]',
    };
    return styles[role] || 'bg-[#F5F5F5] text-[#8A8A8A]';
  };

  const getStatusBadge = (status: User['status']) => {
    const styles: Record<string, string> = {
      active: 'bg-[#E8F5E9] text-[#3BB54A]',
      invited: 'bg-[#FFF4E5] text-[#FFA726]',
      disabled: 'bg-[#F5F5F5] text-[#8A8A8A]',
    };
    return styles[status] || 'bg-[#F5F5F5] text-[#8A8A8A]';
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: UserIcon },
    { id: 'password' as SettingsTab, label: 'Password', icon: Lock },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'company' as SettingsTab, label: 'Company', icon: Building2 },
    { id: 'users' as SettingsTab, label: 'User Management', icon: Users },
    { id: 'batch' as SettingsTab, label: 'Batch Configs', icon: Globe },
  ];

  return (
    <div className="max-w-[1200px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Settings</h1>
        <p className="text-[#555555]">Manage your account and company preferences</p>
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-24 right-6 bg-white border-l-4 border-[#3BB54A] rounded-lg shadow-lg p-4 animate-slide-in-right z-50">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-[#3BB54A]" />
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Changes saved</p>
              <p className="text-xs text-[#555555]">Your settings have been updated</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#E5F6FC] text-[#13B5EA] border-l-4 border-l-[#13B5EA]'
                    : 'text-[#555555] hover:bg-[#F5F5F5] border-l-4 border-l-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#E0E0E0] rounded-lg p-8">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6">User Profile</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#E5F6FC] flex items-center justify-center text-2xl font-semibold text-[#13B5EA]">
                    {(profile.fullName || authUser?.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#13B5EA] text-white rounded-full flex items-center justify-center hover:bg-[#0E92BC] transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="text-sm text-[#555555]">Upload a new avatar</p>
                  <p className="text-xs text-[#8A8A8A]">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={authUser?.email ?? ''}
                    disabled
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm bg-[#F5F5F5] text-[#8A8A8A]"
                  />
                  <p className="text-xs text-[#8A8A8A] mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1 555-0123"
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Timezone</label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none appearance-none bg-white"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Date Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={profile.dateFormat === 'DD/MM/YYYY'}
                        onChange={() => setProfile(prev => ({ ...prev, dateFormat: 'DD/MM/YYYY' }))}
                        className="w-4 h-4 border border-[#E0E0E0] text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <span className="text-sm text-[#555555]">DD/MM/YYYY</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={profile.dateFormat === 'MM/DD/YYYY'}
                        onChange={() => setProfile(prev => ({ ...prev, dateFormat: 'MM/DD/YYYY' }))}
                        className="w-4 h-4 border border-[#E0E0E0] text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <span className="text-sm text-[#555555]">MM/DD/YYYY</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="bg-white border border-[#E0E0E0] rounded-lg p-8">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6">Change Password</h2>
              
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Lock className="w-4 h-4" />
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-[#E0E0E0] rounded-lg p-8">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { id: 'job_complete', label: 'Job completed', description: 'Get notified when a job finishes successfully' },
                  { id: 'job_failed', label: 'Job failed', description: 'Get notified when a job fails' },
                  { id: 'sync_error', label: 'Sync errors', description: 'Get notified when company sync fails' },
                  { id: 'user_invited', label: 'User invitations', description: 'Get notified when users are invited' },
                  { id: 'weekly_report', label: 'Weekly summary', description: 'Receive a weekly activity summary' },
                ].map((item) => (
                  <label key={item.id} className="flex items-start gap-3 p-4 bg-[#FAFAFA] rounded-lg cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences[item.id] ?? false}
                      onChange={(e) => setPreferences((p) => ({ ...p, [item.id]: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{item.label}</p>
                      <p className="text-xs text-[#8A8A8A]">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleSaveNotifications}
                disabled={isSaving}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <div className="bg-white border border-[#E0E0E0] rounded-lg p-8">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6">Company Settings</h2>
              
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={currentCompanyName}
                    disabled
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm bg-[#F5F5F5] text-[#8A8A8A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Xero Tenant ID</label>
                  <input
                    type="text"
                    value="—"
                    disabled
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm bg-[#F5F5F5] text-[#8A8A8A] font-mono"
                  />
                  <p className="text-xs text-[#8A8A8A] mt-1">Connect Xero to see tenant details</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Default Currency</label>
                  <select
                    value={companySettings.baseCurrency}
                    onChange={(e) => setCompanySettings((s) => ({ ...s, baseCurrency: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none appearance-none bg-white"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Default Bank Account</label>
                  <select
                    value={companySettings.defaultBankAccountId}
                    onChange={(e) => setCompanySettings((s) => ({ ...s, defaultBankAccountId: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none appearance-none bg-white"
                  >
                    <option value="">Select bank account...</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} — {account.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Credit Note Number Format</label>
                  <input
                    type="text"
                    value={companySettings.defaultCnNumberFormat}
                    onChange={(e) => setCompanySettings((s) => ({ ...s, defaultCnNumberFormat: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                  />
                  <p className="text-xs text-[#8A8A8A] mt-1">
                    Tokens: {'{ref}'}, {'{date}'}, {'{seq}'}. Example: CN-INV-001
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-1.5">Default Line Amount Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="lineAmount"
                        checked={companySettings.defaultLineAmountType === 'exclusive'}
                        onChange={() => setCompanySettings((s) => ({ ...s, defaultLineAmountType: 'exclusive' }))}
                        className="w-4 h-4 border border-[#E0E0E0] text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <span className="text-sm text-[#555555]">Exclusive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="lineAmount"
                        checked={companySettings.defaultLineAmountType === 'inclusive'}
                        onChange={() => setCompanySettings((s) => ({ ...s, defaultLineAmountType: 'inclusive' }))}
                        className="w-4 h-4 border border-[#E0E0E0] text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <span className="text-sm text-[#555555]">Inclusive</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSaveCompany}
                  disabled={isSaving || companySettingsLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="bg-white border border-[#E0E0E0] rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">User Management</h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Invite User
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none"
                />
              </div>

              {/* Users Table */}
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase text-[#555555]">User</th>
                    <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase text-[#555555]">Role</th>
                    <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase text-[#555555]">Status</th>
                    <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase text-[#555555]">Last Active</th>
                    <th className="py-3 px-4 border-b-2 border-[#E0E0E0] text-left text-xs font-semibold uppercase text-[#555555]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersListLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-[#8A8A8A]">Loading users...</td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-[#8A8A8A]">No users yet. Invite users to get started.</td>
                    </tr>
                  ) : (
                    usersList.map((user) => (
                      <tr key={user.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E5F6FC] flex items-center justify-center text-sm font-semibold text-[#13B5EA]">
                              {(user.fullName || user.email || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#1A1A1A]">{user.fullName || user.email}</p>
                              <p className="text-xs text-[#8A8A8A]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadge((user.role as User['role']) ?? 'operator')}`}>
                            {user.role ?? '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge((user.status as User['status']) ?? 'active')}`}>
                            {user.status ?? 'active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-[#555555]">—</td>
                        <td className="py-3.5 px-4">
                          <button className="p-1.5 text-[#8A8A8A] hover:text-[#555555] transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Batch Configs Tab */}
          {activeTab === 'batch' && (
            <div className="bg-white border border-[#E0E0E0] rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">Batch Configurations</h2>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors">
                  <Plus className="w-4 h-4" />
                  New Configuration
                </button>
              </div>

              <div className="space-y-4">
                {batchConfigs.length === 0 ? (
                  <div className="py-12 text-center text-[#8A8A8A]">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium text-[#555555]">No batch configurations yet</p>
                    <p className="text-sm mt-1">Create one to save filter and execution settings for reuse.</p>
                  </div>
                ) : (
                  batchConfigs.map((config, i) => (
                    <div key={i} className="border border-[#E0E0E0] rounded-lg p-5 hover:border-[#13B5EA] transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-[#1A1A1A]">{config.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.type === 'invoice_reversal' ? 'bg-[#E5F6FC] text-[#13B5EA]' : 'bg-[#E8F5E9] text-[#3BB54A]'}`}>
                              {config.type === 'invoice_reversal' ? 'Reversal' : 'Allocation'}
                            </span>
                          </div>
                          <p className="text-sm text-[#555555] mb-2">{config.description}</p>
                          <p className="text-xs text-[#8A8A8A]">Last used: {config.lastUsed}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 border border-[#13B5EA] text-[#13B5EA] rounded-md text-sm font-medium hover:bg-[#E5F6FC] transition-colors">Load</button>
                          <button className="p-2 text-[#8A8A8A] hover:text-[#555555] transition-colors"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[500px] animate-scale-in">
            <div className="p-6 border-b border-[#E0E0E0]">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Invite User</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#555555] mb-1.5">Email Addresses</label>
                <textarea
                  value={inviteData.emails}
                  onChange={(e) => setInviteData(prev => ({ ...prev, emails: e.target.value }))}
                  placeholder="Enter email addresses, separated by commas..."
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#555555] mb-1.5">Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                  className="w-full h-11 px-4 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none appearance-none bg-white"
                >
                  <option value="admin">Admin - Full access</option>
                  <option value="approver">Approver - Can approve jobs</option>
                  <option value="operator">Operator - Can execute jobs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#555555] mb-1.5">Company Access</label>
                {inviteCompaniesLoading ? (
                  <p className="text-sm text-[#8A8A8A]">Loading companies...</p>
                ) : inviteError && inviteCompanies.length === 0 ? (
                  <p className="text-sm text-[#E53935]">{inviteError}</p>
                ) : (
                  <div className="space-y-2">
                    {inviteCompanies.map((company) => (
                      <label key={company.companyId} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inviteData.companyIds.includes(company.companyId)}
                          onChange={(e) => {
                            setInviteData((prev) => ({
                              ...prev,
                              companyIds: e.target.checked
                                ? [...prev.companyIds, company.companyId]
                                : prev.companyIds.filter((id) => id !== company.companyId),
                            }));
                          }}
                          className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                        />
                        <span className="text-sm text-[#555555]">{company.companyName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {inviteError && inviteCompanies.length > 0 && (
                <p className="text-sm text-[#E53935]">{inviteError}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-[#555555] mb-1.5">Personal Message (optional)</label>
                <textarea
                  value={inviteData.message}
                  onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#E0E0E0] flex justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-6 py-2.5 text-[#555555] hover:text-[#1A1A1A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={isSaving || !inviteData.emails}
                className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Mail className="w-4 h-4" />
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
