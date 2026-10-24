import { getSessionUser } from "@/server/auth";
import { run } from "@/server/db";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await getSessionUser();
  if (user) run("UPDATE users SET last_seen_at = ? WHERE id = ?", Date.now(), user.id);
  return json({ user });
});
