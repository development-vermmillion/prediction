"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Coin } from "@/components/ui/coin";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { formatCoins } from "@/lib/utils";
import { useSession } from "@/store/session";
import type { LiveWin } from "@/types";

const HUES: [string, string][] = [
  ["#ffc83d", "#ff7a00"],
  ["#22d3ee", "#2563eb"],
  ["#a78bfa", "#ec4899"],
  ["#22e58b", "#0e9f6e"],
  ["#ff5c9a", "#ff2d55"],
];

/** Live ticker of recent big wins, fed by the server (polled once, then pushed over the socket). */
export function LiveWins() {
  const [wins, setWins] = useState<LiveWin[]>([]);
  const userId = useSession((s) => s.user?.id);

  useEffect(() => {
    api<{ wins: LiveWin[]; online: number }>("/api/feed")
      .then((r) => setWins(r.wins))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    const s = getSocket();
    const onWin = (w: LiveWin) => setWins((prev) => [w, ...prev].slice(0, 15));
    s.on("feed:win", onWin);
    return () => {
      s.off("feed:win", onWin);
    };
  }, [userId]);

  if (wins.length === 0) {
    return (
      <div className="glass rounded-full px-6 py-4 text-center text-sm text-white/50">
        Big wins from live rounds will appear here.
      </div>
    );
  }
  const loop = wins.length < 5 ? [...wins, ...wins, ...wins] : [...wins, ...wins];
  return (
    <div className="relative overflow-hidden rounded-full">
      <div className="flex w-max animate-ticker gap-3 py-1 hover:[animation-play-state:paused]">
        {loop.map((w, i) => (
          <div key={`${w.id}-${i}`} className="glass flex items-center gap-3 rounded-full py-2 pr-5 pl-2">
            <Avatar name={w.name} hue={HUES[w.name.length % HUES.length]} size={34} />
            <div className="text-sm leading-tight">
              <p className="font-bold">
                {w.name} <span className="font-normal text-white/50">· {w.game}</span>
              </p>
              <p className="text-xs text-white/55">{w.detail}</p>
            </div>
            <span className="flex items-center gap-1 font-display text-sm font-bold text-brand-green">
              +{formatCoins(w.amount)} <Coin size={16} />
            </span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#07050f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#07050f] to-transparent" />
    </div>
  );
}
