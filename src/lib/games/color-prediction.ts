export type ColorKey = "green" | "violet" | "red";

export const COLOR_ROUND_MS = 30_000;
/** Betting closes this long before the round ends. */
export const COLOR_LOCK_MS = 5_000;

export const COLOR_META: Record<ColorKey, { label: string; hex: string; dark: string; odds: number }> = {
  green: { label: "Green", hex: "#22e58b", dark: "#05633c", odds: 2 },
  violet: { label: "Violet", hex: "#a78bfa", dark: "#3b1d96", odds: 4.5 },
  red: { label: "Red", hex: "#ff2d55", dark: "#7a0020", odds: 2 },
};

export const NUMBER_ODDS = 9;
/** Red/Green bets pay this when the number is 0 or 5 (those also show violet). */
export const MIXED_ODDS = 1.5;

/** Colours a number shows. 0 = red+violet, 5 = green+violet. */
export function colorsOf(n: number): ColorKey[] {
  if (n === 0) return ["red", "violet"];
  if (n === 5) return ["green", "violet"];
  return n % 2 === 0 ? ["red"] : ["green"];
}

export function primaryColor(n: number): ColorKey {
  return colorsOf(n)[0];
}

export type ColorBet =
  | { kind: "color"; value: ColorKey; amount: number }
  | { kind: "number"; value: number; amount: number };

/** Total coins returned for a bet (0 when lost). */
export function settleColorBet(bet: ColorBet, result: number) {
  if (bet.kind === "number") return bet.value === result ? bet.amount * NUMBER_ODDS : 0;
  const colors = colorsOf(result);
  if (!colors.includes(bet.value)) return 0;
  if (bet.value === "violet") return Math.floor(bet.amount * COLOR_META.violet.odds);
  const mixed = colors.length === 2;
  return Math.floor(bet.amount * (mixed ? MIXED_ODDS : COLOR_META[bet.value].odds));
}

export function isColorBet(b: unknown): b is ColorBet {
  if (!b || typeof b !== "object") return false;
  const x = b as { kind?: unknown; value?: unknown };
  if (x.kind === "color") return x.value === "green" || x.value === "violet" || x.value === "red";
  if (x.kind === "number") return Number.isInteger(x.value) && (x.value as number) >= 0 && (x.value as number) <= 9;
  return false;
}
