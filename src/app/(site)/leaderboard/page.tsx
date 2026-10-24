import type { Metadata } from "next";
import { Podium } from "@/components/home/podium";
import { Avatar } from "@/components/ui/avatar";
import { Coin } from "@/components/ui/coin";
import { GlassCard } from "@/components/ui/glass-card";
import { GAME_LABEL } from "@/lib/mock/data";
import { formatCoins } from "@/lib/utils";
import { playerService } from "@/services";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  const all = playerService.leaderboard();
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs font-bold tracking-[0.2em] text-brand-pink uppercase">Weekly ranking</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Leaderboard</h1>
      </div>
      <GlassCard className="p-6 pt-10 md:p-10 md:pt-14">
        <Podium entries={all.slice(0, 3)} />
      </GlassCard>
      <GlassCard className="overflow-hidden">
        <ul className="divide-y divide-white/10">
          {all.slice(3).map((e) => (
            <li key={e.rank} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-8 font-display font-bold text-white/50">{e.rank}</span>
              <Avatar name={e.name} hue={e.hue} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.name}</p>
                <p className="text-xs text-white/50">{e.wins} wins · {GAME_LABEL[e.favourite]}</p>
              </div>
              <span className="flex items-center gap-1.5 font-display font-bold">
                {formatCoins(e.coins)} <Coin size={16} />
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
