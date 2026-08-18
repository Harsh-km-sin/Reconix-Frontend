import type { LoginCredentials } from '@/types';

export interface LoginProps {
  onLogin: (credentials: LoginCredentials) => Promise<boolean>;
  onNavigateToRegister: () => void;
  /** Backend error message to show (e.g. "Please set your password using the invite link") */
  serverError?: string | null;
}

export interface RegisterProps {
  onNavigateToLogin: () => void;
}

export interface MFALoginChallengeProps {
  onVerify: (token: string) => Promise<boolean>;
  onCancel: () => void;
  error?: string | null;
}
