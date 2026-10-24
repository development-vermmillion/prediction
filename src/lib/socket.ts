"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: "/socket.io", withCredentials: true, transports: ["websocket", "polling"] });
  }
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}

export interface AckResult {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

/** Emit an event and wait for the server's acknowledgement. */
export function emitAck(event: string, payload?: unknown, timeoutMs = 8000): Promise<AckResult> {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s.connected) return resolve({ ok: false, error: "Not connected — check your connection" });
    const timer = setTimeout(() => resolve({ ok: false, error: "The server did not respond" }), timeoutMs);
    s.emit(event, payload, (res: AckResult) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}
