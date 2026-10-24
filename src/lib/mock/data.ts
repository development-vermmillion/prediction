import { mulberry32, pick } from "@/lib/utils";
import type {
  AdminTransaction,
  DailyStat,
  GameConfig,
  GameId,
  LeaderboardEntry,
  LiveWin,
  PlatformUser,
  Promotion,
  RoundRecord,
  UserStatus,
} from "@/types";

/** Fixed reference time so server and client render identical mock data. */
export const MOCK_NOW = 1_790_000_000_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const FIRST = ["Aarav", "Riya", "Kabir", "Meera", "Arjun", "Sana", "Vikram", "Isha", "Dev", "Naina", "Rohan", "Tara", "Kunal", "Anya", "Yash", "Pooja", "Neil", "Zoya", "Ishaan", "Diya"];
const LAST = ["Sharma", "Mehta", "Verma", "Kapoor", "Singh", "Patel", "Reddy", "Nair", "Joshi", "Khan"];
const COUNTRIES = ["India", "Nepal", "UAE", "UK", "Canada", "Singapore"];
const GAME_IDS: GameId[] = ["aviator", "ludo", "color-prediction", "number-wheel"];
const HUES: [string, string][] = [
  ["#ffc83d", "#ff7a00"],
  ["#22d3ee", "#2563eb"],
  ["#a78bfa", "#ec4899"],
  ["#22e58b", "#0e9f6e"],
  ["#ff5c9a", "#ff2d55"],
];

export const GAME_LABEL: Record<GameId | "system", string> = {
  aviator: "Aviator",
  ludo: "Ludo",
  "color-prediction": "Color Prediction",
  "number-wheel": "Number Wheel",
  system: "System",
};

/* ---------------- Players ---------------- */

export const USERS: PlatformUser[] = (() => {
  const rand = mulberry32(7);
  return Array.from({ length: 48 }, (_, i): PlatformUser => {
    const first = pick(rand, FIRST);
    const last = pick(rand, LAST);
    const r = rand();
    const status: UserStatus = r < 0.06 ? "banned" : r < 0.14 ? "suspended" : "active";
    const wagered = Math.round(2_000 + rand() * 180_000);
    const won = Math.round(wagered * (0.7 + rand() * 0.45));
    return {
      id: `usr_${1000 + i}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@mail.com`.toLowerCase(),
      country: pick(rand, COUNTRIES),
      status,
      balance: Math.round(rand() * 25_000),
      wagered,
      won,
      joinedAt: MOCK_NOW - Math.round(rand() * 240) * DAY,
      lastSeenAt: MOCK_NOW - Math.round(rand() * 72) * HOUR,
      favourite: pick(rand, GAME_IDS),
    };
  });
})();

/* ---------------- Leaderboard ---------------- */

export const LEADERBOARD: LeaderboardEntry[] = [...USERS]
  .filter((u) => u.status === "active")
  .sort((a, b) => b.won - a.won)
  .slice(0, 20)
  .map((u, i) => ({
    rank: i + 1,
    name: u.name,
    coins: u.won,
    wins: 40 + ((u.won / 97) | 0) % 400,
    favourite: u.favourite,
    hue: HUES[i % HUES.length],
  }));

/* ---------------- Live wins ticker ---------------- */

export const LIVE_WINS: LiveWin[] = (() => {
  const rand = mulberry32(21);
  const details: Record<string, () => string> = {
    Aviator: () => `cashed out at ${(1.5 + rand() * 18).toFixed(2)}x`,
    "Color Prediction": () => `hit ${pick(rand, ["Green", "Red", "Violet"])}`,
    "Number Wheel": () => `landed on ${Math.floor(rand() * 12)}`,
    Ludo: () => `${pick(rand, ["Red", "Blue", "Green", "Yellow"])} finished first`,
  };
  const games = Object.keys(details);
  return Array.from({ length: 10 }, (_, i) => {
    const game = games[i % games.length];
    return {
      id: `lw_${i}`,
      name: `${pick(rand, FIRST)} ${pick(rand, LAST).charAt(0)}.`,
      game,
      detail: details[game](),
      amount: Math.round((200 + rand() * 9_000) / 10) * 10,
      hue: HUES[i % HUES.length],
    };
  });
})();

