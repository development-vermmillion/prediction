import { getIo } from "@/server/bus";
import { all, get } from "@/server/db";
import { json, requireAdmin, route } from "@/server/http";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

export const GET = route(async () => {
  await requireAdmin();
  const now = Date.now();

  const users = get<{ total: number; active: number; circulation: number }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN last_seen_at > ? THEN 1 ELSE 0 END) AS active,
            COALESCE(SUM(balance), 0) AS circulation
       FROM users WHERE role = 'player'`,
    now - DAY,
  );
  const credits = get<{ granted: number; deducted: number }>(
    `SELECT COALESCE(SUM(CASE WHEN kind = 'grant' THEN amount END), 0) AS granted,
            COALESCE(-SUM(CASE WHEN kind = 'deduct' THEN amount END), 0) AS deducted
       FROM ledger`,
  );
  const totals = get<{ wagered: number; paid: number; rounds: number }>(
    "SELECT COALESCE(SUM(wagered), 0) AS wagered, COALESCE(SUM(paid_out), 0) AS paid, COUNT(*) AS rounds FROM rounds",
  );
  const today = get<{ wagered: number; paid: number }>(
    "SELECT COALESCE(SUM(wagered), 0) AS wagered, COALESCE(SUM(paid_out), 0) AS paid FROM rounds WHERE created_at > ?",
    now - DAY,
  );

  // 14-day series, filling days without activity.
  const start = now - 13 * DAY;
  const roundsByDay = new Map(
    all<{ d: string; wagered: number; paid: number }>(
      `SELECT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') AS d,
              SUM(wagered) AS wagered, SUM(paid_out) AS paid
         FROM rounds WHERE created_at > ? GROUP BY d`,
      start - DAY,
    ).map((r) => [r.d, r]),
  );
  const usersByDay = new Map(
    all<{ d: string; n: number }>(
      `SELECT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') AS d, COUNT(*) AS n
         FROM users WHERE role = 'player' AND created_at > ? GROUP BY d`,
      start - DAY,
    ).map((r) => [r.d, r.n]),
  );
  const daily = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(start + i * DAY);
    const key = date.toISOString().slice(0, 10);
    const r = roundsByDay.get(key);
    return {
      date: date.toLocaleDateString("en", { day: "2-digit", month: "short", timeZone: "UTC" }),
      wagered: r?.wagered ?? 0,
      paidOut: r?.paid ?? 0,
      newUsers: usersByDay.get(key) ?? 0,
    };
  });

  const split = all<{ game: string; wagered: number }>(
    "SELECT game, SUM(wagered) AS wagered FROM rounds GROUP BY game",
  );
  const latest = all<{ id: number; game: string; result: string; players: number; wagered: number; created_at: number }>(
    "SELECT id, game, result, players, wagered, created_at FROM rounds ORDER BY id DESC LIMIT 6",
  );

  const io = getIo();
  const online = new Set<number>();
  if (io) for (const s of io.sockets.sockets.values()) online.add((s.data.user as { id: number }).id);

  const wagered = totals?.wagered ?? 0;
  const paid = totals?.paid ?? 0;
  return json({
    players: users?.total ?? 0,
    activeToday: users?.active ?? 0,
    online: online.size,
    creditsInCirculation: users?.circulation ?? 0,
    creditsGranted: credits?.granted ?? 0,
    creditsDeducted: credits?.deducted ?? 0,
    wagered,
    paidOut: paid,
    ggr: wagered - paid,
    rtp: wagered > 0 ? (paid / wagered) * 100 : null,
    roundsPlayed: totals?.rounds ?? 0,
    todayGgr: (today?.wagered ?? 0) - (today?.paid ?? 0),
    daily,
    split,
    latest: latest.map((r) => ({
      id: r.id,
      game: r.game,
      result: r.result,
      players: r.players,
      wagered: r.wagered,
      at: r.created_at,
    })),
  });
});
