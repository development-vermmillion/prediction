import type { Metadata } from "next";
import { Calendar, Gift, Trophy } from "lucide-react";
import { DailyStreak } from "@/components/home/daily-streak";
import { GlassCard } from "@/components/ui/glass-card";
import { adminService } from "@/services";

export const metadata: Metadata = { title: "Rewards" };

export default function RewardsPage() {
  const promos = adminService.promotions().filter((p) => p.active);
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs font-bold tracking-[0.2em] text-brand-pink uppercase">Bonuses</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Rewards</h1>
      </div>
      <DailyStreak />
      <div className="grid gap-4 md:grid-cols-2">
        {promos.map((p, i) => (
          <GlassCard key={p.id} className="flex gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-brand-gold">
              {i % 3 === 0 ? <Gift /> : i % 3 === 1 ? <Calendar /> : <Trophy />}
            </span>
            <div>
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-sm text-white/60">{p.description}</p>
              <p className="mt-2 text-sm font-bold text-brand-gold">+{p.coins.toLocaleString("en-IN")} coins</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
