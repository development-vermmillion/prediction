import { all } from "@/server/db";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const rows = all<{ name: string; total_won: number; total_wagered: number }>(
    "SELECT name, total_won, total_wagered FROM users WHERE role = 'player' AND status = 'active' AND total_won > 0 ORDER BY total_won DESC LIMIT 20",
  );
  return json({
    entries: rows.map((r, i) => ({ rank: i + 1, name: r.name, won: r.total_won, wagered: r.total_wagered })),
  });
});
