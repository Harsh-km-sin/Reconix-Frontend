import { useCallback } from "react";
import type { User, LoginCredentials, RegisterData, AuthResponseData } from "@/types";
import { api, setToken, clearToken, ApiClientError } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAuth,
  setAuthLoading,
  setAuthError,
  clearAuthError,
  clearAuth,
  updateProfile,
} from "@/store/authSlice";
import { mapBackendToUser } from "@/store/authHelpers";
import { saveStoredAuth, clearStoredAuth } from "@/store/authHelpers";

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      dispatch(setAuthLoading());
      try {
        const data = await api.post<AuthResponseData>(
          "auth/login",
          {
            email: credentials.email,
            password: credentials.password,
          },
          false
        );
        setToken(data.token);
        const stored = mapBackendToUser(data);
        saveStoredAuth(stored);
        dispatch(setAuth(stored));
        return true;
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : "Login failed";
        dispatch(setAuthError(message));
        return false;
      }
    },
    [dispatch]
  );

  const register = useCallback(async (_data: RegisterData): Promise<boolean> => {
    return false;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearStoredAuth();
    dispatch(clearAuth());
  }, [dispatch]);

  const updateProfileAction = useCallback(
    async (updates: Partial<User>): Promise<boolean> => {
      dispatch(updateProfile(updates));
      return true;
    },
    [dispatch]
  );

  const setAuthFromResponse = useCallback(
    (data: AuthResponseData) => {
      setToken(data.token);
      const stored = mapBackendToUser(data);
      saveStoredAuth(stored);
      dispatch(setAuth(stored));
    },
    [dispatch]
  );

  const clearLastAuthError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    permissions: auth.permissions,
    companies: auth.companies,
    companyId: auth.companyId,
    lastAuthError: auth.lastAuthError,
    login,
    register,
    logout,
    updateProfile: updateProfileAction,
    setAuthFromResponse,
    clearLastAuthError,
  };
}

export { ApiClientError };
