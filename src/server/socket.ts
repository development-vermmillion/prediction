import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { tokenFromCookieHeader, userFromToken } from "./auth-core";
import { setIo, setRiskSources } from "./bus";
import { AviatorEngine } from "./games/aviator";
import { ColorEngine } from "./games/color-prediction";
import { LudoEngine } from "./games/ludo";
import { WheelEngine } from "./games/number-wheel";
import { getBalance } from "./wallet";
import { handle, userOf, type SocketUser } from "./socket-utils";

const GAMES = ["aviator", "color-prediction", "number-wheel", "ludo"] as const;
type GameKey = (typeof GAMES)[number];

export function onlineCount(io: Server) {
  const ids = new Set<number>();
  for (const s of io.sockets.sockets.values()) ids.add((s.data.user as SocketUser).id);
  return ids.size;
}

export function attachSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, { path: "/socket.io", serveClient: false });
  setIo(io);

  io.use((socket, next) => {
    const user = userFromToken(tokenFromCookieHeader(socket.handshake.headers.cookie));
    if (!user) return next(new Error("unauthorized"));
    socket.data.user = { id: user.id, name: user.name, role: user.role } satisfies SocketUser;
    next();
  });

  const aviator = new AviatorEngine(io);
  const color = new ColorEngine(io);
  const wheel = new WheelEngine(io);
  const ludo = new LudoEngine(io);
  setRiskSources({ aviator: () => aviator.risk(), color: () => color.risk(), wheel: () => wheel.risk() });
  const snapshots: Record<GameKey, (s: import("socket.io").Socket) => void> = {
    aviator: (s) => aviator.snapshot(s),
    "color-prediction": (s) => color.snapshot(s),
    "number-wheel": (s) => wheel.snapshot(s),
    ludo: (s) => ludo.snapshot(s),
  };

  let lastOnline = -1;
  const publishPresence = () => {
    const n = onlineCount(io);
    if (n !== lastOnline) {
      lastOnline = n;
      io.emit("presence", { online: n });
    }
  };
  setInterval(publishPresence, 4000).unref();

  io.on("connection", (socket) => {
    const user = userOf(socket);
    socket.join(`user:${user.id}`);
    socket.join("feed");
    socket.emit("balance", { balance: getBalance(user.id) });
    socket.emit("presence", { online: onlineCount(io) });

    aviator.register(socket);
    color.register(socket);
    wheel.register(socket);
    ludo.register(socket);

    handle<{ game: GameKey }>(socket, "join", (p) => {
      if (!GAMES.includes(p?.game)) return;
      socket.join(`game:${p.game}`);
      snapshots[p.game](socket);
    });
    handle<{ game: GameKey }>(socket, "leave", (p) => {
      if (GAMES.includes(p?.game)) socket.leave(`game:${p.game}`);
    });

    publishPresence();
    socket.on("disconnect", () => setTimeout(publishPresence, 500));
  });

  return io;
}
