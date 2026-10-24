import { all } from "@/server/db";
import { json, requireAdmin, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = all<{
    id: number;
    name: string;
    email: string;
    status: string;
    balance: number;
    total_wagered: number;
    total_won: number;
    created_at: number;
    last_seen_at: number;
  }>(
    "SELECT id, name, email, status, balance, total_wagered, total_won, created_at, last_seen_at FROM users WHERE role = 'player' ORDER BY id DESC LIMIT 1000",
  );
  return json({
    users: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      status: r.status,
      balance: r.balance,
      wagered: r.total_wagered,
      won: r.total_won,
      joinedAt: r.created_at,
      lastSeenAt: r.last_seen_at,
    })),
  });
});
