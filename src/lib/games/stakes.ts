/**
 * Allowed stake sizes, shared by the UI and the server.
 * 10, 20, 50 and every multiple of 100 (100, 200, 300 …).
 */
export const STAKE_PRESETS = [10, 20, 50, 100, 500, 1000] as const;
export const ABSOLUTE_MAX_STAKE = 100_000;

export function isValidStake(n: unknown): n is number {
  if (typeof n !== "number" || !Number.isInteger(n) || n <= 0 || n > ABSOLUTE_MAX_STAKE) return false;
  return n === 10 || n === 20 || n === 50 || (n >= 100 && n % 100 === 0);
}

export function nextStake(n: number) {
  if (n < 20) return 20;
  if (n < 50) return 50;
  if (n < 100) return 100;
  return Math.min(ABSOLUTE_MAX_STAKE, Math.floor(n / 100) * 100 + 100);
}

export function prevStake(n: number) {
  if (n <= 10) return 10;
  if (n <= 20) return 10;
  if (n <= 50) return 20;
  if (n <= 100) return 50;
  return Math.ceil(n / 100) * 100 - 100;
}

/** Snap any number to the nearest allowed stake (rounding down, minimum 10). */
export function snapStake(n: number) {
  if (!Number.isFinite(n) || n < 15) return 10;
  if (n < 35) return 20;
  if (n < 75) return 50;
  return Math.min(ABSOLUTE_MAX_STAKE, Math.max(100, Math.round(n / 100) * 100));
}
