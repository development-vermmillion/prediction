"use client";

import Link from "next/link";
import { Coin } from "@/components/ui/coin";
import { formatCoins } from "@/lib/utils";
import { useSession } from "@/store/session";

export function WalletPill() {
  const user = useSession((s) => s.user);
  if (!user) return null;
  return (
    <Link
      href="/wallet"
      className="glass flex items-center gap-2 rounded-full py-1.5 pr-4 pl-3 transition hover:bg-white/15"
    >
      <Coin size={20} />
      <span className="font-display text-sm font-bold tabular-nums">{formatCoins(user.balance)}</span>
    </Link>
  );
}
