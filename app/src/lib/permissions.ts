/**
 * Permission helpers aligned with backend (JWT permissions array).
 * Backend sends module names (e.g. "users", "invoices"), "module:write" for edit
 * access, and fine-grained capability strings (see PERMISSIONS).
 */

/** Permission keys — must match the backend permission catalog. */
export const PERMISSIONS = {
  /** Approve, retry, or cancel job execution. */
  JOBS_APPROVE: 'jobs:approve',
  /** Delete jobs. */
  JOBS_DELETE: 'jobs:delete',
  /** View and edit roles + their permissions. */
  ROLES_MANAGE: 'roles:manage',
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
