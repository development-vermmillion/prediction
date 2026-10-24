import type { Metadata } from "next";
import { GameCard } from "@/components/home/game-card";
import { GAMES } from "@/lib/constants";

export const metadata: Metadata = { title: "Games" };

export default function GamesPage() {
  return (
    <div>
      <p className="mb-1 text-xs font-bold tracking-[0.2em] text-brand-pink uppercase">Arcade</p>
      <h1 className="mb-8 text-3xl font-extrabold md:text-4xl">All games</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GAMES.map((g) => (
          <GameCard key={g.id} game={g} tall />
        ))}
      </div>
    </div>
  );
}
