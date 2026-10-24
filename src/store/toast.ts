"use client";

import { create } from "zustand";
import { uid } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-4) }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3800);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) => useToast.getState().push({ tone: "success", title, description }),
  error: (title: string, description?: string) => useToast.getState().push({ tone: "error", title, description }),
  info: (title: string, description?: string) => useToast.getState().push({ tone: "info", title, description }),
};
