import { all } from "@/server/db";
import { json, requireAdmin, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = all<{
    id: number;
    game: string;
    result: string;
    players: number;
    wagered: number;
    paid_out: number;
    created_at: number;
  }>("SELECT id, game, result, players, wagered, paid_out, created_at FROM rounds ORDER BY id DESC LIMIT 500");
  return json({
    rounds: rows.map((r) => ({
      id: r.id,
      game: r.game,
      result: r.result,
      players: r.players,
      wagered: r.wagered,
      paidOut: r.paid_out,
      at: r.created_at,
    })),
  });
});
