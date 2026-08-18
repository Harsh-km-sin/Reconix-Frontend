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
    async (credentials: LoginCredentials): Promise<{ success: boolean; mfaRequired?: boolean; mfaToken?: string }> => {
      dispatch(setAuthLoading());
      try {
        const data = await api.post<AuthResponseData & { mfaRequired?: boolean; mfaToken?: string; user: { id: string } }>(
          "auth/login",
          {
            email: credentials.email,
            password: credentials.password,
          },
          false
        );

        if (data.mfaRequired) {
          dispatch(setAuthError("")); // Clear loading, no error yet
          return { success: false, mfaRequired: true, mfaToken: data.mfaToken };
        }

        if (!data.token) {
           throw new Error("Missing auth token from server");
        }

        setToken(data.token);
        const stored = mapBackendToUser(data);
        saveStoredAuth(stored);
        dispatch(setAuth(stored));
        return { success: true };
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : "Login failed";
        dispatch(setAuthError(message));
        return { success: false };
      }
    },
    [dispatch]
  );

  const verifyMFALogin = useCallback(
    async (mfaToken: string, token: string): Promise<boolean> => {
      dispatch(setAuthLoading());
      try {
        const data = await api.post<AuthResponseData>("auth/mfa/login-verify", {
          mfaToken,
          token,
        }, false);
        
        setToken(data.token);
        const stored = mapBackendToUser(data);
        saveStoredAuth(stored);
        dispatch(setAuth(stored));
        return true;
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : "MFA verification failed";
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

  const switchCompany = useCallback(
    async (companyId: string): Promise<boolean> => {
      try {
        const data = await api.post<AuthResponseData>("auth/switch-company", { companyId });
        setToken(data.token);
        const stored = mapBackendToUser(data);
        saveStoredAuth(stored);
        dispatch(setAuth(stored));
        return true;
      } catch {
        return false;
      }
    },
    [dispatch]
  );

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
    switchCompany,
    verifyMFALogin,
  };
}

export { ApiClientError };
