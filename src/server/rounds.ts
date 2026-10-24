import { all, run } from "./db";

export function recordRound(game: string, result: string, players: number, wagered: number, paidOut: number) {
  const r = run(
    "INSERT INTO rounds (game, result, players, wagered, paid_out, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    game,
    result,
    players,
    wagered,
    paidOut,
    Date.now(),
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
