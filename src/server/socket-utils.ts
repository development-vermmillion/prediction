import type { Socket } from "socket.io";
import { get } from "./db";
import { WalletError } from "./wallet";

export interface SocketUser {
  id: number;
  name: string;
  role: "player" | "admin";
}

export type Ack = (res: { ok: boolean; error?: string; [k: string]: unknown }) => void;

export class GameError extends Error {}

export const userOf = (socket: Socket) => socket.data.user as SocketUser;

/** Throws GameError unless the account may place bets (active player, not the owner). */
export function assertCanPlay(userId: number) {
  const u = get<{ status: string; role: string }>("SELECT status, role FROM users WHERE id = ?", userId);
  if (!u) throw new GameError("Account not found");
  if (u.role !== "player") throw new GameError("The owner account cannot place bets");
  if (u.status !== "active") throw new GameError(`Your account is ${u.status}`);
}

/**
 * Register a socket event with: per-socket rate limiting, error→ack translation and
 * a safe default ack. Handlers return extra fields to merge into the ack.
 */
export function handle<T = unknown>(
  socket: Socket,
  event: string,
  fn: (payload: T) => Record<string, unknown> | void,
) {
  socket.on(event, (payload: T, ack?: Ack) => {
    const reply: Ack = typeof ack === "function" ? ack : () => {};
    const now = Date.now();
    const bucket = (socket.data.rate ??= { t: now, n: 0 }) as { t: number; n: number };
    if (now - bucket.t > 1000) {
      bucket.t = now;
      bucket.n = 0;
    }
    if (++bucket.n > 25) return reply({ ok: false, error: "Slow down" });
    try {
      const extra = fn(payload) ?? {};
      reply({ ok: true, ...extra });
    } catch (err) {
      if (err instanceof GameError || err instanceof WalletError) return reply({ ok: false, error: err.message });
      console.error(`[socket:${event}]`, err);
      reply({ ok: false, error: "Something went wrong" });
    }
  });
}

export const secureFloat = () => {
  // 53 random bits → [0, 1)
  const b = new Uint32Array(2);
  globalThis.crypto.getRandomValues(b);
  return ((b[0] >>> 5) * 67108864 + (b[1] >>> 6)) / 9007199254740992;
};
