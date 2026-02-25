import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { SetPassword } from '@/pages/SetPassword';
import { Dashboard } from '@/pages/Dashboard';
import { InvoiceReversal } from '@/pages/InvoiceReversal';
import { OverpaymentAllocation } from '@/pages/OverpaymentAllocation';
import { CreateOverpayment } from '@/pages/CreateOverpayment';
import { JobHistory } from '@/pages/JobHistory';
import { ConnectedCompanies } from '@/pages/ConnectedCompanies';
import { Settings } from '@/pages/Settings';
import { Layout } from '@/components/Layout';
import { ToastContainer } from '@/components/ToastContainer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

function App() {
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const { user, isAuthenticated, isLoading, login, logout, lastAuthError, permissions, companies, companyId } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const handleLogin = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    const result = await login(credentials);
    if (result) {
      success('Welcome back!', 'You have successfully signed in.');
    } else {
      error('Sign in failed', lastAuthError ?? 'Please check your credentials and try again.');
    }
    return result;
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
      <Layout user={user} onLogout={handleLogout} permissions={permissions} companies={companies} companyId={companyId}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reversal" element={<InvoiceReversal />} />
          <Route path="/allocation" element={<OverpaymentAllocation />} />
          <Route path="/create-overpayment" element={<CreateOverpayment />} />
          <Route path="/history" element={<JobHistory />} />
          <Route path="/companies" element={<ConnectedCompanies />} />
          <Route path="/settings" element={<Settings />} />
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
