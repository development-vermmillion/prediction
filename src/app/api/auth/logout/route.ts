import { clearSessionCookie } from "@/server/auth";
import { json, route } from "@/server/http";

export const POST = route(async () => {
  await clearSessionCookie();
  return json({ ok: true });
});
