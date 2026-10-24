"use client";

import { ArrowDownLeft, ArrowUpRight, Gift, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { GlassCard } from "@/components/ui/glass-card";
import { useMounted } from "@/hooks/use-mounted";
import { cn, formatCoins, timeAgo } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useWallet } from "@/store/wallet";

export default function WalletPage() {
  const mounted = useMounted();
  const { balance, transactions, wagered, won, topUp, reset } = useWallet();

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-bold tracking-[0.2em] text-brand-pink uppercase">Virtual coins</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Wallet</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard strong className="p-6 md:col-span-2" glow="rgb(255 200 61 / 0.35)">
          <p className="text-sm text-white/60">Available balance</p>
          <p className="mt-1 flex items-center gap-3 font-display text-5xl font-black">
            <Coin size={44} /> {mounted ? formatCoins(balance) : "—"}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="success"
              onClick={() => {
                topUp(1000);
                toast.success("+1,000 coins added");
              }}
            >
              <PlusCircle size={18} /> Free top-up · 1,000
            </Button>
            <Button
              variant="glass"
              onClick={() => {
                reset();
                toast.info("Wallet reset to starting balance");
              }}
            >
              Reset demo wallet
            </Button>
          </div>
        </GlassCard>
        <div className="grid gap-4">
          <GlassCard className="p-5">
            <p className="text-sm text-white/60">Total wagered</p>
            <p className="font-display text-2xl font-bold">{mounted ? formatCoins(wagered) : "—"}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-sm text-white/60">Total won</p>
            <p className="font-display text-2xl font-bold text-brand-green">{mounted ? formatCoins(won) : "—"}</p>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="p-5 md:p-6">
        <h2 className="mb-4 text-lg font-bold">Transaction history</h2>
        {!mounted || transactions.length === 0 ? (
          <p className="py-10 text-center text-white/50">No transactions yet — go play a game!</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-4 py-3">
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    t.amount > 0 ? "bg-brand-green/15 text-brand-green" : "bg-brand-red/15 text-brand-red",
                  )}
                >
                  {t.kind === "bonus" ? <Gift size={18} /> : t.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.label}</p>
                  <p className="text-xs text-white/50">{timeAgo(t.at)}</p>
                </div>
                <div className="text-right">
                  <p className={cn("font-display font-bold", t.amount > 0 ? "text-brand-green" : "text-white")}>
                    {t.amount > 0 ? "+" : ""}
                    {formatCoins(t.amount)}
                  </p>
                  <p className="text-xs text-white/40">bal {formatCoins(t.balanceAfter)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
