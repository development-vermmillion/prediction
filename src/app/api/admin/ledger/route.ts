import { all } from "@/server/db";
import { json, requireAdmin, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/ledger?kinds=grant,deduct  (omit `kinds` for everything) */
export const GET = route(async (req: Request) => {
  await requireAdmin();
  const kinds = (new URL(req.url).searchParams.get("kinds") ?? "")
    .split(",")
    .filter((k) => ["grant", "deduct", "bet", "win", "refund"].includes(k));
  const where = kinds.length ? `WHERE l.kind IN (${kinds.map(() => "?").join(",")})` : "";
  const rows = all<{
    id: number;
    user_id: number;
    user_name: string;
    kind: string;
    game: string | null;
    amount: number;
    balance_after: number;
    note: string | null;
    admin_name: string | null;
    created_at: number;
  }>(
    `SELECT l.id, l.user_id, u.name AS user_name, l.kind, l.game, l.amount, l.balance_after, l.note,
            a.name AS admin_name, l.created_at
       FROM ledger l
       JOIN users u ON u.id = l.user_id
       LEFT JOIN users a ON a.id = l.admin_id
       ${where}
      ORDER BY l.id DESC LIMIT 500`,
    ...kinds,
  );
  return json({
    entries: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      kind: r.kind,
      game: r.game,
      amount: r.amount,
      balanceAfter: r.balance_after,
      note: r.note,
      adminName: r.admin_name,
      at: r.created_at,
    })),
  });
});
