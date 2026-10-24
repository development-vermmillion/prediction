import type { GameMeta } from "@/types";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Predicators";
export const CURRENCY_NAME = "credits";

export const GAMES: GameMeta[] = [
  {
    id: "aviator",
    name: "Aviator",
    tagline: "One shared flight every minute — cash out in time",
    href: "/games/aviator",
    accent: "#ff2d55",
    maxMultiplier: "x1000",
  },
  {
    id: "color-prediction",
    name: "Color Prediction",
    tagline: "New shared round every 30 seconds",
    href: "/games/color-prediction",
    accent: "#a78bfa",
    maxMultiplier: "x9",
  },
  {
    id: "number-wheel",
    name: "Number Wheel",
    tagline: "One shared spin — match your number",
    href: "/games/number-wheel",
    accent: "#22d3ee",
    maxMultiplier: "x11",
  },
  {
    id: "ludo",
    name: "Ludo",
    tagline: "2 or 4 players · winner takes the pot",
    href: "/games/ludo",
    accent: "#ffc83d",
    maxMultiplier: "x3.6",
  },
];

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

export const GAME_LABEL: Record<string, string> = {
  aviator: "Aviator",
  ludo: "Ludo",
  "color-prediction": "Color Prediction",
  "number-wheel": "Number Wheel",
  system: "Owner",
};
