/**
 * API client for Reconix backend.
 * Uses VITE_API_URL and sends JWT in Authorization header when available.
 */

import type { ApiSuccess, ApiError } from "@/lib/types/api";

export type { ApiSuccess, ApiError };

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "reconix_token";
const TENANT_KEY = "reconix_active_tenant";

/** Thrown on non-2xx responses; message is user-facing */
export class ApiClientError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getActiveTenant(): string | null {
  return localStorage.getItem(TENANT_KEY);
}

export function setActiveTenant(tenantId: string | null): void {
  if (tenantId) {
    localStorage.setItem(TENANT_KEY, tenantId);
  } else {
    localStorage.removeItem(TENANT_KEY);
  }
}

function getHeaders(includeAuth: boolean): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (includeAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const tenantId = getActiveTenant();
  if (tenantId) {
    headers["X-Active-Tenant"] = tenantId;
  }
  return headers;
}

/**
 * Request the backend. Returns data on 2xx; throws ApiClientError on 4xx/5xx
 * with message from backend envelope or a fallback.
 */
export async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const url = path.startsWith("http") ? path : `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const res = await fetch(url, {
    method,
    headers: getHeaders(auth),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const text = await res.text();
  let json: ApiSuccess<T> | ApiError | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const message =
      json && "error" in json && json.error?.message
        ? json.error.message
        : res.statusText || "Request failed";
    const code = json && "error" in json && json.error?.code ? json.error.code : "UNKNOWN";
    throw new ApiClientError(message, code, res.status);
  }

  if (json && "success" in json && json.success && "data" in json) {
    return json.data as T;
  }
  if (json && "error" in json) {
    throw new ApiClientError(
      (json as ApiError).error.message,
      (json as ApiError).error.code,
      res.status
    );
  }
  return undefined as T;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PUT", body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PATCH", body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: "DELETE", auth }),
};
