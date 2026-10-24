import { clientIp } from "@/server/http";
import { clearThrottle, createSession, setSessionCookie, throttled, verifyPassword } from "@/server/auth";
import { get, run } from "@/server/db";
import { fail, json, readJson, route } from "@/server/http";

interface Row {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  status: string;
  balance: number;
}

export const POST = route(async (req: Request) => {
  const body = await readJson<{ email?: string; password?: string }>(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const key = `login:${email}:${clientIp(req)}`;
  if (throttled(key, false)) return fail("Too many attempts. Try again in a few minutes.", 429);

  const u = get<Row>("SELECT id, name, email, password_hash, role, status, balance FROM users WHERE email = ?", email);
  if (!u || !verifyPassword(password, u.password_hash)) {
    throttled(key);
    return fail("Incorrect email or password", 401);
  }
  if (u.status === "banned") return fail("This account has been banned", 403);

  clearThrottle(key);
  run("UPDATE users SET last_seen_at = ? WHERE id = ?", Date.now(), u.id);
  const { token, expires } = createSession(u.id);
  await setSessionCookie(token, expires);
  return json({ user: { id: u.id, name: u.name, email: u.email, role: u.role, balance: u.balance } });
});
