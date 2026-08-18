import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/modules/auth/pages/Login';
import { Register } from '@/modules/auth/pages/Register';
import { SetPassword } from '@/modules/auth/pages/SetPassword';
import { Dashboard } from '@/modules/dashboard/pages/Dashboard';
import { JobBuilderSelection } from '@/modules/jobs/pages/JobBuilderSelection';
import { JobUploadBuilder } from '@/modules/jobs/pages/JobUploadBuilder';
import { JobManualBuilder } from '@/modules/jobs/pages/JobManualBuilder';
import { JobHistory } from '@/modules/jobs/pages/JobHistory';
import { ConnectedCompanies } from '@/modules/xero/pages/ConnectedCompanies';
import { Settings } from '@/modules/settings/pages/Settings';
import { AuditLogPage } from '@/modules/audit/pages/AuditLog';
import { RolesPermissions } from '@/modules/rbac/pages/RolesPermissions';
import { Layout } from '@/app/layout/Layout';
import { ToastContainer } from '@/ui_library/feedback/ToastContainer';
import { LoadingState } from '@/ui_library/feedback/LoadingState';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useToast } from '@/store/useToast';

import { MFALoginChallenge } from '@/modules/auth/components/MFALoginChallenge';

function App() {
  const [authView, setAuthView] = useState<'login' | 'register' | 'mfa'>('login');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading, login, logout, lastAuthError, permissions, companies, companyId, verifyMFALogin, switchCompany } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const handleLogin = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    const result = await login(credentials);
    if (result.success) {
      success('Welcome back!', 'You have successfully signed in.');
    } else if (result.mfaRequired && result.mfaToken) {
      setMfaToken(result.mfaToken);
      setAuthView('mfa');
    } else {
      error('Sign in failed', lastAuthError ?? 'Please check your credentials and try again.');
    }
    return result.success;
  };

  const handleMFAVerify = async (token: string) => {
    if (!mfaToken) return false;
    const successResult = await verifyMFALogin(mfaToken, token);
    if (successResult) {
      success('Welcome back!', 'MFA verification successful.');
    }
    return successResult;
  };

  const handleLogout = () => {
    logout();
    success('Signed out', 'You have been successfully signed out.');
  };

  // Show loading state
  if (isLoading) {
    return <LoadingState variant="page" message="Loading…" className="bg-page" />;
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authView === 'mfa' && mfaToken) {
      return (
        <>
          <MFALoginChallenge
            onVerify={handleMFAVerify}
            onCancel={() => {
              setAuthView('login');
              setMfaToken(null);
            }}
            error={lastAuthError}
          />
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </>
      );
    }

    return (
      <>
        {authView === 'login' ? (
          <Login
            onLogin={handleLogin}
            onNavigateToRegister={() => setAuthView('register')}
            serverError={lastAuthError}
          />
        ) : (
          <Register onNavigateToLogin={() => setAuthView('login')} />
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // Authenticated: main app with routing
  return (
    <>
      <Layout user={user} onLogout={handleLogout} permissions={permissions} companies={companies} companyId={companyId} onSwitchCompany={switchCompany}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs/new" element={<JobBuilderSelection />} />
          <Route path="/jobs/new/upload" element={<JobUploadBuilder />} />
          <Route path="/jobs/new/manual" element={<JobManualBuilder />} />
          <Route path="/history" element={<JobHistory />} />
          <Route path="/companies" element={<ConnectedCompanies />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="/roles" element={<RolesPermissions />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default function AppRoot() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
