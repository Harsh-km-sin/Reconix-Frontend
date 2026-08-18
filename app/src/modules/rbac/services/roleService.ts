import { api } from '@/lib/api';
import type { PermissionDef, RoleWithPermissions } from '@/modules/rbac/types';

/** RBAC management API (guarded server-side by the roles:manage permission). */
export const roleService = {
  listPermissions: () => api.get<PermissionDef[]>('permissions'),
  listRoles: () => api.get<RoleWithPermissions[]>('roles'),
  createRole: (data: { name: string; description?: string; permissionKeys: string[] }) =>
    api.post<RoleWithPermissions>('roles', data),
  updateRole: (id: string, data: { name?: string; description?: string }) =>
    api.patch<RoleWithPermissions>(`roles/${id}`, data),
  setRolePermissions: (id: string, permissionKeys: string[]) =>
    api.put<RoleWithPermissions>(`roles/${id}/permissions`, { permissionKeys }),
  deleteRole: (id: string) => api.delete<{ message: string }>(`roles/${id}`),
};
