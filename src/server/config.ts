import { all, get, run } from "./db";
import { isValidStake } from "@/lib/games/stakes";

export interface GameConfigRow {
  game: string;
  enabled: boolean;
  rtp: number;
  minBet: number;
  maxBet: number;
  rake: number;
}

interface Raw {
  game: string;
  enabled: number;
  rtp: number;
  min_bet: number;
  max_bet: number;
  rake: number;
}

const map = (r: Raw): GameConfigRow => ({
  game: r.game,
  enabled: !!r.enabled,
  rtp: r.rtp,
  minBet: r.min_bet,
  maxBet: r.max_bet,
  rake: r.rake,
});

export function getConfig(game: string): GameConfigRow {
  const r = get<Raw>("SELECT * FROM game_config WHERE game = ?", game);
  if (!r) throw new Error(`Unknown game ${game}`);
  return map(r);
}

export function allConfigs(): GameConfigRow[] {
  return all<Raw>("SELECT * FROM game_config ORDER BY rowid").map(map);
}

export function updateConfig(game: string, patch: Partial<Omit<GameConfigRow, "game">>) {
  const cur = getConfig(game);
  const next = { ...cur, ...patch };
  run(
    "UPDATE game_config SET enabled = ?, rtp = ?, min_bet = ?, max_bet = ?, rake = ? WHERE game = ?",
    next.enabled ? 1 : 0,
    next.rtp,
    next.minBet,
    next.maxBet,
    next.rake,
    game,
  );
  return getConfig(game);
}

/** Returns an error message, or null when the stake is acceptable for the game. */
export function checkStake(game: string, amount: unknown): string | null {
  const cfg = getConfig(game);
  if (!cfg.enabled) return "This game is currently closed";
  if (!isValidStake(amount)) return "Stake must be 10, 20, 50 or a multiple of 100";
  if (amount < cfg.minBet) return `Minimum stake is ${cfg.minBet}`;
  if (amount > cfg.maxBet) return `Maximum stake is ${cfg.maxBet}`;
  return null;
}
