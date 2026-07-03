/**
 * Permission helpers aligned with backend (JWT permissions array).
 * Backend sends module names (e.g. "users", "invoices"), "module:write" for edit
 * access, and fine-grained capability strings (see PERMISSIONS).
 */

/** Capability strings — must match the backend CAPABILITIES values. */
export const PERMISSIONS = {
  /** Approve/run a job you created yourself (authorised four-eyes exception). */
  SELF_APPROVE_JOBS: 'jobs:self-approve',
} as const;

export function hasModuleAccess(permissions: readonly string[], module: string): boolean {
  return permissions.includes(module);
}

export function hasModuleWriteAccess(permissions: readonly string[], module: string): boolean {
  return permissions.includes(`${module}:write`);
}

/** Check if permissions include a specific capability/permission string. */
export function hasPermission(permissions: readonly string[], permission: string): boolean {
  return permissions.includes(permission);
}
