/** Creates N players with credits and a session each; writes their cookie headers to a JSON file. */
import fs from "node:fs";
import { createSession, hashPassword, SESSION_COOKIE } from "../src/server/auth-core";
import { db, run, tx } from "../src/server/db";

const n = Number(process.argv[2] ?? 1000);
const out = process.argv[3] ?? "/tmp/load-cookies.json";
const hash = hashPassword("password123");
const cookies: string[] = [];
const now = Date.now();
tx(() => {
  for (let i = 0; i < n; i++) {
    const r = run(
      "INSERT INTO users (name, email, password_hash, role, status, balance, created_at, last_seen_at) VALUES (?, ?, ?, 'player', 'active', 100000, ?, ?)",
      `load${i}`,
      `load${i}@t.com`,
      hash,
      now,
      now,
    );
    const uid = Number(r.lastInsertRowid);
    run("INSERT INTO ledger (user_id, kind, game, amount, balance_after, note, created_at) VALUES (?, 'grant', NULL, 100000, 100000, 'load test', ?)", uid, now);
    cookies.push(`${SESSION_COOKIE}=${createSession(uid).token}`);
  }
});
fs.writeFileSync(out, JSON.stringify(cookies));
db.close();
console.log(`seeded ${n} players -> ${out}`);
