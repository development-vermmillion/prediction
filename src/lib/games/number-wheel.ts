export const WHEEL_SEGMENTS = 12;
export const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS;
export const NUMBER_PAYOUT = 11;

/** Cycle: betting window → spin → result display. */
export const WHEEL_BETTING_MS = 20_000;
export const WHEEL_SPIN_MS = 6_000;
export const WHEEL_RESULT_MS = 4_000;

export type OutsideBet = "even" | "odd" | "low" | "high";

/** `odds` is the total multiplier returned on a win (stake included). */
export const OUTSIDE_BETS: { id: OutsideBet; label: string; hint: string; hex: string; odds: number }[] = [
  { id: "even", label: "Even", hint: "2 4 6 8 10", hex: "#ff5c7c", odds: 2.3 },
  { id: "odd", label: "Odd", hint: "1 3 5 7 9 11", hex: "#7c8cff", odds: 1.9 },
  { id: "low", label: "0 – 5", hint: "Low half", hex: "#22d3ee", odds: 1.9 },
  { id: "high", label: "6 – 11", hint: "High half", hex: "#ffc83d", odds: 1.9 },
];

export function segmentTone(n: number): "green" | "red" | "navy" {
  if (n === 0) return "green";
  return n % 2 === 0 ? "red" : "navy";
}

export function outsideWins(bet: OutsideBet, result: number) {
  switch (bet) {
    case "even":
      return result !== 0 && result % 2 === 0;
    case "odd":
      return result % 2 === 1;
    case "low":
      return result <= 5;
    case "high":
      return result >= 6;
  }
}

export type WheelBet =
  | { kind: "number"; value: number; amount: number }
  | { kind: "outside"; value: OutsideBet; amount: number };

export function settleWheelBet(bet: WheelBet, result: number) {
  if (bet.kind === "number") return bet.value === result ? bet.amount * NUMBER_PAYOUT : 0;
  if (!outsideWins(bet.value, result)) return 0;
  const odds = OUTSIDE_BETS.find((o) => o.id === bet.value)!.odds;
  return Math.floor(bet.amount * odds);
}

export function isWheelBet(b: unknown): b is WheelBet {
  if (!b || typeof b !== "object") return false;
  const x = b as { kind?: unknown; value?: unknown };
  if (x.kind === "number") return Number.isInteger(x.value) && (x.value as number) >= 0 && (x.value as number) < WHEEL_SEGMENTS;
  if (x.kind === "outside") return OUTSIDE_BETS.some((o) => o.id === x.value);
  return false;
}

/**
 * Absolute rotation (degrees) that puts segment `result` under the pointer at the top.
 * Always spins forward `turns` full rotations from `current`.
 */
export function targetRotation(current: number, result: number, turns = 6, jitter = 0) {
  const centre = result * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const base = (((-centre - jitter - current) % 360) + 360) % 360;
  return current + turns * 360 + base;
}
