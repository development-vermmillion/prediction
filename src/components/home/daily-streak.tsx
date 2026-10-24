"use client";

import { Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useWallet } from "@/store/wallet";

export function DailyStreak({ compact }: { compact?: boolean }) {
  const mounted = useMounted();
  const streak = useWallet((s) => s.streak);
  const claimDaily = useWallet((s) => s.claimDaily);
  const lastClaimAt = useWallet((s) => s.lastClaimAt);
  const canClaim = mounted && (lastClaimAt === null || Date.now() - lastClaimAt >= 86_400_000);
  const current = mounted ? Math.min(streak, 7) : 3;

  const claim = () => {
    const bonus = claimDaily();
    if (bonus > 0) toast.success(`+${bonus} coins claimed`, "Come back tomorrow to keep your streak.");
  };

  return (
    <GlassCard strong className="p-5 md:p-6" glow="rgb(255 157 0 / 0.35)">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ffd75e] to-[#ff7a00] text-[#2b1700]">
            <Flame />
          </span>
          <div>
            <h3 className="text-lg font-extrabold">Daily streak</h3>
            <p className="text-sm text-white/60">{current}-day streak · bigger bonus each day</p>
          </div>
        </div>
        {!compact && (
          <Button variant="gold" disabled={!canClaim} onClick={claim}>
            <Gift size={18} /> {canClaim ? "Claim bonus" : "Claimed today"}
          </Button>
        )}
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => {
          const done = i < current;
          return (
            <div
              key={i}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-2xl border text-xs font-bold",
                done ? "border-[#ffc83d]/60 bg-[#ffc83d]/20 text-[#ffd75e]" : "border-white/10 bg-white/5 text-white/40",
              )}
            >
              <span>D{i + 1}</span>
              <span className="text-[10px] opacity-80">+{200 + (i + 1) * 25}</span>
            </div>
          );
        })}
      </div>
      {compact && (
        <Button variant="gold" full className="mt-4" disabled={!canClaim} onClick={claim}>
          <Gift size={18} /> {canClaim ? "Claim bonus" : "Claimed today"}
        </Button>
      )}
    </GlassCard>
  );
}
