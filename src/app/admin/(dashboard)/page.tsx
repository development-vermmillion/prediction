"use client";

import { Activity, Coins, Percent, TrendingUp, Users, Wallet, Wifi } from "lucide-react";
import { GameSplitChart, RevenueChart, UsersChart } from "@/components/admin/charts";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
import { useApi } from "@/hooks/use-api";
import { GAME_LABEL, GAMES } from "@/lib/constants";
import { formatCoins, formatCompact, timeAgo } from "@/lib/utils";
import type { DailyStat } from "@/types";

interface Overview {
  players: number;
  activeToday: number;
  online: number;
  creditsInCirculation: number;
  creditsGranted: number;
  creditsDeducted: number;
  wagered: number;
  paidOut: number;
  ggr: number;
  rtp: number | null;
  roundsPlayed: number;
  todayGgr: number;
  daily: DailyStat[];
  split: { game: string; wagered: number }[];
  latest: { id: number; game: string; result: string; players: number; wagered: number; at: number }[];
}

export default function AdminOverviewPage() {
  const { data: o, error } = useApi<Overview>("/api/admin/overview", 10_000);

  if (error) return <p className="text-brand-red">{error}</p>;
  if (!o) return <p className="text-white/50">Loading…</p>;

  const split = GAMES.map((g) => ({
    name: g.name,
    color: g.accent,
    value: o.split.find((s) => s.game === g.id)?.wagered ?? 0,
  }));
  const hasSplit = split.some((s) => s.value > 0);

  return (
    <>
      <PageHeader title="Overview" subtitle="Live platform performance. Refreshes every 10 seconds." />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Online now" value={formatCoins(o.online)} icon={<Wifi size={18} />} accent="#22e58b" />
        <StatCard label="Registered players" value={formatCoins(o.players)} icon={<Users size={18} />} accent="#a78bfa" />
        <StatCard label="Active (24h)" value={formatCoins(o.activeToday)} icon={<Activity size={18} />} accent="#ffc83d" />
        <StatCard label="Credits in circulation" value={formatCompact(o.creditsInCirculation)} icon={<Wallet size={18} />} accent="#22d3ee" />
        <StatCard label="Total wagered" value={formatCompact(o.wagered)} icon={<Coins size={18} />} accent="#ff5c9a" />
        <StatCard label="Paid out to players" value={formatCompact(o.paidOut)} icon={<Wallet size={18} />} accent="#22d3ee" />
        <StatCard label="House profit (GGR)" value={formatCompact(o.ggr)} icon={<TrendingUp size={18} />} accent="#22e58b" />
        <StatCard label="Effective RTP" value={o.rtp === null ? "—" : `${o.rtp.toFixed(1)}%`} icon={<Percent size={18} />} accent="#ff2d55" />
      </div>
      <p className="mt-3 text-xs text-white/45">
        Credits allocated by you: {formatCoins(o.creditsGranted)} · removed: {formatCoins(o.creditsDeducted)} · rounds played: {formatCoins(o.roundsPlayed)} · profit last 24h: {formatCoins(o.todayGgr)}
      </p>

      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <GlassCard className="p-5">
          <h2 className="mb-1 font-bold">Wagered vs paid out</h2>
          <p className="mb-4 text-sm text-white/50">Daily totals in credits, last 14 days</p>
          <RevenueChart data={o.daily} />
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="mb-4 font-bold">Wager share by game</h2>
          {hasSplit ? <GameSplitChart data={split} /> : <p className="py-16 text-center text-sm text-white/45">No rounds played yet.</p>}
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="mb-4 font-bold">New players per day</h2>
          <UsersChart data={o.daily} />
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="mb-4 font-bold">Latest rounds</h2>
          {o.latest.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/45">No rounds yet.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {o.latest.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold">{GAME_LABEL[r.game] ?? r.game}</p>
                    <p className="text-xs text-white/45">{timeAgo(r.at)} · {r.players} players</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold">{r.result}</p>
                    <p className="text-xs text-white/45">{formatCompact(r.wagered)} wagered</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </>
  );
}
