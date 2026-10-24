import { getIo } from "@/server/bus";
import { get, run } from "@/server/db";
import { HttpError, json, readJson, requireAdmin, route } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const id = Number((await ctx.params).id);
  const { status } = await readJson<{ status?: string }>(req);
  if (!["active", "suspended", "banned"].includes(String(status))) throw new HttpError("Invalid status");
  const user = get<{ role: string }>("SELECT role FROM users WHERE id = ?", id);
  if (!user || user.role !== "player") throw new HttpError("Player not found", 404);

  run("UPDATE users SET status = ? WHERE id = ?", String(status), id);
  if (status === "banned") {
    run("DELETE FROM sessions WHERE user_id = ?", id);
    getIo()?.in(`user:${id}`).disconnectSockets(true);
  }
  return json({ ok: true, status });
});
