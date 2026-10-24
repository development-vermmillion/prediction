import { all } from "@/server/db";
import { json, requireAdmin, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = all<{ id: number; user_id: number; name: string; email: string; balance: number; amount: number; message: string | null; created_at: number }>(
    `SELECT r.id, r.user_id, u.name, u.email, u.balance, r.amount, r.message, r.created_at
       FROM credit_requests r JOIN users u ON u.id = r.user_id
      WHERE r.status = 'pending' ORDER BY r.id ASC LIMIT 100`,
  );
  return json({
    requests: rows.map((r) => ({ id: r.id, userId: r.user_id, name: r.name, email: r.email, balance: r.balance, amount: r.amount, message: r.message, at: r.created_at })),
  });
});
