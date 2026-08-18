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
    <div className="min-h-screen bg-gradient-to-br from-page to-page-shade flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 animate-scale-in">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-ink-light hover:text-ink-mid transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-brand" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Verify your identity</h2>
          <p className="text-ink-mid text-center mt-2">
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
                  ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/10'
                  : 'border-line focus:border-brand focus:ring-4 focus:ring-brand/10'
              }`}
              required
              autoFocus
            />
            {displayError && (
              <p className="text-sm text-danger text-center mt-2 animate-fade-in">
                {displayError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || token.length < 6}
            className="w-full h-12 bg-brand text-white rounded-md font-semibold text-sm transition-all duration-150 hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98] disabled:bg-line disabled:text-ink-light disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
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
