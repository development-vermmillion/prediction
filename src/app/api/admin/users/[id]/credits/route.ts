import { get } from "@/server/db";
import { HttpError, json, readJson, requireAdmin, route } from "@/server/http";
import { adminAdjust, WalletError } from "@/server/wallet";

type Ctx = { params: Promise<{ id: string }> };

const MAX_ADJUST = 1_000_000;

/** Owner credit allocation: positive amount grants credits, negative deducts them. */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const id = Number((await ctx.params).id);
  const body = await readJson<{ amount?: unknown; note?: unknown }>(req);
  const amount = body.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount === 0 || Math.abs(amount) > MAX_ADJUST) {
    throw new HttpError(`Amount must be a whole number between 1 and ${MAX_ADJUST.toLocaleString("en-IN")} (negative to deduct)`);
  }
  const note = String(body.note ?? "").trim().slice(0, 200) || (amount > 0 ? "Credits allocated by owner" : "Credits deducted by owner");

  const user = get<{ role: string }>("SELECT role FROM users WHERE id = ?", id);
  if (!user || user.role !== "player") throw new HttpError("Player not found", 404);

  try {
    const balance = adminAdjust(admin.id, id, amount, note);
    return json({ ok: true, balance });
  } catch (err) {
    if (err instanceof WalletError) throw new HttpError(err.message);
    throw err;
  }
});
