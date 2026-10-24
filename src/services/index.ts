/**
 * Data access layer.
 *
 * Everything the UI needs from a backend goes through here. Today these read
 * seeded mock data; swap the bodies for `fetch()` calls to a real API without
 * touching any component.
 */
import {
  ADMIN_TRANSACTIONS,
  DAILY_STATS,
  GAME_CONFIGS,
  LEADERBOARD,
  LIVE_WINS,
  PROMOTIONS,
  ROUNDS,
  USERS,
} from "@/lib/mock/data";
import type {
  AdminTransaction,
  DailyStat,
  GameConfig,
  LeaderboardEntry,
  LiveWin,
  PlatformUser,
  Promotion,
  RoundRecord,
} from "@/types";

export const playerService = {
  leaderboard: (): LeaderboardEntry[] => LEADERBOARD,
  liveWins: (): LiveWin[] => LIVE_WINS,
};

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  wagered: number;
  paidOut: number;
  ggr: number;
  rtp: number;
  roundsToday: number;
}

export const adminService = {
  overview(): AdminOverview {
    const wagered = DAILY_STATS.reduce((a, d) => a + d.wagered, 0);
    const paidOut = DAILY_STATS.reduce((a, d) => a + d.paidOut, 0);
    return {
      totalUsers: USERS.length,
      activeUsers: USERS.filter((u) => u.status === "active").length,
      wagered,
      paidOut,
      ggr: wagered - paidOut,
      rtp: (paidOut / wagered) * 100,
      roundsToday: ROUNDS.length,
    };
  },
  dailyStats: (): DailyStat[] => DAILY_STATS,
  users: (): PlatformUser[] => USERS,
  transactions: (): AdminTransaction[] => ADMIN_TRANSACTIONS,
  rounds: (): RoundRecord[] => ROUNDS,
  gameConfigs: (): GameConfig[] => GAME_CONFIGS,
  promotions: (): Promotion[] => PROMOTIONS,
};
