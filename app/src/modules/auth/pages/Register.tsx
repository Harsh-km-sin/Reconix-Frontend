import { Link } from "react-router-dom";
import type { RegisterProps } from '@/modules/auth/types';

/**
 * Repurposed: no self-registration. Users are invited by an admin and set their password via email link.
 */
export function Register({ onNavigateToLogin }: RegisterProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F0F0F0] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 animate-scale-in text-center">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Xero Automation" className="h-16 w-16 mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Xero Automation</h1>
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
          Accounts are by invite only
        </h2>
        <p className="text-sm text-[#555555] mb-6">
          You can’t create an account here. An administrator must invite you by email. Use the link
          in that email to set your password, then sign in.
        </p>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="w-full h-12 bg-[#13B5EA] text-white rounded-md font-semibold text-sm transition-all duration-150 hover:bg-[#0E92BC]"
        >
          Back to sign in
        </button>
        <p className="mt-6 text-sm text-[#8A8A8A]">
          Already have an invite?{" "}
          <Link to="/set-password" className="text-[#13B5EA] hover:underline">
            Set your password
          </Link>
        </p>
      </div>
    </div>
  );
}
