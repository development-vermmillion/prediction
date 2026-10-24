import type { Metadata } from "next";
import { GameShell } from "@/components/games/game-shell";
import { WheelGame } from "@/components/games/wheel/wheel-game";

export const metadata: Metadata = { title: "Number Wheel" };

export default function NumberWheelPage() {
  return (
    <GameShell id="number-wheel">
      <WheelGame />
    </GameShell>
  );
}
