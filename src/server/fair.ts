import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Provably-fair rounds (commit–reveal).
 *
 * Before betting opens the server publishes `commit = SHA-256(seed)`. The round's outcome is a pure
 * function of the seed, so it is fixed before anyone bets and cannot be changed afterwards. After the
 * round the seed is revealed so anyone can check the hash and recompute the outcome (see /fairness).
 */
export const newSeed = () => randomBytes(32).toString("hex");

export const commitOf = (seed: string) => createHash("sha256").update(seed).digest("hex");

/** Uniform float in [0, 1) derived from the seed: first 52 bits of HMAC-SHA256(seed, "game:round"). */
export function floatFromSeed(seed: string, game: string, roundNo: number) {
  const hex = createHmac("sha256", seed).update(`${game}:${roundNo}`).digest("hex").slice(0, 13);
  return parseInt(hex, 16) / 2 ** 52;
}
