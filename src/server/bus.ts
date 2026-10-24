import type { Server } from "socket.io";

/**
 * Tiny bridge so code running inside Next route handlers (separate module graph in dev)
 * can reach the Socket.IO server created by `server.ts`.
 */
const g = globalThis as unknown as { __predicatorsIo?: Server; __predicatorsRisk?: Record<string, () => unknown> };

/** Engines register a function that reports their live table risk to the owner dashboard. */
export function setRiskSources(sources: Record<string, () => unknown>) {
  g.__predicatorsRisk = sources;
}
export function getRiskSources() {
  return g.__predicatorsRisk ?? {};
}

export function setIo(io: Server) {
  g.__predicatorsIo = io;
}

export function getIo(): Server | undefined {
  return g.__predicatorsIo;
}

export function emitToUser(userId: number, event: string, payload: unknown) {
  getIo()?.to(`user:${userId}`).emit(event, payload);
}
