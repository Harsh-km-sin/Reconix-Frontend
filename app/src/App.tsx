import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { SetPassword } from '@/pages/SetPassword';
import { Dashboard } from '@/pages/Dashboard';
import { JobBuilderSelection } from '@/pages/JobBuilderSelection';
import { JobUploadBuilder } from '@/pages/JobUploadBuilder';
import { JobManualBuilder } from '@/pages/JobManualBuilder';
import { JobHistory } from '@/pages/JobHistory';
import { ConnectedCompanies } from '@/pages/ConnectedCompanies';
import { Settings } from '@/pages/Settings';
import { AuditLogPage } from '@/pages/AuditLog';
import { Layout } from '@/components/Layout';
import { ToastContainer } from '@/components/ToastContainer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

import { MFALoginChallenge } from '@/components/MFALoginChallenge';

function App() {
  const [authView, setAuthView] = useState<'login' | 'register' | 'mfa'>('login');
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading, login, logout, lastAuthError, permissions, companies, companyId, verifyMFALogin, switchCompany } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const handleLogin = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    const result = await login(credentials);
    if (result.success) {
      success('Welcome back!', 'You have successfully signed in.');
    } else if (result.mfaRequired && result.userId) {
      setMfaUserId(result.userId);
      setAuthView('mfa');
    } else {
      error('Sign in failed', lastAuthError ?? 'Please check your credentials and try again.');
    }
    return result.success;
  };

  const handleMFAVerify = async (token: string) => {
    if (!mfaUserId) return false;
    const successResult = await verifyMFALogin(mfaUserId, token);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#E5F6FC] border-t-[#13B5EA] rounded-full animate-spin" />
          <p className="text-[#555555]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authView === 'mfa' && mfaUserId) {
      return (
        <>
          <MFALoginChallenge
            userId={mfaUserId}
            onVerify={handleMFAVerify}
            onCancel={() => {
              setAuthView('login');
              setMfaUserId(null);
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
