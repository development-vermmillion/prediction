"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface PublicGameConfig {
  game: string;
  enabled: boolean;
  minBet: number;
  maxBet: number;
  rake: number;
}

const FALLBACK: PublicGameConfig = { game: "", enabled: true, minBet: 10, maxBet: 10_000, rake: 0 };

/** Stake limits and open/closed state for a game (defaults until loaded). */
export function useGameConfig(game: string): PublicGameConfig {
  const [cfg, setCfg] = useState<PublicGameConfig>({ ...FALLBACK, game });
  useEffect(() => {
    api<{ games: PublicGameConfig[] }>("/api/games")
      .then((r) => {
        const found = r.games.find((g) => g.game === game);
        if (found) setCfg(found);
      })
      .catch(() => {});
  }, [game]);
  return cfg;
}
