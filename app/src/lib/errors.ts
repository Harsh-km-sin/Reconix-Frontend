import { ApiClientError } from '@/lib/api';

/**
 * Normalize any thrown value into a human-readable message.
 *
 * Prefers the backend's `error.message` (carried by ApiClientError) so the user
 * sees the real reason instead of a hardcoded "Please try again".
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiClientError) return err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

/** The backend error code, when the failure came from our API. */
export function getErrorCode(err: unknown): string | null {
  return err instanceof ApiClientError ? err.code : null;
}

/** True when the failure is an auth/permission problem (401/403). */
export function isAuthError(err: unknown): boolean {
  return err instanceof ApiClientError && (err.status === 401 || err.status === 403);
}
