"use client";

import { useEffect, useState } from "react";
import { Podium } from "@/components/home/podium";
import { Avatar } from "@/components/ui/avatar";
import { Coin } from "@/components/ui/coin";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/lib/api";
import { formatCoins } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

export default function LeaderboardPage() {
  const [all, setAll] = useState<LeaderboardEntry[] | null>(null);
  useEffect(() => {
    api<{ entries: LeaderboardEntry[] }>("/api/leaderboard")
      .then((r) => setAll(r.entries))
      .catch(() => setAll([]));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs font-bold tracking-[0.2em] text-brand-pink uppercase">All-time winnings</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Leaderboard</h1>
      </div>
      {all === null ? (
        <p className="text-white/50">Loading…</p>
      ) : all.length === 0 ? (
        <GlassCard className="p-10 text-center text-white/55">No winners yet — place the first bet!</GlassCard>
      ) : (
        <>
          {all.length >= 3 && (
            <GlassCard className="p-6 pt-10 md:p-10 md:pt-14">
              <Podium entries={all.slice(0, 3)} />
            </GlassCard>
          )}
          <GlassCard className="overflow-hidden">
            <ul className="divide-y divide-white/10">
              {all.slice(all.length >= 3 ? 3 : 0).map((e) => (
                <li key={e.rank} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="w-8 font-display font-bold text-white/50">{e.rank}</span>
                  <Avatar name={e.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.name}</p>
                    <p className="text-xs text-white/50">Wagered {formatCoins(e.wagered)}</p>
                  </div>
                  <span className="flex items-center gap-1.5 font-display font-bold">
                    {formatCoins(e.won)} <Coin size={16} />
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </>
      )}
    </div>
  );
}
