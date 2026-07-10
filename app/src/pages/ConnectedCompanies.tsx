import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '@/lib/api';
import { setActiveTenant as setActiveTenantAction } from '@/store/authSlice';
import { setActiveTenant as setActiveTenantApi } from '@/lib/api';
import type { RootState } from '@/store';
import { toast } from 'react-hot-toast';
import {
  Plus,
  RefreshCw,
  MoreVertical,
  Check,
  Loader2,
  Building2,
  FileText,
  Users,
  CreditCard,
  ExternalLink,
  Unlink,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { AlertModal } from '@/components/ui/alert-modal';


type CompanyItem = {
  companyId: string;
  tenantId: string;
  tenantName: string;
  tenantType: string;
  connectedAt: string;
  lastSyncedAt: string | null;
  isActive: boolean;
  invoiceCount: number;
  contactCount: number;
  overpaymentCount: number;
  lastSync?: {
    syncType: string;
    status: string;
    recordsFetched: number | null;
    startedAt: string;
    completedAt: string | null;
    errorMessage: string | null;
  } | null;
};

export function ConnectedCompanies() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);
  const [syncOptions, setSyncOptions] = useState({
    contacts: true,
    accounts: true,
    invoices: true,
    overpayments: true,
    fullHistorical: false,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const activeTenantId = useSelector((state: RootState) => state.auth.activeTenantId);
  const { switchCompany, companyId: activeCompanyId } = useAuth();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [disconnectTenantId, setDisconnectTenantId] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);


  useEffect(() => {
    // 1. Fetch connections
    api
      .get<CompanyItem[]>('xero/connections')
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));

    // 2. Handle success redirect from Xero
    if (searchParams.get('connected') === 'true') {
      const tenant = searchParams.get('tenant');
      toast.success(`Connected to ${tenant} successfully`);

      // Clear params without page reload
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('connected');
      newParams.delete('tenant');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleConnect = async () => {
    try {
      const { authUrl } = await api.get<{ authUrl: string }>('xero/connect');
      window.location.href = authUrl;
    } catch (err) {
      toast.error('Failed to start Xero connection');
    }
  };

  const handleDisconnect = (tenantId: string) => {
    setDisconnectTenantId(tenantId);
  };

  const confirmDisconnect = async () => {
    if (!disconnectTenantId) return;
    setIsDisconnecting(true);
    try {
      await api.delete(`xero/connections/${disconnectTenantId}`);
      setCompanies(prev => prev.filter(c => c.tenantId !== disconnectTenantId));
      if (activeTenantId === disconnectTenantId) {
        dispatch(setActiveTenantAction(null));
        setActiveTenantApi(null);
      }
      toast.success('Organization disconnected');
      setDisconnectTenantId(null);
    } catch (err) {
      toast.error('Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };


  const selectActiveTenant = async (companyId: string) => {
    if (!companyId) return;
    setSwitchingId(companyId);
    const ok = await switchCompany(companyId);
    setSwitchingId(null);
    if (ok) {
      toast.success('Active organization switched');
      window.location.reload();
    } else {
      toast.error('Failed to switch active organization');
    }
  };

  const handleSync = async () => {
    if (!selectedCompany) return;

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncComplete(false);

    try {
      // Default is incremental (only records changed since the last sync);
      // "Full re-sync" ignores the watermark and pulls everything.
      const response = await api.post<{ jobId: string }>(`xero/sync/${selectedCompany.tenantId}`, {
        full: syncOptions.fullHistorical,
      });
      const { jobId } = response;

      // Start polling
      const pollInterval = setInterval(async () => {
        try {
          const status = await api.get<{ progress: number; status: string }>(`xero/sync/status/${jobId}`);
          setSyncProgress(status.progress);

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setIsSyncing(false);
            setSyncComplete(true);
            // Refresh companies list to get new lastSyncedAt
            api.get<CompanyItem[]>('xero/connections').then(setCompanies);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsSyncing(false);
            toast.error('Sync failed. Please try again.');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setIsSyncing(false);
          toast.error('Failed to poll sync status');
        }
      }, 2000);
    } catch (err) {
      setIsSyncing(false);
      toast.error('Failed to start sync');

    }
  };

  // const formatNumber = (num: number) => {
  //   return new Intl.NumberFormat('en-US').format(num);
  // };

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Connected Companies</h1>
          <p className="text-[#555555]">Manage your Xero integrations and sync status</p>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Connect New Company
        </button>
      </div>

      {/* Company Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#8A8A8A]">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          Loading companies...
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white border border-[#E0E0E0] rounded-lg p-12 text-center text-[#8A8A8A]">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium text-[#555555]">No companies yet</p>
          <p className="text-sm mt-1">Connect your Xero organization to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => {
            const isActive = activeCompanyId === company.companyId || activeTenantId === company.tenantId;
            return (
              <div
                key={company.tenantId}
                className={`bg-white border ${isActive ? 'border-[#13B5EA] ring-1 ring-[#13B5EA]' : 'border-[#E0E0E0]'} rounded-lg p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-250`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#13B5EA] rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A1A1A]">{company.tenantName}</h3>
                      <p className="text-xs text-[#8A8A8A] font-mono">{company.tenantId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#3BB54A] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <button
                      onClick={() => selectActiveTenant(company.companyId)}
                      disabled={switchingId !== null}
                      className="text-xs text-[#13B5EA] hover:underline disabled:opacity-50"
                    >
                      {switchingId === company.companyId ? 'Switching...' : 'Select as Active'}
                    </button>
                  )}
                </div>

                {/* Sync Info */}
                <div className="flex items-center gap-2 text-sm text-[#555555] mb-1">
                  <RefreshCw className="w-4 h-4" />
                  Last sync: {company.lastSyncedAt ? new Date(company.lastSyncedAt).toLocaleString() : 'Never'}
                </div>
                {company.lastSync && (
                  <div className="flex items-center gap-1.5 text-xs mb-4 pl-6">
                    <span className={
                      company.lastSync.status === 'COMPLETED' ? 'text-[#3BB54A]'
                        : company.lastSync.status === 'FAILED' ? 'text-[#E53935]'
                        : 'text-[#FFA726]'
                    }>
                      {company.lastSync.status === 'COMPLETED' ? '✓' : company.lastSync.status === 'FAILED' ? '✕' : '⋯'}
                    </span>
                    <span className="text-[#8A8A8A]">
                      {company.lastSync.syncType === 'FULL' ? 'Full' : 'Incremental'}
                      {company.lastSync.status === 'COMPLETED' && ` · ${company.lastSync.recordsFetched ?? 0} record${company.lastSync.recordsFetched === 1 ? '' : 's'}`}
                      {company.lastSync.status === 'FAILED' && ` · failed${company.lastSync.errorMessage ? `: ${company.lastSync.errorMessage}` : ''}`}
                      {company.lastSync.status === 'RUNNING' && ' · running…'}
                    </span>
                  </div>
                )}

                {/* Sync Counts */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <FileText className="w-4 h-4 text-[#13B5EA] mx-auto mb-1" />
                    <p className="text-lg font-bold text-[#1A1A1A]">{company.invoiceCount || 0}</p>
                    <p className="text-xs text-[#8A8A8A]">Invoices</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <Users className="w-4 h-4 text-[#3BB54A] mx-auto mb-1" />
                    <p className="text-lg font-bold text-[#1A1A1A]">{company.contactCount || 0}</p>
                    <p className="text-xs text-[#8A8A8A]">Contacts</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <CreditCard className="w-4 h-4 text-[#FFA726] mx-auto mb-1" />
                    <p className="text-lg font-bold text-[#1A1A1A]">{company.overpaymentCount || 0}</p>
                    <p className="text-xs text-[#8A8A8A]">OPs</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCompany(company);
                      setShowSyncModal(true);
                      setSyncComplete(false);
                      setSyncProgress(0);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-[#13B5EA] text-[#13B5EA] rounded-md text-sm font-medium hover:bg-[#E5F6FC] transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync Now
                  </button>
                  <div className="relative group">
                    <button className="p-2 text-[#8A8A8A] hover:text-[#555555] transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E0E0E0] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#555555] hover:bg-[#F5F5F5] transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        View Sync Log
                      </button>
                      <button
                        onClick={handleConnect}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#555555] hover:bg-[#F5F5F5] transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Re-authenticate
                      </button>
                      <button
                        onClick={() => handleDisconnect(company.tenantId)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#E53935] hover:bg-[#FFEBEE] transition-colors"
                      >
                        <Unlink className="w-4 h-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[500px] animate-scale-in">
            {!isSyncing && !syncComplete && (
              <>
                <div className="p-6 border-b border-[#E0E0E0]">
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">Sync {selectedCompany.tenantName}</h2>
                </div>

                <div className="p-6">
                  <p className="text-sm text-[#555555] mb-4">Select data to sync:</p>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-lg cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                      <input
                        type="checkbox"
                        checked={syncOptions.contacts}
                        onChange={(e) => setSyncOptions(prev => ({ ...prev, contacts: e.target.checked }))}
                        className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">Contacts</p>
                        <p className="text-xs text-[#8A8A8A]">Sync all vendor and customer contacts</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-lg cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                      <input
                        type="checkbox"
                        checked={syncOptions.accounts}
                        onChange={(e) => setSyncOptions(prev => ({ ...prev, accounts: e.target.checked }))}
                        className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">Chart of Accounts</p>
                        <p className="text-xs text-[#8A8A8A]">Sync account codes and categories</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-lg cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                      <input
                        type="checkbox"
                        checked={syncOptions.invoices}
                        onChange={(e) => setSyncOptions(prev => ({ ...prev, invoices: e.target.checked }))}
                        className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">Invoices (ACCPAY)</p>
                        <p className="text-xs text-[#8A8A8A]">Sync purchase invoices</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-lg cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                      <input
                        type="checkbox"
                        checked={syncOptions.overpayments}
                        onChange={(e) => setSyncOptions(prev => ({ ...prev, overpayments: e.target.checked }))}
                        className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">Overpayments</p>
                        <p className="text-xs text-[#8A8A8A]">Sync available overpayments</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[#FFF4E5] rounded-lg cursor-pointer hover:bg-[#FFE8CC] transition-colors">
                      <input
                        type="checkbox"
                        checked={syncOptions.fullHistorical}
                        onChange={(e) => setSyncOptions(prev => ({ ...prev, fullHistorical: e.target.checked }))}
                        className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">Full re-sync</p>
                        <p className="text-xs text-[#8A8A8A]">Ignore the last-synced watermark and re-pull everything (slow). Leave off for a fast incremental sync of only what changed.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-6 border-t border-[#E0E0E0] flex justify-end gap-3">
                  <button
                    onClick={() => setShowSyncModal(false)}
                    className="px-6 py-2.5 text-[#555555] hover:text-[#1A1A1A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSync}
                    className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors"
                  >
                    Start Sync
                  </button>
                </div>
              </>
            )}

            {isSyncing && (
              <div className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-[#13B5EA] animate-spin mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Syncing...</h2>
                <p className="text-[#555555] mb-6">Please wait while we sync data from Xero</p>
                <div className="max-w-xs mx-auto">
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#13B5EA] rounded-full transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-[#8A8A8A] mt-2">{syncProgress}% complete</p>
                </div>
              </div>
            )}

            {syncComplete && (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-[#3BB54A]" />
                </div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Sync Complete!</h2>
                <p className="text-[#555555] mb-6">
                  Successfully synced data from {selectedCompany.tenantName}
                </p>
                <div className="bg-[#FAFAFA] rounded-lg p-4 mb-6 max-w-xs mx-auto">
                  <p className="text-sm text-[#555555]">Your accounts, contacts, and invoices are now up to date with Xero.</p>
                </div>
                <button
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncComplete(false);
                  }}
                  className="px-6 py-2.5 bg-[#13B5EA] text-white rounded-md text-sm font-medium hover:bg-[#0E92BC] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      <AlertModal
        isOpen={disconnectTenantId !== null}
        onClose={() => setDisconnectTenantId(null)}
        onConfirm={confirmDisconnect}
        title="Disconnect Organization"
        description="Are you sure you want to disconnect this organization? This will stop all synchronization."
        confirmText="Disconnect"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDisconnecting}
      />
    </div>
  );
}
