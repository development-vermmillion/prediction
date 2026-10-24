import { AVIATOR_MAX_MULTIPLIER } from "./aviator";
import { WHEEL_SEGMENTS } from "./number-wheel";

/** Browser/Node-safe verification of a provably-fair round (WebCrypto). Mirrors src/server/fair.ts. */

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const enc = new TextEncoder();

export async function sha256Hex(text: string) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

export async function floatFromSeed(seed: string, game: string, roundNo: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(seed), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${game}:${roundNo}`)));
  return parseInt(mac.slice(0, 13), 16) / 2 ** 52;
}

export function outcomeFromFloat(game: string, f: number, rtp = 97): string {
  if (game === "aviator") {
    const point = rtp / 100 / (1 - f);
    const crash = !Number.isFinite(point) || point < 1 ? 1 : Math.min(AVIATOR_MAX_MULTIPLIER, Math.floor(point * 100) / 100);
    return `${crash.toFixed(2)}x`;
  }
  if (game === "color-prediction") return String(Math.floor(f * 10));
  return String(Math.floor(f * WHEEL_SEGMENTS));
}

export interface FairRound {
  game: string;
  roundNo: number | null;
  result: string;
  commit: string | null;
  seed: string | null;
  rtp: number | null;
}

/** True when the revealed seed matches the published commit AND reproduces the recorded result. */
export async function verifyRound(r: FairRound): Promise<boolean> {
  if (!r.seed || !r.commit || r.roundNo == null) return false;
  if ((await sha256Hex(r.seed)) !== r.commit) return false;
  const f = await floatFromSeed(r.seed, r.game, r.roundNo);
  return outcomeFromFloat(r.game, f, r.rtp ?? 97) === r.result;
}
