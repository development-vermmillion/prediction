import { all, get, run } from "@/server/db";
import { HttpError, json, readJson, requireUser, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = all<{ id: number; amount: number; message: string | null; status: string; created_at: number }>(
    "SELECT id, amount, message, status, created_at FROM credit_requests WHERE user_id = ? ORDER BY id DESC LIMIT 20",
    user.id,
  );
  return json({ requests: rows.map((r) => ({ id: r.id, amount: r.amount, message: r.message, status: r.status, at: r.created_at })) });
});

/** A player asks the owner for credits. The owner decides and allocates from the dashboard. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== "player") throw new HttpError("Only players can request credits", 403);
  const body = await readJson<{ amount?: unknown; message?: unknown }>(req);
  const amount = body.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 10 || amount > 100_000) {
    throw new HttpError("Enter a whole number between 10 and 100,000");
  }
  if ((get<{ c: number }>("SELECT COUNT(*) c FROM credit_requests WHERE user_id = ? AND status = 'pending'", user.id)?.c ?? 0) >= 3) {
    throw new HttpError("You already have pending requests. Please wait for the owner.", 429);
  }
  const message = String(body.message ?? "").trim().slice(0, 200) || null;
  run("INSERT INTO credit_requests (user_id, amount, message, created_at) VALUES (?, ?, ?, ?)", user.id, amount, message, Date.now());
  return json({ ok: true }, 201);
});
