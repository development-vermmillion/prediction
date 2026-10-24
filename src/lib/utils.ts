import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const numberFormat = new Intl.NumberFormat("en-IN");

export function formatCoins(value: number) {
  return numberFormat.format(Math.round(value));
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatMultiplier(value: number) {
  return `${value.toFixed(2)}x`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function timeAgo(at: number, now = Date.now()) {
  const s = Math.max(1, Math.round((now - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function formatDate(at: number) {
  return new Date(at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Small deterministic PRNG so server and client render identical mock data. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
