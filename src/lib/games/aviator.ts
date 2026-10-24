/**
 * Aviator maths. Shared by the server (authoritative) and the client (animation only).
 * The crash point is generated on the server and is never sent to clients before the crash.
 */

/** Betting window between flights (the "1 minute break"). */
export const AVIATOR_BETTING_MS = 60_000;
/** How long the "flew away" screen stays up before the next betting window. */
export const AVIATOR_CRASH_PAUSE_MS = 5_000;
export const AVIATOR_MAX_MULTIPLIER = 1000;

/** Growth constant: multiplier = e^(k * ms). Reaches ~2x after ~4.3s. */
const GROWTH = 0.00016;

/** Classic crash distribution: P(crash >= x) = rtp / x. `rand` must return [0, 1). */
export function generateCrashPoint(rand: () => number, rtp: number) {
  const r = rand();
  const point = rtp / (1 - r);
  if (!Number.isFinite(point) || point < 1) return 1;
  return Math.min(AVIATOR_MAX_MULTIPLIER, Math.floor(point * 100) / 100);
}

export function multiplierAt(elapsedMs: number) {
  return Math.max(1, Math.exp(GROWTH * Math.max(0, elapsedMs)));
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
