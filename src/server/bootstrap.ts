import { get, run } from "./db";
import { hashPassword } from "./auth-core";
import { refundOrphanedBets } from "./wallet";

/** One-time startup work: make sure an owner account exists and settle orphaned stakes. */
export function bootstrap() {
  const email = process.env.ADMIN_EMAIL ?? "admin@predicators.com";
  const password = process.env.ADMIN_PASSWORD;
  const prod = process.env.NODE_ENV === "production";

  const hasAdmin = get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!hasAdmin) {
    if (prod && (!password || password.length < 10)) {
      throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 chars) before first production start.");
    }
    const pw = password ?? "admin123";
    const now = Date.now();
    run(
      "INSERT INTO users (name, email, password_hash, role, status, balance, created_at, last_seen_at) VALUES (?, ?, ?, 'admin', 'active', 0, ?, ?)",
      "Owner",
      email,
      hashPassword(pw),
      now,
      now,
    );
    console.log(`[bootstrap] created owner account ${email}${password ? "" : " (default dev password: admin123)"}`);
  }

  const refunded = refundOrphanedBets();
  if (refunded > 0) console.log(`[bootstrap] refunded ${refunded} unsettled bet(s) from the previous run`);
}
