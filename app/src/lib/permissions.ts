/**
 * Permission helpers aligned with backend (JWT permissions array).
 * Backend sends module names (e.g. "users", "invoices") and "module:write" for edit access.
 */

export function hasModuleAccess(permissions: readonly string[], module: string): boolean {
  return permissions.includes(module);
}

export function hasModuleWriteAccess(permissions: readonly string[], module: string): boolean {
  return permissions.includes(`${module}:write`);
}
