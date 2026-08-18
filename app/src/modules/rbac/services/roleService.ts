import { api } from '@/lib/api';

export interface PermissionDef {
  id: string;
  key: string;
  category: string | null;
  description: string | null;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionKeys: string[];
}

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
