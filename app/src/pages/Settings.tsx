import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Info, 
  QrCode,
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
  ArrowLeft,
  Calculator
} from 'lucide-react';
import type { User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { timezones, bankAccounts } from '@/constants/options';
import { api, ApiClientError } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'company' | 'accounting' | 'users' | 'batch';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { user: authUser, companies: authCompanies, companyId: authCompanyId, updateProfile: updateAuthProfile } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const currentCompanyName = authCompanyId
    ? authCompanies.find((c) => c.companyId === authCompanyId)?.companyName ?? authCompanies[0]?.companyName ?? '—'
    : authCompanies[0]?.companyName ?? '—';

  // Profile form state
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
    roleId: '',
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

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupStep, setMfaSetupStep] = useState(0); // 0: none, 1: setup
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [isMFALoading, setIsMFALoading] = useState(false);

  const [companySettings, setCompanySettings] = useState({
    baseCurrency: 'USD',
    defaultBankAccountId: '',
    defaultCnNumberFormat: 'CN-{ref}',
    defaultLineAmountType: 'exclusive',
    partialReversalAmountMode: 'TAX_EXCLUSIVE' as 'TAX_EXCLUSIVE' | 'BILL_TOTAL',
  });
  const [companySettingsLoading, setCompanySettingsLoading] = useState(false);
  const [accountingSaving, setAccountingSaving] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;
    api.get<any>('users/me')
      .then((data) => {
        setProfile({
          fullName: data.name ?? '',
          phoneNumber: data.phoneNumber ?? '',
          timezone: data.timezone ?? 'America/New_York',
          dateFormat: (data.dateFormat as any) || 'DD/MM/YYYY',
        });
        if (data.preferences) setPreferences(prev => ({ ...prev, ...data.preferences }));
        setMfaEnabled(data.mfaEnabled ?? false);
      })
      .catch(() => {});
  }, [authUser?.id]);

  // Fetch company-level settings (including partialReversalAmountMode)
  useEffect(() => {
    if (!authCompanyId) return;
    api.get<any>(`companies/${authCompanyId}`)
      .then((data) => {
        if (data?.partialReversalAmountMode) {
          setCompanySettings(prev => ({
            ...prev,
            partialReversalAmountMode: data.partialReversalAmountMode,
          }));
        }
      })
      .catch(() => {});
  }, [authCompanyId]);

  const showSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const data = await api.patch<any>('users/me', {
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
      toastSuccess('Success', 'Password updated successfully');
    } catch (err: any) {
      toastError('Error', err.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartMFASetup = async () => {
    setIsMFALoading(true);
    try {
      const data = await api.post<any>('auth/mfa/setup', {});
      setMfaSetupData(data);
      setMfaSetupStep(1);
    } catch {
      toastError('Error', 'Failed to start MFA setup');
    } finally {
      setIsMFALoading(false);
    }
  };

  const handleVerifyMFASetup = async () => {
    if (!mfaToken) return;
    setIsMFALoading(true);
    try {
      await api.post('auth/mfa/verify', { token: mfaToken });
      setMfaEnabled(true);
      setMfaSetupStep(0);
      setMfaToken('');
      toastSuccess('Success', 'Multi-factor authentication enabled');
    } catch (err: any) {
      toastError('Error', err.message || 'Invalid code');
    } finally {
      setIsMFALoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('Disable MFA? Your account will be less secure.')) return;
    setIsMFALoading(true);
    try {
      await api.post('auth/mfa/disable', {});
      setMfaEnabled(false);
      toastSuccess('Success', 'MFA disabled');
    } catch {
      toastError('Error', 'Failed to disable MFA');
    } finally {
      setIsMFALoading(false);
    }
  };

  const handleInvite = async () => {
    const emails = inviteData.emails.split(/[\s,]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
    if (emails.length === 0) return;
    setIsSaving(true);
    try {
      for (const email of emails) {
        await api.post('users/invite', { 
            email, 
            assignments: inviteData.companyIds.map(id => ({ companyId: id, roleId: inviteData.roleId }))
        });
      }
      toastSuccess('Success', 'Invitations sent');
      setShowInviteModal(false);
    } catch (err: any) {
      toastError('Error', err.message || 'Invite failed');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: UserIcon },
    { id: 'security' as SettingsTab, label: 'Security', icon: ShieldCheck },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'company' as SettingsTab, label: 'Company', icon: Building2 },
    { id: 'accounting' as SettingsTab, label: 'Accounting', icon: Calculator },
    { id: 'users' as SettingsTab, label: 'User Management', icon: Users },
    { id: 'batch' as SettingsTab, label: 'Batch Configs', icon: Globe },
  ];

  return (
    <div className="max-w-[1200px] mx-auto animate-fade-in p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Settings</h1>
        <p className="text-[#555555]">Manage your account and company preferences</p>
      </div>

      <div className="flex gap-8">
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden sticky top-24">
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

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-8">User Profile</h2>
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-lg focus:border-[#13B5EA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555555] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile(p => ({ ...p, phoneNumber: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-lg focus:border-[#13B5EA] focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#13B5EA] text-white rounded-lg font-medium hover:bg-[#0E92BC] transition-all"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'accounting' && (
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#13B5EA]" />
                Reversal Settings
              </h2>
              <p className="text-sm text-[#555555] mb-8">Control how partial reversal amounts are interpreted when creating Xero Credit Notes.</p>

              <div className="max-w-lg space-y-4">
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Partial Reversal Amount Mode</label>

                <label
                  className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                    companySettings.partialReversalAmountMode === 'TAX_EXCLUSIVE'
                      ? 'border-[#13B5EA] bg-[#E5F6FC] ring-2 ring-[#13B5EA]/20'
                      : 'border-[#E0E0E0] hover:border-[#BDBDBD]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reversalMode"
                    value="TAX_EXCLUSIVE"
                    checked={companySettings.partialReversalAmountMode === 'TAX_EXCLUSIVE'}
                    onChange={() => setCompanySettings(s => ({ ...s, partialReversalAmountMode: 'TAX_EXCLUSIVE' }))}
                    className="mt-0.5 w-4 h-4 text-[#13B5EA] focus:ring-[#13B5EA]"
                  />
                  <div>
                    <span className="font-semibold text-[#1A1A1A] text-sm">Tax Exclusive</span>
                    <span className="ml-2 px-1.5 py-0.5 bg-[#E8F5E9] text-[#3BB54A] text-[9px] font-bold rounded">DEFAULT</span>
                    <p className="text-xs text-[#555555] mt-1">Reversal amount = tax-exclusive line amount. Taxes are added on top by Xero.</p>
                    <p className="text-[10px] text-[#8A8A8A] mt-1 font-mono">e.g. Enter $1,500 → CN Total = $1,500 + taxes</p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                    companySettings.partialReversalAmountMode === 'BILL_TOTAL'
                      ? 'border-[#13B5EA] bg-[#E5F6FC] ring-2 ring-[#13B5EA]/20'
                      : 'border-[#E0E0E0] hover:border-[#BDBDBD]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reversalMode"
                    value="BILL_TOTAL"
                    checked={companySettings.partialReversalAmountMode === 'BILL_TOTAL'}
                    onChange={() => setCompanySettings(s => ({ ...s, partialReversalAmountMode: 'BILL_TOTAL' }))}
                    className="mt-0.5 w-4 h-4 text-[#13B5EA] focus:ring-[#13B5EA]"
                  />
                  <div>
                    <span className="font-semibold text-[#1A1A1A] text-sm">Bill Total (Including Tax)</span>
                    <p className="text-xs text-[#555555] mt-1">Reversal amount = final amount removed from bill including taxes. System back-calculates the tax-exclusive portion.</p>
                    <p className="text-[10px] text-[#8A8A8A] mt-1 font-mono">e.g. Enter $1,500 → CN Total = exactly $1,500</p>
                  </div>
                </label>

                <div className="bg-[#FFF4E5] border border-[#FFE0B2] rounded-lg p-3 mt-4">
                  <p className="text-[11px] text-[#795548] flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#FFA726]" />
                    Changing this setting only affects <strong>newly created</strong> reversals. Existing schedules and credit notes are not modified.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    if (!authCompanyId) return;
                    setAccountingSaving(true);
                    try {
                      // Find the actual company DB id
                      const companies = await api.get<any[]>('companies');
                      const company = companies.find((c: any) => c.companyId === authCompanyId);
                      if (!company) throw new Error('Company not found');
                      await api.patch(`companies/${company.companyId}`, {
                        partialReversalAmountMode: companySettings.partialReversalAmountMode,
                      });
                      toastSuccess('Saved', 'Reversal amount mode updated');
                    } catch (err: any) {
                      toastError('Error', err.message || 'Failed to save setting');
                    } finally {
                      setAccountingSaving(false);
                    }
                  }}
                  disabled={accountingSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#13B5EA] text-white rounded-lg font-medium hover:bg-[#0E92BC] transition-all disabled:opacity-50"
                >
                  {accountingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Accounting Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#13B5EA]" />
                  Password
                </h2>
                <div className="space-y-4 max-w-md">
                   <input
                    type="password"
                    placeholder="Current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-lg focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-lg focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-lg focus:outline-none"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-lg font-medium hover:bg-[#0E92BC]"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#3BB54A]" />
                    Two-Factor Authentication
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${mfaEnabled ? 'bg-[#E8F5E9] text-[#3BB54A]' : 'bg-[#F5F5F5] text-[#8A8A8A]'}`}>
                    {mfaEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                {!mfaEnabled && mfaSetupStep === 0 && (
                  <div className="max-w-md">
                    <p className="text-sm text-[#555555] mb-6">Protect your account with a secondary verification code.</p>
                    <button
                      onClick={handleStartMFASetup}
                      disabled={isMFALoading}
                      className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-lg font-medium"
                    >
                      Enable 2FA
                    </button>
                  </div>
                )}

                {mfaSetupStep === 1 && mfaSetupData && (
                  <div className="max-w-md space-y-6 animate-fade-in">
                    <div className="p-4 bg-[#F5F5F5] rounded-lg flex flex-col items-center">
                      <img src={mfaSetupData.qrCodeUrl} className="w-48 h-48 mb-4" />
                      <code className="text-xs bg-white px-2 py-1 rounded">{mfaSetupData.secret}</code>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            maxLength={6}
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-32 h-11 text-center font-mono border border-[#E0E0E0] rounded-lg"
                        />
                        <button
                            onClick={handleVerifyMFASetup}
                            disabled={isMFALoading || mfaToken.length < 6}
                            className="flex-1 bg-[#13B5EA] text-white rounded-lg font-medium"
                        >
                            Verify & Enable
                        </button>
                    </div>
                  </div>
                )}

                {mfaEnabled && (
                   <button
                    onClick={handleDisableMFA}
                    className="px-4 py-2 text-[#E53935] border border-[#E53935] rounded-lg font-medium hover:bg-[#FFEBEE]"
                  >
                    Disable 2FA
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
