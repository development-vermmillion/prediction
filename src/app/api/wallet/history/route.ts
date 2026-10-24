import { all } from "@/server/db";
import { json, requireUser, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = all<{
    id: number;
    kind: string;
    game: string | null;
    amount: number;
    balance_after: number;
    note: string | null;
    created_at: number;
  }>(
    "SELECT id, kind, game, amount, balance_after, note, created_at FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 100",
    user.id,
  );
  return json({
    transactions: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      game: r.game,
      amount: r.amount,
      balanceAfter: r.balance_after,
      note: r.note,
      at: r.created_at,
    })),
  });
});
