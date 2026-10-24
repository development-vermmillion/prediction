export type GameId = "aviator" | "ludo" | "color-prediction" | "number-wheel";

export interface GameMeta {
  id: GameId;
  name: string;
  tagline: string;
  href: string;
  accent: string;
  maxMultiplier: string;
}

export type PlayerColor = "red" | "green" | "yellow" | "blue";

export type TxnKind = "grant" | "deduct" | "bet" | "win" | "refund";

export interface Transaction {
  id: number;
  kind: TxnKind;
  game: string | null;
  amount: number; // signed
  balanceAfter: number;
  note: string | null;
  at: number;
}

export type UserStatus = "active" | "suspended" | "banned";

export interface PlatformUser {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  balance: number;
  wagered: number;
  won: number;
  joinedAt: number;
  lastSeenAt: number;
}

export interface AdminLedgerEntry {
  id: number;
  userId: number;
  userName: string;
  kind: TxnKind;
  game: string | null;
  amount: number;
  balanceAfter: number;
  note: string | null;
  adminName: string | null;
  at: number;
}

export interface RoundRecord {
  id: number;
  game: string;
  result: string;
  players: number;
  wagered: number;
  paidOut: number;
  at: number;
}

export interface GameConfig {
  game: GameId;
  enabled: boolean;
  rtp: number;
  minBet: number;
  maxBet: number;
  rake: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  won: number;
  wagered: number;
}

export interface LiveWin {
  id: string;
  name: string;
  game: string;
  detail: string;
  amount: number;
  at: number;
}

export interface DailyStat {
  date: string;
  wagered: number;
  paidOut: number;
  newUsers: number;
}
