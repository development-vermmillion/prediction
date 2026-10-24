"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useMounted } from "@/hooks/use-mounted";
import { formatCoins, formatDate } from "@/lib/utils";
import { usePlayer } from "@/store/player";
import { useWallet } from "@/store/wallet";

export default function ProfilePage() {
  const mounted = useMounted();
  const { name, email, loggedIn, joinedAt, signOut } = usePlayer();
  const { balance, wagered, won, streak } = useWallet();

  if (!mounted) return null;

  const stats = [
    { label: "Balance", value: formatCoins(balance) },
    { label: "Wagered", value: formatCoins(wagered) },
    { label: "Won", value: formatCoins(won) },
    { label: "Day streak", value: String(streak) },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <GlassCard strong className="flex flex-col items-center gap-4 p-8 text-center md:flex-row md:text-left">
        <Avatar name={name} size={84} />
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{name}</h1>
          <p className="text-white/55">{loggedIn ? email : "Playing as guest"}</p>
          <p className="text-xs text-white/40">Member since {formatDate(joinedAt)}</p>
        </div>
        {loggedIn ? (
          <Button variant="glass" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        ) : (
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        )}
      </GlassCard>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <GlassCard key={s.label} className="p-5">
            <p className="text-sm text-white/55">{s.label}</p>
            <p className="font-display text-xl font-bold">{s.value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
