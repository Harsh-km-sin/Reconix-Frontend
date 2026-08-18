import { useState } from 'react';
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { MFALoginChallengeProps } from '@/modules/auth/types';

export function MFALoginChallenge({ onVerify, onCancel, error: serverError }: MFALoginChallengeProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const displayError = serverError ?? error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setError('');
    setIsLoading(true);

    const success = await onVerify(token);
    if (!success) {
      setError('Invalid code. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F0F0F0] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 animate-scale-in">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-[#8A8A8A] hover:text-[#555555] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#E5F6FC] rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-[#13B5EA]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Verify your identity</h2>
          <p className="text-[#555555] text-center mt-2">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className={`w-full h-14 text-center text-3xl tracking-[0.5em] font-mono border rounded-lg transition-all duration-150 focus:outline-none ${
                displayError
                  ? 'border-[#E53935] focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/10'
                  : 'border-[#E0E0E0] focus:border-[#13B5EA] focus:ring-4 focus:ring-[#13B5EA]/10'
              }`}
              required
              autoFocus
            />
            {displayError && (
              <p className="text-sm text-[#E53935] text-center mt-2 animate-fade-in">
                {displayError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || token.length < 6}
            className="w-full h-12 bg-[#13B5EA] text-white rounded-md font-semibold text-sm transition-all duration-150 hover:bg-[#0E92BC] hover:scale-[1.02] active:scale-[0.98] disabled:bg-[#E0E0E0] disabled:text-[#8A8A8A] disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Verify & Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
