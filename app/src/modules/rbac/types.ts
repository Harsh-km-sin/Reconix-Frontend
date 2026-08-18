/** A permission the server recognises, as listed by GET /api/v1/permissions. */
export interface PermissionDef {
  id: string;
  key: string;
  category: string | null;
  description: string | null;
}

/** A role together with its resolved permission keys. */
export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionKeys: string[];
}

/** What the roles page is currently doing: inspecting, creating, or idle. */
export type RolesPageMode =
  | { kind: 'view'; roleId: string }
  | { kind: 'create' }
  | { kind: 'empty' };
