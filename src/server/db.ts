import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * SQLite database (Node's built-in `node:sqlite`, Node >= 22.5).
 * Stored on `globalThis` so the custom server and Next route handlers share one connection.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  status TEXT NOT NULL DEFAULT 'active',
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_wagered INTEGER NOT NULL DEFAULT 0,
  total_won INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,            -- grant | deduct | bet | win | refund
  game TEXT,
  amount INTEGER NOT NULL,       -- signed: + credit, - debit
  balance_after INTEGER NOT NULL,
  note TEXT,
  admin_id INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ledger_user ON ledger(user_id, id DESC);
CREATE INDEX IF NOT EXISTS ledger_kind ON ledger(kind, id DESC);

-- Open bets are persisted so they can be refunded if the server restarts mid-round.
CREATE TABLE IF NOT EXISTS open_bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  game TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  result TEXT NOT NULL,
  players INTEGER NOT NULL,
  wagered INTEGER NOT NULL,
  paid_out INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rounds_game ON rounds(game, id DESC);

CREATE TABLE IF NOT EXISTS game_config (
  game TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  rtp REAL NOT NULL,
  min_bet INTEGER NOT NULL,
  max_bet INTEGER NOT NULL,
  rake REAL NOT NULL DEFAULT 0
);
`;

const DEFAULT_CONFIG: Record<string, { rtp: number; min: number; max: number; rake: number }> = {
  aviator: { rtp: 97, min: 10, max: 10_000, rake: 0 },
  "color-prediction": { rtp: 95, min: 10, max: 10_000, rake: 0 },
  "number-wheel": { rtp: 95, min: 10, max: 10_000, rake: 0 },
  ludo: { rtp: 0, min: 10, max: 10_000, rake: 10 },
};

function open(): DatabaseSync {
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "predicators.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO game_config (game, enabled, rtp, min_bet, max_bet, rake) VALUES (?, 1, ?, ?, ?, ?)",
  );
  for (const [game, c] of Object.entries(DEFAULT_CONFIG)) insert.run(game, c.rtp, c.min, c.max, c.rake);
  return db;
}

const g = globalThis as unknown as { __predicatorsDb?: DatabaseSync };
export const db: DatabaseSync = (g.__predicatorsDb ??= open());

/** Run `fn` inside an immediate transaction (synchronous, so it is atomic in this process). */
export function tx<T>(fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export type Row = Record<string, unknown>;

export function all<T = Row>(sql: string, ...params: (string | number | null)[]): T[] {
  return db.prepare(sql).all(...params) as unknown as T[];
}

export function get<T = Row>(sql: string, ...params: (string | number | null)[]): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined;
}

export function run(sql: string, ...params: (string | number | null)[]) {
  return db.prepare(sql).run(...params);
}