/* ---------------- Admin: transactions ---------------- */

export const ADMIN_TRANSACTIONS: AdminTransaction[] = (() => {
  const rand = mulberry32(99);
  return Array.from({ length: 80 }, (_, i): AdminTransaction => {
    const user = pick(rand, USERS);
    const game = pick(rand, GAME_IDS);
    const r = rand();
    const kind = r < 0.5 ? "bet" : r < 0.88 ? "win" : r < 0.95 ? "bonus" : "topup";
    const base = Math.round((20 + rand() * 1_500) / 10) * 10;
    return {
      id: `txn_${5000 + i}`,
      userId: user.id,
      userName: user.name,
      kind,
      game: kind === "bonus" || kind === "topup" ? "system" : game,
      amount: kind === "bet" ? -base : base,
      at: MOCK_NOW - i * 11 * 60_000,
    };
  });
})();

/* ---------------- Admin: rounds ---------------- */

export const ROUNDS: RoundRecord[] = (() => {
  const rand = mulberry32(314);
  return Array.from({ length: 60 }, (_, i): RoundRecord => {
    const game = GAME_IDS[i % GAME_IDS.length];
    const wagered = Math.round(8_000 + rand() * 90_000);
    const result =
      game === "aviator"
        ? `${(1 + Math.pow(rand(), 2.4) * 14).toFixed(2)}x`
        : game === "color-prediction"
          ? `${Math.floor(rand() * 10)}`
          : game === "number-wheel"
            ? `${Math.floor(rand() * 12)}`
            : pick(rand, ["Red", "Green", "Blue", "Yellow"]);
    return {
      id: `rnd_${9000 + i}`,
      game,
      result,
      players: Math.round(20 + rand() * 600),
      wagered,
      paidOut: Math.round(wagered * (0.55 + rand() * 0.6)),
      at: MOCK_NOW - i * 7 * 60_000,
    };
  });
})();

/* ---------------- Admin: configuration ---------------- */

export const GAME_CONFIGS: GameConfig[] = [
  { id: "aviator", enabled: true, rtp: 97, minBet: 10, maxBet: 10_000, roundSeconds: 12 },
  { id: "color-prediction", enabled: true, rtp: 96, minBet: 10, maxBet: 5_000, roundSeconds: 30 },
  { id: "number-wheel", enabled: true, rtp: 95, minBet: 10, maxBet: 5_000, roundSeconds: 20 },
  { id: "ludo", enabled: true, rtp: 96, minBet: 50, maxBet: 8_000, roundSeconds: 60 },
];

export const PROMOTIONS: Promotion[] = [
  {
    id: "promo_welcome",
    title: "Welcome pack",
    description: "2,450 free coins for every new player.",
    coins: 2450,
    active: true,
    claimed: 1840,
    endsAt: MOCK_NOW + 60 * DAY,
  },
  {
    id: "promo_daily",
    title: "Daily streak bonus",
    description: "Bonus grows every day you claim, up to day 7.",
    coins: 200,
    active: true,
    claimed: 9120,
    endsAt: MOCK_NOW + 365 * DAY,
  },
  {
    id: "promo_weekend",
    title: "Weekend boost",
    description: "Double leaderboard points on Saturday and Sunday.",
    coins: 500,
    active: false,
    claimed: 612,
    endsAt: MOCK_NOW + 5 * DAY,
  },
];

/* ---------------- Admin: 14-day stats ---------------- */

export const DAILY_STATS: DailyStat[] = (() => {
  const rand = mulberry32(2026);
  return Array.from({ length: 14 }, (_, i): DailyStat => {
    const d = new Date(MOCK_NOW - (13 - i) * DAY);
    const wagered = Math.round(380_000 + rand() * 260_000 + i * 12_000);
    return {
      date: d.toLocaleDateString("en", { day: "2-digit", month: "short" }),
      wagered,
      paidOut: Math.round(wagered * (0.9 + rand() * 0.06)),
      newUsers: Math.round(40 + rand() * 90),
      activeUsers: Math.round(900 + rand() * 700 + i * 30),
    };
  });
})();
