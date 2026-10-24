"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/store/session";

/** "N players online" — live from the socket when signed in, otherwise from the feed endpoint. */
export function OnlineBadge() {
  const live = useSession((s) => s.online);
  const signedIn = useSession((s) => !!s.user);
  const [polled, setPolled] = useState<number | null>(null);

  useEffect(() => {
    api<{ online: number }>("/api/feed")
      .then((r) => setPolled(r.online))
      .catch(() => {});
  }, []);

  const n = signedIn && live > 0 ? live : (polled ?? 0);
  return (
    <>
      <span className="size-2 animate-pulse-glow rounded-full bg-brand-green" />
      {n} {n === 1 ? "player" : "players"} online
    </>
  );
}
