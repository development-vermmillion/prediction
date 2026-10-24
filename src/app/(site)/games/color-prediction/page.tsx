import type { Metadata } from "next";
import { ColorGame } from "@/components/games/color/color-game";
import { GameShell } from "@/components/games/game-shell";

export const metadata: Metadata = { title: "Color Prediction" };

export default function ColorPredictionPage() {
  return (
    <GameShell id="color-prediction">
      <ColorGame />
    </GameShell>
  );
}
