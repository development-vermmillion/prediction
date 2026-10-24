import { allConfigs } from "@/server/config";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Public game settings (limits and whether each game is open). */
export const GET = route(async () => {
  return json({
    games: allConfigs().map((c) => ({
      game: c.game,
      enabled: c.enabled,
      minBet: c.minBet,
      maxBet: c.maxBet,
      rake: c.rake,
    })),
  });
});
