import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from '@/modules/auth/pages/Login';
import { Register } from '@/modules/auth/pages/Register';
import { SetPassword } from '@/modules/auth/pages/SetPassword';
import { Layout } from '@/app/layout/Layout';
import { AppRoutes } from '@/app/routes';
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
        <AppRoutes />
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
