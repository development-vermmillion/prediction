import { mulberry32 } from "@/lib/utils";

export type ColorKey = "green" | "violet" | "red";

export const ROUND_MS = 30_000;
export const LOCK_MS = 5_000;

export const COLOR_META: Record<ColorKey, { label: string; hex: string; dark: string; odds: number }> = {
  green: { label: "Green", hex: "#22e58b", dark: "#05633c", odds: 2 },
  violet: { label: "Violet", hex: "#a78bfa", dark: "#3b1d96", odds: 4.5 },
  red: { label: "Red", hex: "#ff2d55", dark: "#7a0020", odds: 2 },
};

export const NUMBER_ODDS = 9;

/** Colours that a number shows. 0 = red+violet, 5 = green+violet. */
export function colorsOf(n: number): ColorKey[] {
  if (n === 0) return ["red", "violet"];
  if (n === 5) return ["green", "violet"];
  return n % 2 === 0 ? ["red"] : ["green"];
}

export function primaryColor(n: number): ColorKey {
  return colorsOf(n)[0];
}

export function roundIndexAt(now: number) {
  return Math.floor(now / ROUND_MS);
}

/** Deterministic result per round so every client sees the same outcome. */
export function resultFor(roundIndex: number) {
  const rand = mulberry32(roundIndex * 2654435761);
  rand();
  return Math.floor(rand() * 10);
}

export function periodId(roundIndex: number) {
  const d = new Date(roundIndex * ROUND_MS);
  const day = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const slot = Math.floor(((roundIndex * ROUND_MS) % 86_400_000) / ROUND_MS);
  return `${day}${String(slot).padStart(4, "0")}`;
}

export type ColorBet =
  | { kind: "color"; value: ColorKey; amount: number; roundIndex: number }
  | { kind: "number"; value: number; amount: number; roundIndex: number };

/** Returns payout (total coins returned, 0 when lost). */
export function settleBet(bet: ColorBet, result: number) {
  if (bet.kind === "number") return bet.value === result ? bet.amount * NUMBER_ODDS : 0;
  const colors = colorsOf(result);
  if (!colors.includes(bet.value)) return 0;
  if (bet.value === "violet") return bet.amount * COLOR_META.violet.odds;
  // Mixed numbers (0 / 5) pay 1.5x on the primary colour.
  const mixed = colors.length === 2;
  return bet.amount * (mixed ? 1.5 : COLOR_META[bet.value].odds);
}

export function recentResults(currentIndex: number, count = 15) {
  return Array.from({ length: count }, (_, i) => {
    const idx = currentIndex - 1 - i;
    return { roundIndex: idx, period: periodId(idx), result: resultFor(idx) };
  });
}
