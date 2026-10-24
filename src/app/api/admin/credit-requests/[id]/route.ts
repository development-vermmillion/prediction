import { get, run } from "@/server/db";
import { HttpError, json, readJson, requireAdmin, route } from "@/server/http";
import { adminAdjust, WalletError } from "@/server/wallet";

type Ctx = { params: Promise<{ id: string }> };

/** Owner resolves a request: { action: "approve", amount? } allocates credits, { action: "dismiss" } closes it. */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const id = Number((await ctx.params).id);
  const body = await readJson<{ action?: unknown; amount?: unknown }>(req);
  const r = get<{ user_id: number; amount: number; status: string }>("SELECT user_id, amount, status FROM credit_requests WHERE id = ?", id);
  if (!r || r.status !== "pending") throw new HttpError("Request not found or already handled", 404);

  if (body.action === "dismiss") {
    run("UPDATE credit_requests SET status = 'dismissed', resolved_at = ? WHERE id = ?", Date.now(), id);
    return json({ ok: true });
  }
  if (body.action !== "approve") throw new HttpError("Invalid action");
  const amount = body.amount === undefined ? r.amount : body.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1 || amount > 1_000_000) throw new HttpError("Invalid amount");
  try {
    const balance = adminAdjust(admin.id, r.user_id, amount, `Credit request #${id}`);
    run("UPDATE credit_requests SET status = 'approved', resolved_at = ? WHERE id = ?", Date.now(), id);
    return json({ ok: true, balance });
  } catch (err) {
    if (err instanceof WalletError) throw new HttpError(err.message);
    throw err;
  }
});
