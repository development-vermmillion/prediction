import { allConfigs, getConfig, updateConfig } from "@/server/config";
import { HttpError, json, readJson, requireAdmin, route } from "@/server/http";
import { isValidStake } from "@/lib/games/stakes";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  return json({ games: allConfigs() });
});

/** PUT { game, enabled?, rtp?, minBet?, maxBet?, rake? } */
export const PUT = route(async (req: Request) => {
  await requireAdmin();
  const b = await readJson<{ game?: string; enabled?: unknown; rtp?: unknown; minBet?: unknown; maxBet?: unknown; rake?: unknown; maxExposure?: unknown }>(req);
  const game = String(b.game ?? "");
  let current;
  try {
    current = getConfig(game);
  } catch {
    throw new HttpError("Unknown game", 404);
  }

  const patch: Parameters<typeof updateConfig>[1] = {};
  if (b.enabled !== undefined) patch.enabled = Boolean(b.enabled);
  if (b.rtp !== undefined) {
    if (game === "ludo") throw new HttpError("Ludo uses a rake, not RTP");
    if (typeof b.rtp !== "number" || b.rtp < 80 || b.rtp > 99) throw new HttpError("RTP must be between 80 and 99");
    patch.rtp = b.rtp;
  }
  if (b.rake !== undefined) {
    if (game !== "ludo") throw new HttpError("Only Ludo uses a rake");
    if (typeof b.rake !== "number" || b.rake < 0 || b.rake > 30) throw new HttpError("Rake must be between 0 and 30 percent");
    patch.rake = b.rake;
  }
  if (b.maxExposure !== undefined) {
    if (game === "ludo") throw new HttpError("Ludo has no exposure limit");
    if (typeof b.maxExposure !== "number" || !Number.isInteger(b.maxExposure) || b.maxExposure < 1000 || b.maxExposure > 100_000_000) {
      throw new HttpError("Limit must be a whole number between 1,000 and 100,000,000");
    }
    patch.maxExposure = b.maxExposure;
  }
  if (b.minBet !== undefined) {
    if (!isValidStake(b.minBet)) throw new HttpError("Min stake must be 10, 20, 50 or a multiple of 100");
    patch.minBet = b.minBet;
  }
  if (b.maxBet !== undefined) {
    if (!isValidStake(b.maxBet)) throw new HttpError("Max stake must be 10, 20, 50 or a multiple of 100");
    patch.maxBet = b.maxBet;
  }
  const min = patch.minBet ?? current.minBet;
  const max = patch.maxBet ?? current.maxBet;
  if (min > max) throw new HttpError("Min stake cannot exceed max stake");

  return json({ game: updateConfig(game, patch) });
});
