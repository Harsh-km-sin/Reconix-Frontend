import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Info,
  User as UserIcon,
  Lock,
  Bell,
  Building2,
  Globe,
  Users,
  Save,
  Loader2,
  Calculator
} from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { api } from '@/lib/api';
import { useToast } from '@/store/useToast';
import type { SettingsTab } from '@/modules/settings/types';
import { PageHeader } from '@/ui_library/components/PageHeader';
import { Tabs } from '@/ui_library/components/Tabs';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const { user: authUser, companyId: authCompanyId, updateProfile: updateAuthProfile } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

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
      toastSuccess('Saved', 'Profile updated');
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
      <PageHeader
        title="Settings"
        description="Manage your account and company preferences"
        className="mb-8"
      />

      <div className="flex gap-8">
        <aside className="w-64 flex-shrink-0">
          <Tabs
            tabs={tabs}
            active={activeTab}
            onChange={setActiveTab}
            orientation="vertical"
            className="sticky top-24"
          />
        </aside>

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-surface border border-line rounded-xl p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-ink mb-8">User Profile</h2>
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-ink-mid mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full h-11 px-4 border border-line rounded-lg focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-mid mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile(p => ({ ...p, phoneNumber: e.target.value }))}
                    className="w-full h-11 px-4 border border-line rounded-lg focus:border-brand focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover transition-all"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'accounting' && (
            <div className="bg-surface border border-line rounded-xl p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-ink mb-2 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-brand" />
                Reversal Settings
              </h2>
              <p className="text-sm text-ink-mid mb-8">Control how partial reversal amounts are interpreted when creating Xero Credit Notes.</p>

              <div className="max-w-lg space-y-4">
                <label className="block text-sm font-semibold text-ink mb-3">Partial Reversal Amount Mode</label>

                <label
                  className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                    companySettings.partialReversalAmountMode === 'TAX_EXCLUSIVE'
                      ? 'border-brand bg-brand-light ring-2 ring-brand/20'
                      : 'border-line hover:border-[#BDBDBD]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reversalMode"
                    value="TAX_EXCLUSIVE"
                    checked={companySettings.partialReversalAmountMode === 'TAX_EXCLUSIVE'}
                    onChange={() => setCompanySettings(s => ({ ...s, partialReversalAmountMode: 'TAX_EXCLUSIVE' }))}
                    className="mt-0.5 w-4 h-4 text-brand focus:ring-brand"
                  />
                  <div>
                    <span className="font-semibold text-ink text-sm">Tax Exclusive</span>
                    <span className="ml-2 px-1.5 py-0.5 bg-success-light text-success text-[9px] font-bold rounded">DEFAULT</span>
                    <p className="text-xs text-ink-mid mt-1">Reversal amount = tax-exclusive line amount. Taxes are added on top by Xero.</p>
                    <p className="text-[10px] text-ink-light mt-1 font-mono">e.g. Enter $1,500 → CN Total = $1,500 + taxes</p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                    companySettings.partialReversalAmountMode === 'BILL_TOTAL'
                      ? 'border-brand bg-brand-light ring-2 ring-brand/20'
                      : 'border-line hover:border-[#BDBDBD]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reversalMode"
                    value="BILL_TOTAL"
                    checked={companySettings.partialReversalAmountMode === 'BILL_TOTAL'}
                    onChange={() => setCompanySettings(s => ({ ...s, partialReversalAmountMode: 'BILL_TOTAL' }))}
                    className="mt-0.5 w-4 h-4 text-brand focus:ring-brand"
                  />
                  <div>
                    <span className="font-semibold text-ink text-sm">Bill Total (Including Tax)</span>
                    <p className="text-xs text-ink-mid mt-1">Reversal amount = final amount removed from bill including taxes. System back-calculates the tax-exclusive portion.</p>
                    <p className="text-[10px] text-ink-light mt-1 font-mono">e.g. Enter $1,500 → CN Total = exactly $1,500</p>
                  </div>
                </label>

                <div className="bg-warning-light border border-[#FFE0B2] rounded-lg p-3 mt-4">
                  <p className="text-[11px] text-[#795548] flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-warning" />
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
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover transition-all disabled:opacity-50"
                >
                  {accountingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Accounting Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-surface border border-line rounded-xl p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand" />
                  Password
                </h2>
                <div className="space-y-4 max-w-md">
                   <input
                    type="password"
                    placeholder="Current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-line rounded-lg focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-line rounded-lg focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full h-11 px-4 border border-line rounded-lg focus:outline-none"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-surface border border-line rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-success" />
                    Two-Factor Authentication
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${mfaEnabled ? 'bg-success-light text-success' : 'bg-line-light text-ink-light'}`}>
                    {mfaEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                {!mfaEnabled && mfaSetupStep === 0 && (
                  <div className="max-w-md">
                    <p className="text-sm text-ink-mid mb-6">Protect your account with a secondary verification code.</p>
                    <button
                      onClick={handleStartMFASetup}
                      disabled={isMFALoading}
                      className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium"
                    >
                      Enable 2FA
                    </button>
                  </div>
                )}

                {mfaSetupStep === 1 && mfaSetupData && (
                  <div className="max-w-md space-y-6 animate-fade-in">
                    <div className="p-4 bg-line-light rounded-lg flex flex-col items-center">
                      <img src={mfaSetupData.qrCodeUrl} className="w-48 h-48 mb-4" />
                      <code className="text-xs bg-surface px-2 py-1 rounded">{mfaSetupData.secret}</code>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            maxLength={6}
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-32 h-11 text-center font-mono border border-line rounded-lg"
                        />
                        <button
                            onClick={handleVerifyMFASetup}
                            disabled={isMFALoading || mfaToken.length < 6}
                            className="flex-1 bg-brand text-white rounded-lg font-medium"
                        >
                            Verify & Enable
                        </button>
                    </div>
                  </div>
                )}

                {mfaEnabled && (
                   <button
                    onClick={handleDisableMFA}
                    className="px-4 py-2 text-danger border border-danger rounded-lg font-medium hover:bg-danger-light"
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
