import { all, run } from "./db";

export interface RoundMeta {
  roundNo: number;
  seed: string;
  commit: string;
  rtp?: number;
}

export function recordRound(
  game: string,
  result: string,
  players: number,
  wagered: number,
  paidOut: number,
  meta?: RoundMeta,
) {
  const r = run(
    "INSERT INTO rounds (game, result, players, wagered, paid_out, created_at, round_no, seed, commit_hash, rtp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    game,
    result,
    players,
    wagered,
    paidOut,
    Date.now(),
    meta?.roundNo ?? null,
    meta?.seed ?? null,
    meta?.commit ?? null,
    meta?.rtp ?? null,
  );
  return Number(r.lastInsertRowid);
}

export function recentResults(game: string, limit: number): { id: number; result: string }[] {
  return all<{ id: number; result: string }>(
    "SELECT id, result FROM rounds WHERE game = ? ORDER BY id DESC LIMIT ?",
    game,
    limit,
  );
}
