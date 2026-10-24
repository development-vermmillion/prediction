import { all, get, run, tx } from "./db";
import { emitToUser } from "./bus";

export type LedgerKind = "grant" | "deduct" | "bet" | "win" | "refund";

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletError";
  }
}

export function getBalance(userId: number): number {
  return get<{ balance: number }>("SELECT balance FROM users WHERE id = ?", userId)?.balance ?? 0;
}

interface Entry {
  userId: number;
  amount: number; // signed
  kind: LedgerKind;
  game?: string | null;
  note?: string | null;
  adminId?: number | null;
}

/** Apply a ledger entry. MUST run inside `tx()`. Throws WalletError on insufficient funds. */
export function applyEntry(e: Entry): number {
  const row = get<{ balance: number }>("SELECT balance FROM users WHERE id = ?", e.userId);
  if (!row) throw new WalletError("Player not found");
  const next = row.balance + e.amount;
  if (next < 0) throw new WalletError("Insufficient credits");
  const wagered = e.kind === "bet" ? -e.amount : 0;
  const won = e.kind === "win" ? e.amount : 0;
  run(
    "UPDATE users SET balance = ?, total_wagered = total_wagered + ?, total_won = total_won + ? WHERE id = ?",
    next,
    wagered,
    won,
    e.userId,
  );
  run(
    "INSERT INTO ledger (user_id, kind, game, amount, balance_after, note, admin_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    e.userId,
    e.kind,
    e.game ?? null,
    e.amount,
    next,
    e.note ?? null,
    e.adminId ?? null,
    Date.now(),
  );
  return next;
}

export function pushBalance(userId: number) {
  emitToUser(userId, "balance", { balance: getBalance(userId) });
}

/** Debit a stake and record it as an open bet. Returns the open-bet id. */
export function placeStake(userId: number, game: string, amount: number, note: string): number {
  const id = tx(() => {
    applyEntry({ userId, amount: -amount, kind: "bet", game, note });
    const r = run("INSERT INTO open_bets (user_id, game, amount, created_at) VALUES (?, ?, ?, ?)", userId, game, amount, Date.now());
    return Number(r.lastInsertRowid);
  });
  pushBalance(userId);
  return id;
}

/** Close an open bet, optionally paying out. */
export function settleStake(openBetId: number, userId: number, game: string, payout: number, note: string) {
  tx(() => {
    run("DELETE FROM open_bets WHERE id = ?", openBetId);
    if (payout > 0) applyEntry({ userId, amount: payout, kind: "win", game, note });
  });
  if (payout > 0) pushBalance(userId);
}

/** Close an open bet and give the stake back. */
export function refundStake(openBetId: number, userId: number, game: string, amount: number, note: string) {
  tx(() => {
    run("DELETE FROM open_bets WHERE id = ?", openBetId);
    applyEntry({ userId, amount, kind: "refund", game, note });
  });
  pushBalance(userId);
}

/** Owner credit allocation. Positive = grant, negative = deduct. */
export function adminAdjust(adminId: number, userId: number, amount: number, note: string) {
  const balance = tx(() =>
    applyEntry({ userId, amount, kind: amount > 0 ? "grant" : "deduct", game: "system", note, adminId }),
  );
  pushBalance(userId);
  return balance;
}

/** After a restart, return every stake that was never settled. Returns how many were refunded. */
export function refundOrphanedBets(): number {
  const orphans = all<{ id: number; user_id: number; game: string; amount: number }>(
    "SELECT id, user_id, game, amount FROM open_bets",
  );
  for (const o of orphans) {
    tx(() => {
      run("DELETE FROM open_bets WHERE id = ?", o.id);
      applyEntry({ userId: o.user_id, amount: o.amount, kind: "refund", game: o.game, note: "Refund: server restarted mid-round" });
    });
  }
  return orphans.length;
}
