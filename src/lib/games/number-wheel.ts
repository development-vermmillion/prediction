export const WHEEL_SEGMENTS = 12;
export const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS;
export const NUMBER_PAYOUT = 11;
export const SPIN_MS = 5200;

export type OutsideBet = "even" | "odd" | "low" | "high";

export const OUTSIDE_BETS: { id: OutsideBet; label: string; hint: string; hex: string }[] = [
  { id: "even", label: "Even", hint: "2 4 6 8 10", hex: "#ff5c7c" },
  { id: "odd", label: "Odd", hint: "1 3 5 7 9 11", hex: "#7c8cff" },
  { id: "low", label: "0 – 5", hint: "Low half", hex: "#22d3ee" },
  { id: "high", label: "6 – 11", hint: "High half", hex: "#ffc83d" },
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

export interface WheelBets {
  numbers: Record<number, number>;
  outside: Partial<Record<OutsideBet, number>>;
}

export function totalStake(bets: WheelBets) {
  const n = Object.values(bets.numbers).reduce((a, b) => a + b, 0);
  const o = Object.values(bets.outside).reduce((a, b) => a + (b ?? 0), 0);
  return n + o;
}

/** Total coins returned for a result (stake included in winning payouts). */
export function settleWheel(bets: WheelBets, result: number) {
  let payout = 0;
  const stake = bets.numbers[result];
  if (stake) payout += stake * NUMBER_PAYOUT;
  for (const o of OUTSIDE_BETS) {
    const s = bets.outside[o.id];
    if (s && outsideWins(o.id, result)) payout += s * 2;
  }
  return payout;
}

export function spinResult(rand: () => number = Math.random) {
  return Math.floor(rand() * WHEEL_SEGMENTS);
}

/**
 * Compute the next absolute rotation so that segment `result` ends up under the
 * pointer (top, 0deg). Always spins forward at least `turns` full rotations.
 */
export function targetRotation(current: number, result: number, turns = 6) {
  const centre = result * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
  const base = (((-centre - jitter - current) % 360) + 360) % 360;
  return current + turns * 360 + base;
}
