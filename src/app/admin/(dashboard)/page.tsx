import { Activity, Coins, Percent, TrendingUp, Users, Wallet } from "lucide-react";
import { GameSplitChart, RevenueChart, UsersChart } from "@/components/admin/charts";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
import { GAMES } from "@/lib/constants";
import { GAME_LABEL } from "@/lib/mock/data";
import { formatCoins, formatCompact, timeAgo } from "@/lib/utils";
import { MOCK_NOW } from "@/lib/mock/data";
import { adminService } from "@/services";

export default function AdminOverviewPage() {
  const o = adminService.overview();
  const daily = adminService.dailyStats();
  const rounds = adminService.rounds().slice(0, 6);

  const split = GAMES.map((g) => ({
    name: g.name,
    color: g.accent,
    value: adminService
      .rounds()
      .filter((r) => r.game === g.id)
      .reduce((a, r) => a + r.wagered, 0),
  }));

  return (
    <>
      <PageHeader title="Overview" subtitle="Platform performance across the last 14 days." />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard label="Total wagered" value={formatCompact(o.wagered)} delta={8.4} icon={<Coins size={18} />} accent="#ff5c9a" />
        <StatCard label="Paid out" value={formatCompact(o.paidOut)} delta={6.1} icon={<Wallet size={18} />} accent="#22d3ee" />
        <StatCard label="Gross game revenue" value={formatCompact(o.ggr)} delta={14.2} icon={<TrendingUp size={18} />} accent="#22e58b" />
        <StatCard label="Registered players" value={formatCoins(o.totalUsers)} delta={3.8} icon={<Users size={18} />} accent="#a78bfa" />
        <StatCard label="Active players" value={formatCoins(o.activeUsers)} delta={-1.2} icon={<Activity size={18} />} accent="#ffc83d" />
        <StatCard label="Effective RTP" value={`${o.rtp.toFixed(1)}%`} icon={<Percent size={18} />} accent="#ff2d55" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <GlassCard className="p-5">
          <h2 className="mb-1 font-bold">Wagered vs paid out</h2>
          <p className="mb-4 text-sm text-white/50">Daily totals in coins</p>
          <RevenueChart data={daily} />
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="mb-4 font-bold">Wager share by game</h2>
          <GameSplitChart data={split} />
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="mb-4 font-bold">New players per day</h2>
          <UsersChart data={daily} />
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="mb-4 font-bold">Latest rounds</h2>
          <ul className="divide-y divide-white/10">
            {rounds.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold">{GAME_LABEL[r.game]}</p>
                  <p className="text-xs text-white/45">{timeAgo(r.at, MOCK_NOW)} · {r.players} players</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold">{r.result}</p>
                  <p className="text-xs text-white/45">{formatCompact(r.wagered)} wagered</p>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </>
  );
}
