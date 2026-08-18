import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { AuthResponseData } from "@/types";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export function SetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { setAuthFromResponse } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!token) {
      setError("Invalid invite link. Please use the link from your email.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.post<AuthResponseData>("auth/set-password", { token, password }, false);
      setAuthFromResponse(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-page to-page-shade flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 text-center">
          <div className="mb-6 text-danger">Invalid or missing invite link.</div>
          <p className="text-sm text-ink-mid mb-6">
            Please use the link from your invite email, or ask an admin to resend the invitation.
          </p>
          <Link
            to="/"
            className="inline-block w-full h-11 bg-brand text-white rounded-md font-semibold text-sm flex items-center justify-center hover:bg-brand-hover transition-colors"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-page to-page-shade flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Xero Automation" className="h-16 w-16 mb-4" />
          <h1 className="text-2xl font-bold text-ink">Xero Automation</h1>
        </div>
        <h2 className="text-xl font-semibold text-ink text-center mb-6">
          Set your password
        </h2>
        <p className="text-sm text-ink-mid text-center mb-6">
          You’ve been invited. Choose a password to activate your account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-mid mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-11 px-4 pr-12 border border-line rounded-md text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 focus:outline-none"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-mid"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-mid mb-1.5">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`w-full h-11 px-4 pr-12 border rounded-md text-sm focus:outline-none ${
                  confirmPassword && password !== confirmPassword
                    ? "border-danger focus:ring-2 focus:ring-danger/10"
                    : "border-line focus:border-brand focus:ring-2 focus:ring-brand/10"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-mid"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-danger mt-1">Passwords do not match</p>
            )}
          </div>
          {error && (
            <div className="text-sm text-danger animate-fade-in">{error}</div>
          )}
          <button
            type="submit"
            disabled={isLoading || password.length < 8 || password !== confirmPassword}
            className="w-full h-12 bg-brand text-white rounded-md font-semibold text-sm hover:bg-brand-hover disabled:bg-line disabled:text-ink-light disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Set password & sign in"}
          </button>
        </form>
        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
