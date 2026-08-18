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
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F0F0F0] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Xero Automation" className="h-16 w-16 mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Xero Automation</h1>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-[#1A1A1A] text-center mb-6">
          Sign in to your account
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#555555] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              placeholder="you@company.com"
              className={`w-full h-11 px-4 border rounded-md text-sm transition-all duration-150 focus:outline-none ${
                displayError
                  ? 'border-[#E53935] focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/10'
                  : 'border-[#E0E0E0] focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10'
              }`}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#555555] mb-1.5">
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
                    ? 'border-[#E53935] focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/10'
                    : 'border-[#E0E0E0] focus:border-[#13B5EA] focus:ring-2 focus:ring-[#13B5EA]/10'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#555555] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="flex items-center gap-2 text-sm text-[#E53935] animate-fade-in">
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
                className="w-4 h-4 border border-[#E0E0E0] rounded text-[#13B5EA] focus:ring-[#13B5EA]"
              />
              <span className="text-sm text-[#555555]">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-[#13B5EA] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !credentials.email || !credentials.password}
            className="w-full h-12 bg-[#13B5EA] text-white rounded-md font-semibold text-sm transition-all duration-150 hover:bg-[#0E92BC] hover:scale-[1.02] active:scale-[0.98] disabled:bg-[#E0E0E0] disabled:text-[#8A8A8A] disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
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
          <div className="flex-1 h-px bg-[#E0E0E0]" />
          <span className="text-sm text-[#8A8A8A]">Don&apos;t have an account?</span>
          <div className="flex-1 h-px bg-[#E0E0E0]" />
        </div>

        {/* Register Link */}
        <button
          onClick={onNavigateToRegister}
          className="w-full h-11 border border-[#13B5EA] text-[#13B5EA] rounded-md font-semibold text-sm transition-all duration-150 hover:bg-[#E5F6FC]"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
