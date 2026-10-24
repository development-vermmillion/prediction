"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";
import { Podium } from "./podium";

export function LeaderboardTeaser() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  useEffect(() => {
    api<{ entries: LeaderboardEntry[] }>("/api/leaderboard")
      .then((r) => setEntries(r.entries))
      .catch(() => setEntries([]));
  }, []);

  return (
    <GlassCard className="p-6 pt-10 md:p-10 md:pt-14">
      {entries && entries.length >= 3 ? (
        <Podium entries={entries.slice(0, 3)} />
      ) : (
        <p className="py-6 text-center text-white/50">
          {entries === null ? "Loading…" : "The leaderboard fills up as players win — be the first on the podium."}
        </p>
      )}
    </GlassCard>
  );
}
