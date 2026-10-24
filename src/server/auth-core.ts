import crypto from "node:crypto";
import { get, run } from "./db";

export const SESSION_COOKIE = "predicators_session";
const SESSION_DAYS = 14;

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "player" | "admin";
  status: "active" | "suspended" | "banned";
  balance: number;
}

/* ---------- Passwords (scrypt) ---------- */

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

/* ---------- Sessions ---------- */

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", sha(token), userId, expires);
  return { token, expires };
}

export function destroySession(token: string) {
  run("DELETE FROM sessions WHERE token_hash = ?", sha(token));
}

export function userFromToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const row = get<SessionUser & { expires_at: number }>(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.balance, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`,
    sha(token),
  );
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, balance: row.balance };
}

/** Parse the session token out of a raw Cookie header (used by the socket handshake). */
export function tokenFromCookieHeader(header: string | undefined) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/* ---------- Login throttling (in-memory) ---------- */

const attempts = new Map<string, { count: number; resetAt: number }>();

/** Returns true when the key has exceeded 8 attempts in 10 minutes. */
export function throttled(key: string, bump = true) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.resetAt < now) {
    if (bump) attempts.set(key, { count: 1, resetAt: now + 600_000 });
    return false;
  }
  if (bump) a.count++;
  return a.count > 8;
}

export function clearThrottle(key: string) {
  attempts.delete(key);
}
