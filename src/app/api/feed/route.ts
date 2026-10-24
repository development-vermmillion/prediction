import { getIo } from "@/server/bus";
import { recentWins } from "@/server/feed";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const io = getIo();
  const ids = new Set<number>();
  if (io) for (const s of io.sockets.sockets.values()) ids.add((s.data.user as { id: number }).id);
  return json({ wins: recentWins(), online: ids.size });
});
