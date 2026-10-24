import type { Metadata } from "next";
import { GameShell } from "@/components/games/game-shell";
import { LudoGame } from "@/components/games/ludo/ludo-game";

export const metadata: Metadata = { title: "Ludo" };

export default function LudoPage() {
  return (
    <GameShell id="ludo">
      <LudoGame />
    </GameShell>
  );
}
