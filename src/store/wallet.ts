"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DAILY_BONUS, STARTING_BALANCE } from "@/lib/constants";
import { uid } from "@/lib/utils";
import type { GameId, Transaction, TxnKind } from "@/types";

const DAY = 86_400_000;

interface WalletState {
  balance: number;
  transactions: Transaction[];
  streak: number;
  lastClaimAt: number | null;
  wagered: number;
  won: number;

  /** Debit a stake. Returns false when funds are insufficient. */
  placeBet: (game: GameId, amount: number, label: string) => boolean;
  /** Credit a payout. */
  credit: (game: GameId, amount: number, label: string) => void;
  topUp: (amount: number) => void;
  canClaimDaily: () => boolean;
  claimDaily: () => number;
  reset: () => void;
}

function makeTxn(
  kind: TxnKind,
  game: GameId | "system",
  label: string,
  amount: number,
  balanceAfter: number,
): Transaction {
  return { id: uid("tx"), kind, game, label, amount, balanceAfter, at: Date.now() };
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: STARTING_BALANCE,
      transactions: [],
      streak: 3,
      lastClaimAt: null,
      wagered: 0,
      won: 0,

      placeBet: (game, amount, label) => {
        const { balance } = get();
        if (amount <= 0 || amount > balance) return false;
        const next = balance - amount;
        set((s) => ({
          balance: next,
          wagered: s.wagered + amount,
          transactions: [makeTxn("bet", game, label, -amount, next), ...s.transactions].slice(0, 100),
        }));
        return true;
      },

      credit: (game, amount, label) => {
        if (amount <= 0) return;
        const next = get().balance + amount;
        set((s) => ({
          balance: next,
          won: s.won + amount,
          transactions: [makeTxn("win", game, label, amount, next), ...s.transactions].slice(0, 100),
        }));
      },

      topUp: (amount) => {
        const next = get().balance + amount;
        set((s) => ({
          balance: next,
          transactions: [makeTxn("topup", "system", "Free coin top-up", amount, next), ...s.transactions].slice(0, 100),
        }));
      },

      canClaimDaily: () => {
        const last = get().lastClaimAt;
        return last === null || Date.now() - last >= DAY;
      },

      claimDaily: () => {
        const { canClaimDaily, lastClaimAt, streak, balance } = get();
        if (!canClaimDaily()) return 0;
        const keepStreak = lastClaimAt !== null && Date.now() - lastClaimAt < DAY * 2;
        const newStreak = lastClaimAt === null ? streak : keepStreak ? streak + 1 : 1;
        const bonus = DAILY_BONUS + Math.min(newStreak, 7) * 25;
        const next = balance + bonus;
        set((s) => ({
          balance: next,
          streak: newStreak,
          lastClaimAt: Date.now(),
          transactions: [makeTxn("bonus", "system", `Daily bonus · day ${newStreak}`, bonus, next), ...s.transactions].slice(0, 100),
        }));
        return bonus;
      },

      reset: () =>
        set({ balance: STARTING_BALANCE, transactions: [], streak: 3, lastClaimAt: null, wagered: 0, won: 0 }),
    }),
    { name: "predicators-wallet" },
  ),
);
