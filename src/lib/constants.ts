import type { GameMeta } from "@/types";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Predicators";
export const CURRENCY_NAME = "coins";
export const STARTING_BALANCE = 2450;
export const DAILY_BONUS = 200;
export const STAKE_PRESETS = [10, 50, 100, 500] as const;

/** Demo owner credentials. Replace with a real auth provider before shipping. */
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@predicators.com";
export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";

export const GAMES: GameMeta[] = [
  {
    id: "aviator",
    name: "Aviator",
    tagline: "Cash out before the plane flies away",
    href: "/games/aviator",
    accent: "#ff2d55",
    maxMultiplier: "x1000",
    players: 12408,
  },
  {
    id: "color-prediction",
    name: "Color Prediction",
    tagline: "A new round every 30 seconds",
    href: "/games/color-prediction",
    accent: "#a78bfa",
    maxMultiplier: "x9",
    players: 8942,
  },
  {
    id: "number-wheel",
    name: "Number Wheel",
    tagline: "Spin the wheel, match your number",
    href: "/games/number-wheel",
    accent: "#22d3ee",
    maxMultiplier: "x11",
    players: 3120,
  },
  {
    id: "ludo",
    name: "Ludo",
    tagline: "Predict who finishes first",
    href: "/games/ludo",
    accent: "#ffc83d",
    maxMultiplier: "x3.8",
    players: 7214,
  },
];

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rewards", label: "Rewards" },
] as const;
