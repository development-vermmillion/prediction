"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  name: string;
  email: string;
  joinedAt: number;
  loggedIn: boolean;
  signIn: (name: string, email: string) => void;
  signOut: () => void;
  rename: (name: string) => void;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set) => ({
      name: "Guest Player",
      email: "",
      joinedAt: 1_760_000_000_000,
      loggedIn: false,
      signIn: (name, email) => set({ name, email, loggedIn: true, joinedAt: Date.now() }),
      signOut: () => set({ name: "Guest Player", email: "", loggedIn: false }),
      rename: (name) => set({ name }),
    }),
    { name: "predicators-player" },
  ),
);
