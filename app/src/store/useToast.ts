import { useCallback } from "react";
import type { ToastType } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast, removeToast as removeToastAction } from "@/store/toastSlice";

export function useToast() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.toast.toasts);

  const removeToast = useCallback(
    (id: string) => {
      dispatch(removeToastAction(id));
    },
    [dispatch]
  );

  const add = useCallback(
    (type: ToastType, title: string, message?: string, duration: number = 5000) => {
      const id = Math.random().toString(36).substring(7);
      dispatch(addToast({ id, type, title, message, duration }));
      if (duration > 0) {
        setTimeout(() => dispatch(removeToastAction(id)), duration);
      }
      return id;
    },
    [dispatch]
  );

  const success = useCallback(
    (title: string, message?: string) => add("success", title, message),
    [add]
  );
  const error = useCallback(
    (title: string, message?: string) => add("error", title, message),
    [add]
  );
  const warning = useCallback(
    (title: string, message?: string) => add("warning", title, message),
    [add]
  );
  const info = useCallback(
    (title: string, message?: string) => add("info", title, message),
    [add]
  );

  return {
    toasts,
    addToast: add,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
