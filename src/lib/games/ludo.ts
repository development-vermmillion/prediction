import type { PlayerColor } from "@/types";

/**
 * Ludo rules shared by the server (authoritative) and the client (rendering).
 *
 * - 2 players sit opposite each other (red + blue); 4 players use all colours.
 * - A token needs a 6 to leave the yard. A 6, a capture or reaching home gives another turn.
 *   Three sixes in a row forfeit the move.
 * - Landing on an opponent on a non-safe track cell sends it back to the yard.
 *   Start squares and the star cell 8 steps after each start are safe.
 * - A token must finish with an exact roll. First player to bring every token home wins.
 */

export const BOARD_SIZE = 15;
export const TOKENS_PER_PLAYER = 4;
/** Progress value of a token that has reached home. */
export const FINISH_STEP = 56;
/** Last progress value that is still on the shared track (51..56 is the home column). */
export const LAST_TRACK_STEP = 50;
export const TURN_MS = 20_000;
/** A player who lets this many turns time out in a row forfeits the game. */
export const MAX_IDLE_TURNS = 3;

export type LudoSize = 2 | 4;

export const PLAYER_ORDER: PlayerColor[] = ["red", "green", "blue", "yellow"];

export const PLAYER_META: Record<PlayerColor, { label: string; hex: string; dark: string; start: number }> = {
  red: { label: "Red", hex: "#ff2d55", dark: "#7a0020", start: 0 },
  green: { label: "Green", hex: "#22e58b", dark: "#05633c", start: 13 },
  blue: { label: "Blue", hex: "#3b82f6", dark: "#12296b", start: 26 },
  yellow: { label: "Yellow", hex: "#ffc83d", dark: "#8a5200", start: 39 },
};

export const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export function seatColors(size: LudoSize): PlayerColor[] {
  return size === 2 ? ["red", "blue"] : [...PLAYER_ORDER];
}

/** The 52 shared track cells (col, row), clockwise starting at Red's start square. */
export const TRACK: [number, number][] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14], [6, 14],
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6],
];

/** Coloured home-column cells (6 per player, ending at the centre). */
export const HOME_COLUMN: Record<PlayerColor, [number, number][]> = {
  red: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
};

/** Where tokens sit in their yard (centre coordinates). */
export const YARD_SLOTS: Record<PlayerColor, [number, number][]> = {
  red: [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]],
  green: [[10.5, 1.5], [12.5, 1.5], [10.5, 3.5], [12.5, 3.5]],
  blue: [[10.5, 10.5], [12.5, 10.5], [10.5, 12.5], [12.5, 12.5]],
  yellow: [[1.5, 10.5], [3.5, 10.5], [1.5, 12.5], [3.5, 12.5]],
};

/** Centre-based board coordinates of a token. */
export function cellFor(color: PlayerColor, progress: number, tokenIndex: number): [number, number] {
  if (progress < 0) return YARD_SLOTS[color][tokenIndex];
  if (progress <= LAST_TRACK_STEP) {
    const [c, r] = TRACK[(PLAYER_META[color].start + progress) % 52];
    return [c + 0.5, r + 0.5];
  }
  const [c, r] = HOME_COLUMN[color][Math.min(5, progress - 51)];
  return [c + 0.5, r + 0.5];
}

/** Index (0..51) of the shared-track cell a token occupies, or null when off the track. */
export function trackIndex(color: PlayerColor, progress: number): number | null {
  if (progress < 0 || progress > LAST_TRACK_STEP) return null;
  return (PLAYER_META[color].start + progress) % 52;
}

/* ---------------------------------------------------------------- */
/* Game state                                                        */
/* ---------------------------------------------------------------- */

export interface LudoGameState {
  size: LudoSize;
  colors: PlayerColor[];
  tokens: Record<PlayerColor, number[]>;
  turn: PlayerColor;
  phase: "roll" | "move";
  roll: number | null;
  /** Token indices that can legally move after the current roll. */
  legal: number[];
  sixStreak: number;
  eliminated: PlayerColor[];
  winner: PlayerColor | null;
  log: string[];
}

export function newGame(size: LudoSize): LudoGameState {
  const colors = seatColors(size);
  const tokens = {} as Record<PlayerColor, number[]>;
  for (const c of PLAYER_ORDER) tokens[c] = Array(TOKENS_PER_PLAYER).fill(-1);
  return {
    size,
    colors,
    tokens,
    turn: colors[0],
    phase: "roll",
    roll: null,
    legal: [],
    sixStreak: 0,
    eliminated: [],
    winner: null,
    log: [],
  };
}

export function legalMoves(tokens: number[], roll: number): number[] {
  const out: number[] = [];
  tokens.forEach((p, i) => {
    if (p === FINISH_STEP) return;
    if (p === -1) {
      if (roll === 6) out.push(i);
    } else if (p + roll <= FINISH_STEP) out.push(i);
  });
  return out;
}

export function activeColors(g: LudoGameState) {
  return g.colors.filter((c) => !g.eliminated.includes(c));
}

export function nextColor(g: LudoGameState): PlayerColor {
  const active = activeColors(g);
  const i = active.indexOf(g.turn);
  // If the current player was just eliminated they are no longer in `active`; keep order from colors.
  if (i === -1) {
    const order = g.colors;
    let idx = order.indexOf(g.turn);
    for (let n = 0; n < order.length; n++) {
      idx = (idx + 1) % order.length;
      if (active.includes(order[idx])) return order[idx];
    }
    return active[0];
  }
  return active[(i + 1) % active.length];
}

export interface MoveResult {
  captured: { color: PlayerColor; token: number }[];
  reachedHome: boolean;
  extraTurn: boolean;
}

/** Apply a legal move in place. */
export function applyMove(g: LudoGameState, tokenIndex: number): MoveResult {
  const color = g.turn;
  const roll = g.roll as number;
  const tokens = g.tokens[color];
  const from = tokens[tokenIndex];
  const to = from === -1 ? 0 : from + roll;
  tokens[tokenIndex] = to;

  const captured: MoveResult["captured"] = [];
  const idx = trackIndex(color, to);
  if (idx !== null && !SAFE_CELLS.has(idx)) {
    for (const other of g.colors) {
      if (other === color) continue;
      g.tokens[other].forEach((p, i) => {
        if (trackIndex(other, p) === idx) {
          g.tokens[other][i] = -1;
          captured.push({ color: other, token: i });
        }
      });
    }
  }
  const reachedHome = to === FINISH_STEP;
  const extraTurn = roll === 6 || captured.length > 0 || reachedHome;
  return { captured, reachedHome, extraTurn };
}

export function hasWon(g: LudoGameState, color: PlayerColor) {
  return g.tokens[color].every((p) => p === FINISH_STEP);
}

export function progressTotal(tokens: number[]) {
  return tokens.reduce((a, p) => a + (p + 1), 0);
}

/** Pick a sensible token for auto-play: prefer capture, then entering, then furthest along. */
export function autoPick(g: LudoGameState): number {
  const color = g.turn;
  const roll = g.roll as number;
  let best = g.legal[0];
  let bestScore = -Infinity;
  for (const i of g.legal) {
    const p = g.tokens[color][i];
    const to = p === -1 ? 0 : p + roll;
    let score = to;
    const idx = trackIndex(color, to);
    if (idx !== null && !SAFE_CELLS.has(idx)) {
      for (const other of g.colors) {
        if (other !== color && g.tokens[other].some((q) => trackIndex(other, q) === idx)) score += 100;
      }
    }
    if (to === FINISH_STEP) score += 60;
    if (p === -1) score += 40;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
