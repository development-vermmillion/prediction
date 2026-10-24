import { all } from "@/server/db";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

const GAMES = ["aviator", "color-prediction", "number-wheel"];

/** Public: recent settled rounds with the commit hash that was shown before betting and the revealed seed. */
export const GET = route(async (req: Request) => {
  const game = new URL(req.url).searchParams.get("game") ?? "aviator";
  if (!GAMES.includes(game)) throw new HttpError("Unknown game", 404);
  const rows = all<{ id: number; round_no: number | null; result: string; commit_hash: string | null; seed: string | null; rtp: number | null; created_at: number }>(
    "SELECT id, round_no, result, commit_hash, seed, rtp, created_at FROM rounds WHERE game = ? AND seed IS NOT NULL ORDER BY id DESC LIMIT 30",
    game,
  );
  return json({
    game,
    rounds: rows.map((r) => ({ id: r.id, roundNo: r.round_no, result: r.result, commit: r.commit_hash, seed: r.seed, rtp: r.rtp, at: r.created_at })),
  });
});
