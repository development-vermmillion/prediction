"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

type Handlers = Record<string, (payload: never) => void>;

/**
 * Join a game room, (re)request its state on every (re)connect and subscribe to events.
 * Returns whether the socket is currently connected.
 */
export function useGameSocket(game: string, handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const join = () => {
      setConnected(true);
      socket.emit("join", { game });
    };
    const drop = () => setConnected(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bound: [string, (p: any) => void][] = Object.keys(ref.current).map((event) => {
      const fn = (p: unknown) => (ref.current[event] as ((x: unknown) => void) | undefined)?.(p);
      socket.on(event, fn);
      return [event, fn];
    });
    socket.on("connect", join);
    socket.on("disconnect", drop);
    if (socket.connected) join();

    return () => {
      socket.emit("leave", { game });
      socket.off("connect", join);
      socket.off("disconnect", drop);
      for (const [event, fn] of bound) socket.off(event, fn);
    };
  }, [game]);

  return connected;
}

/** Offset (ms) to add to Date.now() to get server time. Updated from `serverTime` fields. */
export function useServerClock() {
  const offset = useRef(0);
  return {
    sync: (serverTime: number) => {
      offset.current = serverTime - Date.now();
    },
    now: () => Date.now() + offset.current,
  };
}
