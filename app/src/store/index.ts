import { configureStore } from "@reduxjs/toolkit";
import { authReducer, initialAuthState } from "./authSlice";
import { toastReducer } from "./toastSlice";
import { loadStoredAuth, saveStoredAuth, clearStoredAuth } from "./authHelpers";
import { getToken } from "@/lib/api";

function getPreloadedAuth() {
  const token = getToken();
  const stored = loadStoredAuth();
  if (token && stored) {
    return {
      user: stored.user,
      isAuthenticated: true,
      isLoading: false,
      permissions: stored.permissions,
      companies: stored.companies,
      companyId: stored.companyId,
      role: stored.role,
      lastAuthError: null,
    };
  }
  return initialAuthState;
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
  },
  preloadedState: {
    auth: getPreloadedAuth(),
  },
});

store.subscribe(() => {
  const { user, permissions, companies, companyId, role } = store.getState().auth;
  if (user) {
    saveStoredAuth({
      user,
      role,
      companyId,
      permissions,
      companies,
    });
  } else {
    clearStoredAuth();
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
