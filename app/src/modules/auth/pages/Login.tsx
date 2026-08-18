import { useState } from 'react';
import type { LoginCredentials } from '@/types';
import type { LoginProps } from '@/modules/auth/types';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function Login({ onLogin, onNavigateToRegister, serverError }: LoginProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const displayError = serverError ?? error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await onLogin(credentials);
    if (!success) {
      setError('Invalid email or password. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-page to-page-shade flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Xero Automation" className="h-16 w-16 mb-4" />
          <h1 className="text-2xl font-bold text-ink">Xero Automation</h1>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-ink text-center mb-6">
          Sign in to your account
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-ink-mid mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              placeholder="you@company.com"
              className={`w-full h-11 px-4 border rounded-md text-sm transition-all duration-150 focus:outline-none ${
                displayError
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/10'
                  : 'border-line focus:border-brand focus:ring-2 focus:ring-brand/10'
              }`}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-ink-mid mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                className={`w-full h-11 px-4 pr-12 border rounded-md text-sm transition-all duration-150 focus:outline-none ${
                  displayError
                    ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/10'
                    : 'border-line focus:border-brand focus:ring-2 focus:ring-brand/10'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-mid transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="flex items-center gap-2 text-sm text-danger animate-fade-in">
              <span>{displayError}</span>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={credentials.rememberMe}
                onChange={(e) => setCredentials(prev => ({ ...prev, rememberMe: e.target.checked }))}
                className="w-4 h-4 border border-line rounded text-brand focus:ring-brand"
              />
              <span className="text-sm text-ink-mid">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-brand hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !credentials.email || !credentials.password}
            className="w-full h-12 bg-brand text-white rounded-md font-semibold text-sm transition-all duration-150 hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98] disabled:bg-line disabled:text-ink-light disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-line" />
          <span className="text-sm text-ink-light">Don&apos;t have an account?</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {/* Register Link */}
        <button
          onClick={onNavigateToRegister}
          className="w-full h-11 border border-brand text-brand rounded-md font-semibold text-sm transition-all duration-150 hover:bg-brand-light"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
