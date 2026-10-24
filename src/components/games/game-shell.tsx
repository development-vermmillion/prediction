import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { GameArt } from "@/components/home/game-art";
import { GAMES } from "@/lib/constants";
import type { GameId } from "@/types";

export function GameShell({ id, children }: { id: GameId; children: React.ReactNode }) {
  const game = GAMES.find((g) => g.id === id)!;
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/games" aria-label="Back to games" className="glass grid size-10 place-items-center rounded-full hover:bg-white/15">
            <ChevronLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold md:text-3xl">{game.name}</h1>
            <p className="text-sm text-white/55">{game.tagline}</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <GameArt id={id} size={64} />
        </div>
      </div>
      <AuthGate>{children}</AuthGate>
      <p className="mt-6 text-center text-xs text-white/35">
        Results are generated on the server and shared by every player. 18+ · Play responsibly.
      </p>
    </div>
  );
}
