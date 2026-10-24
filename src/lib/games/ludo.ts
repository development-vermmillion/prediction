import type { PlayerColor } from "@/types";

export const BOARD_SIZE = 15;
export const FINISH_STEP = 56;
export const WIN_ODDS = 3.8;

export const PLAYER_ORDER: PlayerColor[] = ["red", "green", "blue", "yellow"];

export const PLAYER_META: Record<PlayerColor, { label: string; hex: string; dark: string; start: number }> = {
  red: { label: "Red", hex: "#ff2d55", dark: "#7a0020", start: 0 },
  green: { label: "Green", hex: "#22e58b", dark: "#05633c", start: 13 },
  blue: { label: "Blue", hex: "#3b82f6", dark: "#12296b", start: 26 },
  yellow: { label: "Yellow", hex: "#ffc83d", dark: "#8a5200", start: 39 },
};

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

/** Where tokens sit in their yard before the race starts. */
export const YARD_SLOTS: Record<PlayerColor, [number, number][]> = {
  red: [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]],
  green: [[10.5, 1.5], [12.5, 1.5], [10.5, 3.5], [12.5, 3.5]],
  blue: [[10.5, 10.5], [12.5, 10.5], [10.5, 12.5], [12.5, 12.5]],
  yellow: [[1.5, 10.5], [3.5, 10.5], [1.5, 12.5], [3.5, 12.5]],
};

/** Board cell for a lead token at `progress` (-1 = still in yard). Centre-based coords. */
export function cellFor(color: PlayerColor, progress: number): [number, number] {
  if (progress < 0) return YARD_SLOTS[color][0];
  if (progress <= 50) {
    const [c, r] = TRACK[(PLAYER_META[color].start + progress) % 52];
    return [c + 0.5, r + 0.5];
  }
  const idx = Math.min(5, progress - 51);
  const [c, r] = HOME_COLUMN[color][idx];
  return [c + 0.5, r + 0.5];
}

export interface RaceState {
  progress: Record<PlayerColor, number>;
  turn: number; // index into PLAYER_ORDER
  lastRoll: number | null;
  lastPlayer: PlayerColor | null;
  winner: PlayerColor | null;
  sixStreak: number;
  log: string[];
}

export function newRace(): RaceState {
  return {
    progress: { red: -1, green: -1, blue: -1, yellow: -1 },
    turn: 0,
    lastRoll: null,
    lastPlayer: null,
    winner: null,
    sixStreak: 0,
    log: [],
  };
}

export function rollDie(rand: () => number = Math.random) {
  return 1 + Math.floor(rand() * 6);
}

/** Advance one dice turn. Pure: returns the next state. */
export function stepRace(state: RaceState, roll: number): RaceState {
  if (state.winner) return state;
  const color = PLAYER_ORDER[state.turn];
  const progress = { ...state.progress };
  let msg = `${PLAYER_META[color].label} rolled ${roll}`;

  if (progress[color] < 0) {
    if (roll === 6) {
      progress[color] = 0;
      msg += " — token enters the track";
    } else {
      msg += " — needs a 6 to start";
    }
  } else if (progress[color] + roll <= FINISH_STEP) {
    progress[color] += roll;
  } else {
    msg += " — overshoot, stays put";
  }

  const winner = progress[color] === FINISH_STEP ? color : null;
  const extraTurn = roll === 6 && state.sixStreak < 2 && !winner;
  return {
    progress,
    turn: extraTurn ? state.turn : (state.turn + 1) % PLAYER_ORDER.length,
    lastRoll: roll,
    lastPlayer: color,
    winner,
    sixStreak: extraTurn ? state.sixStreak + 1 : 0,
    log: [msg, ...state.log].slice(0, 6),
  };
}

export function progressPct(p: number) {
  return Math.max(0, Math.min(100, ((p + 1) / (FINISH_STEP + 1)) * 100));
}

export function tokensHome(p: number) {
  return p >= FINISH_STEP ? 1 : 0;
}
