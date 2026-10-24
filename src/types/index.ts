export type GameId = "aviator" | "ludo" | "color-prediction" | "number-wheel";

export interface GameMeta {
  id: GameId;
  name: string;
  tagline: string;
  href: string;
  accent: string;
  maxMultiplier: string;
  players: number;
}

export type TxnKind = "bet" | "win" | "bonus" | "topup";

export interface Transaction {
  id: string;
  kind: TxnKind;
  game?: GameId | "system";
  label: string;
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
  at: number; // epoch ms
}

export type PlayerColor = "red" | "green" | "yellow" | "blue";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  coins: number;
  wins: number;
  favourite: GameId;
  hue: [string, string];
}

export interface LiveWin {
  id: string;
  name: string;
  game: string;
  detail: string;
  amount: number;
  hue: [string, string];
}

/* ---------- Admin / owner domain ---------- */

export type UserStatus = "active" | "suspended" | "banned";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  country: string;
  status: UserStatus;
  balance: number;
  wagered: number;
  won: number;
  joinedAt: number;
  lastSeenAt: number;
  favourite: GameId;
}

export interface AdminTransaction {
  id: string;
  userId: string;
  userName: string;
  kind: TxnKind;
  game: GameId | "system";
  amount: number;
  at: number;
}

export interface RoundRecord {
  id: string;
  game: GameId;
  result: string;
  players: number;
  wagered: number;
  paidOut: number;
  at: number;
}

export interface GameConfig {
  id: GameId;
  enabled: boolean;
  rtp: number; // return-to-player %, e.g. 97
  minBet: number;
  maxBet: number;
  roundSeconds: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  coins: number;
  active: boolean;
  claimed: number;
  endsAt: number;
}

export interface DailyStat {
  date: string;
  wagered: number;
  paidOut: number;
  newUsers: number;
  activeUsers: number;
}
