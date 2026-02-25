import { createSlice } from "@reduxjs/toolkit";
import type { User, CompanyOption } from "@/types";
import type { StoredAuth } from "./authHelpers";

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  companies: CompanyOption[];
  companyId: string | null;
  role: string;
  lastAuthError: string | null;
};

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  permissions: [],
  companies: [],
  companyId: null,
  role: "",
  lastAuthError: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setAuth: (state, action: { payload: StoredAuth }) => {
      const { user, permissions, companies, companyId, role } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.permissions = permissions;
      state.companies = companies;
      state.companyId = companyId;
      state.role = role;
      state.lastAuthError = null;
    },
    setAuthLoading: (state) => {
      state.isLoading = true;
      state.lastAuthError = null;
    },
    setAuthError: (state, action: { payload: string }) => {
      state.isLoading = false;
      state.lastAuthError = action.payload;
    },
    clearAuthError: (state) => {
      state.lastAuthError = null;
    },
    clearAuth: () => initialAuthState,
    updateProfile: (state, action: { payload: Partial<User> }) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setAuth, setAuthLoading, setAuthError, clearAuthError, clearAuth, updateProfile } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
