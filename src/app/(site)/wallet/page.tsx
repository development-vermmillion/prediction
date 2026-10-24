"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Gift, RotateCcw } from "lucide-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { Coin } from "@/components/ui/coin";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/lib/api";
import { cn, formatCoins, timeAgo } from "@/lib/utils";
import { useSession } from "@/store/session";
import type { Transaction } from "@/types";

const LABEL: Record<string, string> = { grant: "Credits added", deduct: "Credits removed", refund: "Refund" };

function WalletView() {
  const user = useSession((s) => s.user)!;
  const [txns, setTxns] = useState<Transaction[] | null>(null);

  useEffect(() => {
    api<{ transactions: Transaction[] }>("/api/wallet/history")
      .then((r) => setTxns(r.transactions))
      .catch(() => setTxns([]));
    // Refetch whenever the balance changes (a bet settled, credits arrived …).
  }, [user.balance]);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-bold tracking-[0.2em] text-brand-pink uppercase">Credits</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Wallet</h1>
      </div>

      <GlassCard strong className="p-6" glow="rgb(255 200 61 / 0.35)">
        <p className="text-sm text-white/60">Available balance</p>
        <p className="mt-1 flex items-center gap-3 font-display text-5xl font-black">
          <Coin size={44} /> {formatCoins(user.balance)}
        </p>
        <p className="mt-4 text-sm text-white/55">
          Need more credits? Credits are allocated to your account by the owner and show up here instantly.
        </p>
        <Link href="/credits" className="mt-3 inline-block text-sm font-semibold text-brand-gold hover:underline">
          Request credits →
        </Link>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <h2 className="mb-4 text-lg font-bold">Transaction history</h2>
        {txns === null ? (
          <p className="py-10 text-center text-white/50">Loading…</p>
        ) : txns.length === 0 ? (
          <p className="py-10 text-center text-white/50">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center gap-4 py-3">
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    t.amount > 0 ? "bg-brand-green/15 text-brand-green" : "bg-brand-red/15 text-brand-red",
                  )}
                >
                  {t.kind === "grant" ? (
                    <Gift size={18} />
                  ) : t.kind === "refund" ? (
                    <RotateCcw size={18} />
                  ) : t.amount > 0 ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.note ?? LABEL[t.kind] ?? t.kind}</p>
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

export default function WalletPage() {
  return (
    <AuthGate>
      <WalletView />
    </AuthGate>
  );
}
