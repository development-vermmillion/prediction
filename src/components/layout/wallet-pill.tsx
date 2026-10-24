"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Coin } from "@/components/ui/coin";
import { useMounted } from "@/hooks/use-mounted";
import { formatCoins } from "@/lib/utils";
import { useWallet } from "@/store/wallet";

export function WalletPill() {
  const mounted = useMounted();
  const balance = useWallet((s) => s.balance);
  return (
    <Link
      href="/wallet"
      className="glass flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3 transition hover:bg-white/15"
    >
      <Coin size={20} />
      <span className="font-display text-sm font-bold tabular-nums">{mounted ? formatCoins(balance) : "—"}</span>
      <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#3df0a0] to-[#0e9f6e] text-[#032a1a]">
        <Plus size={16} strokeWidth={3} />
      </span>
    </Link>
  );
}
