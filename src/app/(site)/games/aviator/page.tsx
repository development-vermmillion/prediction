import type { Metadata } from "next";
import { AviatorGame } from "@/components/games/aviator/aviator-game";
import { GameShell } from "@/components/games/game-shell";

export const metadata: Metadata = { title: "Aviator" };

export default function AviatorPage() {
  return (
    <GameShell id="aviator">
      <AviatorGame />
    </GameShell>
  );
}
