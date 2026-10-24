import { getIo } from "./bus";

export interface WinEvent {
  id: string;
  name: string;
  game: string;
  detail: string;
  amount: number;
  at: number;
}

const g = globalThis as unknown as { __predicatorsFeed?: WinEvent[] };
const feed = (g.__predicatorsFeed ??= []);
let seq = 0;

/** Publish a notable win to the live ticker on the home page. */
export function pushWin(w: Omit<WinEvent, "id" | "at">) {
  const event: WinEvent = { ...w, id: `w${Date.now()}-${seq++}`, at: Date.now() };
  feed.unshift(event);
  feed.length = Math.min(feed.length, 25);
  getIo()?.to("feed").emit("feed:win", event);
}

export function recentWins(): WinEvent[] {
  return feed.slice(0, 15);
}
