import type { User, AuthResponseData, CompanyOption } from "@/types";
import { setToken, clearToken } from "@/lib/api";

export const AUTH_STORAGE_KEY = "reconix_auth";

/** Decode JWT payload without verification (for reading claims client-side). */
export function decodeJwtPayload(token: string): { permissions?: string[];[key: string]: unknown } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as { permissions?: string[];[key: string]: unknown };
  } catch {
    return {};
  }
}

export type StoredAuth = {
  user: User;
  role: string;
  companyId: string | null;
  permissions: string[];
  companies: CompanyOption[];
  activeTenantId: string | null;
};

export function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredAuth): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function mapBackendToUser(data: AuthResponseData): StoredAuth {
  const role = data.role ?? "";
  const companies: CompanyOption[] =
    data.companies?.map((c) => ({
      companyId: c.companyId,
      companyName: c.companyName,
      role: c.role,
    })) ?? [];
  const permissions = decodeJwtPayload(data.token).permissions ?? [];
  const user: User = {
    id: data.user.id,
    email: data.user.email,
    fullName: data.user.name ?? data.user.email,
    role: role,
    roleId: data.roleId,
    timezone: "UTC",
    dateFormat: "DD/MM/YYYY",
    isActive: true,
  };
  return {
    user,
    role: role,
    companyId: data.companyId ?? null,
    permissions,
    companies,
    activeTenantId: null,
  };
}

export function persistAuthAndToken(auth: StoredAuth | null, token: string | null): void {
  if (token) setToken(token);
  else clearToken();
  if (auth) saveStoredAuth(auth);
  else clearStoredAuth();
}
