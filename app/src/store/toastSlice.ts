import { createSlice } from "@reduxjs/toolkit";
import type { Toast, ToastType } from "@/types";

type ToastState = {
  toasts: Toast[];
};

const initialState: ToastState = {
  toasts: [],
};

export const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    addToast: (
      state,
      action: {
        payload: { id: string; type: ToastType; title: string; message?: string; duration?: number };
      }
    ) => {
      state.toasts.push({
        id: action.payload.id,
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration,
      });
    },
    removeToast: (state, action: { payload: string }) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export const toastReducer = toastSlice.reducer;
