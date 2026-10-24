"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export interface ClientUser {
  id: number;
  name: string;
  email: string;
  role: "player" | "admin";
  status?: string;
  balance: number;
}

interface SessionState {
  user: ClientUser | null;
  loaded: boolean;
  online: number;
  refresh: () => Promise<void>;
  setUser: (u: ClientUser | null) => void;
  setBalance: (n: number) => void;
  setOnline: (n: number) => void;
  logout: () => Promise<void>;
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  loaded: false,
  online: 0,
  refresh: async () => {
    try {
      const { user } = await api<{ user: ClientUser | null }>("/api/auth/me");
      set({ user, loaded: true });
    } catch {
      set({ user: null, loaded: true });
    }
  },
  setUser: (user) => set({ user, loaded: true }),
  setBalance: (balance) => {
    const u = get().user;
    if (u) set({ user: { ...u, balance } });
  },
  setOnline: (online) => set({ online }),
  logout: async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    set({ user: null });
  },
}));
