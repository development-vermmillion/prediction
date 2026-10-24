"use client";

import { useEffect } from "react";
import { closeSocket, getSocket } from "@/lib/socket";
import { useSession } from "@/store/session";

/** Loads the session once and keeps one socket connection alive while signed in. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const userId = useSession((s) => s.user?.id ?? null);
  const refresh = useSession((s) => s.refresh);
  const setBalance = useSession((s) => s.setBalance);
  const setOnline = useSession((s) => s.setOnline);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (userId === null) {
      closeSocket();
      return;
    }
    const socket = getSocket();
    const onBalance = (p: { balance: number }) => setBalance(p.balance);
    const onPresence = (p: { online: number }) => setOnline(p.online);
    socket.on("balance", onBalance);
    socket.on("presence", onPresence);
    return () => {
      socket.off("balance", onBalance);
      socket.off("presence", onPresence);
    };
  }, [userId, setBalance, setOnline]);

  return <>{children}</>;
}
