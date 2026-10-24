import { clientIp, fail, HttpError, json, readJson, route } from "@/server/http";
import { createSession, hashPassword, setSessionCookie, throttled } from "@/server/auth";
import { get, run } from "@/server/db";

export const POST = route(async (req: Request) => {
  if (throttled(`register:${clientIp(req)}`)) return fail("Too many attempts. Try again later.", 429);
  const body = await readJson<{ name?: string; email?: string; password?: string }>(req);
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (name.length < 2 || name.length > 40) throw new HttpError("Enter a name between 2 and 40 characters");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new HttpError("Enter a valid email");
  if (password.length < 8 || password.length > 100) throw new HttpError("Password must be at least 8 characters");
  if (get("SELECT id FROM users WHERE email = ?", email)) throw new HttpError("That email is already registered", 409);

  const now = Date.now();
  const r = run(
    "INSERT INTO users (name, email, password_hash, role, status, balance, created_at, last_seen_at) VALUES (?, ?, ?, 'player', 'active', 0, ?, ?)",
    name,
    email,
    hashPassword(password),
    now,
    now,
  );
  const { token, expires } = createSession(Number(r.lastInsertRowid));
  await setSessionCookie(token, expires);
  return json({ user: { id: Number(r.lastInsertRowid), name, email, role: "player", balance: 0 } }, 201);
});
