import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE, userFromToken, type SessionUser } from "./auth-core";

export * from "./auth-core";

/** Current user in a route handler / server component. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return userFromToken(jar.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(token: string, expires: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    expires: new Date(expires),
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);
  jar.delete(SESSION_COOKIE);
}
