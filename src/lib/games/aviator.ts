/**
 * Aviator engine (pure functions).
 *
 * NOTE: this runs in the browser for the demo. In production the crash point
 * must be generated server-side (provably fair) and streamed to clients.
 */

export const AVIATOR_RTP = 0.97;
/** Growth constant: multiplier = e^(k * ms). Reaches ~2x after ~4.3s. */
const GROWTH = 0.00016;

export function generateCrashPoint(rand: () => number = Math.random, rtp = AVIATOR_RTP) {
  const r = rand();
  // ~3% instant crash at 1.00x, otherwise heavy-tailed distribution.
  if (r < 1 - rtp) return 1;
  const point = (rtp / (1 - r)) * 1; // classic crash distribution
  return Math.min(1000, Math.max(1, Math.floor(point * 100) / 100));
}

export function multiplierAt(elapsedMs: number) {
  return Math.max(1, Math.exp(GROWTH * elapsedMs));
}

/** Milliseconds until the multiplier reaches `target`. */
export function timeToMultiplier(target: number) {
  return Math.log(target) / GROWTH;
}

export function multiplierTone(m: number): "low" | "mid" | "high" {
  if (m < 2) return "low";
  if (m < 10) return "mid";
  return "high";
}

export const TONE_COLORS = {
  low: "#38bdf8",
  mid: "#a78bfa",
  high: "#ff5c9a",
} as const;

export interface BotBet {
  id: string;
  name: string;
  amount: number;
  target: number;
  hue: [string, string];
}

const BOT_NAMES = ["Riya", "Kabir", "Meera", "Arjun", "Sana", "Vikram", "Isha", "Dev", "Naina", "Rohan"];
const HUES: [string, string][] = [
  ["#ffc83d", "#ff7a00"],
  ["#22d3ee", "#2563eb"],
  ["#a78bfa", "#ec4899"],
  ["#22e58b", "#0e9f6e"],
];

export function generateBotBets(rand: () => number = Math.random, count = 8): BotBet[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${i}-${Math.floor(rand() * 1e6)}`,
    name: BOT_NAMES[Math.floor(rand() * BOT_NAMES.length)],
    amount: [50, 100, 200, 500, 1000][Math.floor(rand() * 5)],
    target: Math.round((1.1 + Math.pow(rand(), 2.2) * 9) * 100) / 100,
    hue: HUES[Math.floor(rand() * HUES.length)],
  }));
}

/** Sample points used to draw the flight curve. */
export interface CurvePoint {
  t: number;
  m: number;
}

export function curvePath(points: CurvePoint[], width: number, height: number, pad = 60) {
  if (points.length === 0) return { line: "", area: "", head: { x: pad, y: height - pad, angle: 0 } };
  const xs = (t: number) => pad + (1 - Math.exp(-t / 7000)) * (width - pad * 2);
  const ys = (m: number) => height - pad - (1 - 1 / Math.pow(m, 0.62)) * (height - pad * 2);
  const pts = points.map((p) => ({ x: xs(p.t), y: ys(p.m) }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const first = pts[0];
  const last = pts[pts.length - 1];
  const prev = pts[Math.max(0, pts.length - 6)];
  const area = `${line} L${last.x.toFixed(1)} ${height} L${first.x.toFixed(1)} ${height} Z`;
  const angle = (Math.atan2(last.y - prev.y, last.x - prev.x) * 180) / Math.PI;
  return { line, area, head: { x: last.x, y: last.y, angle } };
}
