"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/constants";

interface AdminAuthState {
  authed: boolean;
  email: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

/**
 * Demo-only client-side auth for the owner dashboard.
 * Replace with a real session (NextAuth / custom JWT + middleware) in production.
 */
export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      authed: false,
      email: null,
      login: (email, password) => {
        const ok = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
        if (ok) set({ authed: true, email });
        return ok;
      },
      logout: () => set({ authed: false, email: null }),
    }),
    { name: "predicators-admin" },
  ),
);
