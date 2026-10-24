import { getRiskSources } from "@/server/bus";
import { json, requireAdmin, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Owner-only: live exposure of the running tables. */
export const GET = route(async () => {
  await requireAdmin();
  const src = getRiskSources();
  return json({ aviator: src.aviator?.() ?? null, color: src.color?.() ?? null, wheel: src.wheel?.() ?? null });
});
