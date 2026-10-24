import crypto from "node:crypto";
import type { Server, Socket } from "socket.io";
import {
  activeColors,
  applyMove,
  autoPick,
  hasWon,
  legalMoves,
  MAX_IDLE_TURNS,
  newGame,
  nextColor,
  PLAYER_META,
  seatColors,
  TOKENS_PER_PLAYER,
  TURN_MS,
  type LudoGameState,
  type LudoSize,
} from "@/lib/games/ludo";
import type { PlayerColor } from "@/types";
import { checkStake, getConfig } from "../config";
import { pushWin } from "../feed";
import { recordRound } from "../rounds";
import { assertCanPlay, GameError, handle, userOf } from "../socket-utils";
import { placeStake, refundStake, settleStake } from "../wallet";

const GAME = "ludo";
const LOBBY = "ludo:lobby";
const MAX_WAITING_TABLES = 60;
const WAITING_TTL_MS = 10 * 60_000;

interface Seat {
  color: PlayerColor;
  userId: number;
  name: string;
  openId: number;
  idle: number;
  flagged: boolean;
}

interface Table {
  id: string;
  size: LudoSize;
  stake: number;
  seats: Seat[];
  status: "waiting" | "playing" | "finished";
  game: LudoGameState | null;
  deadline: number;
  createdAt: number;
  winner: PlayerColor | null;
  prize: number;
  timer?: NodeJS.Timeout;
}

const tableRoom = (id: string) => `ludo:table:${id}`;

/**
 * Real-time Ludo. Players open or join 2- or 4-player tables with a stake; once a table is full
 * the server runs the game: it rolls the dice, validates every move and pays the winner
 * (pot minus the house rake). Idle players are auto-played and eventually forfeit.
 */
export class LudoEngine {
  private tables = new Map<string, Table>();
  private userTable = new Map<number, string>();
  private seq = 0;

  constructor(private io: Server) {
    setInterval(() => this.sweepWaiting(), 30_000).unref();
  }

  /* ---------------- payloads ---------------- */

  private prizeFor(t: Table) {
    const pot = t.stake * t.size;
    return pot - Math.floor((pot * getConfig(GAME).rake) / 100);
  }

  private lobby() {
    return [...this.tables.values()]
      .filter((t) => t.status === "waiting")
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((t) => ({
        id: t.id,
        size: t.size,
        stake: t.stake,
        prize: this.prizeFor(t),
        seats: t.seats.map((s) => ({ color: s.color, name: s.name })),
      }));
  }

  private tablePayload(t: Table) {
    return {
      id: t.id,
      size: t.size,
      stake: t.stake,
      status: t.status,
      prize: t.status === "finished" ? t.prize : this.prizeFor(t),
      seats: t.seats.map((s) => ({ color: s.color, userId: s.userId, name: s.name, idle: s.idle })),
      game: t.game,
      deadline: t.deadline,
      serverTime: Date.now(),
      winner: t.winner,
    };
  }

  private broadcastLobby() {
    this.io.to(LOBBY).emit("ludo:lobby", { tables: this.lobby() });
  }

  private broadcastTable(t: Table) {
    this.io.to(tableRoom(t.id)).emit("ludo:table", this.tablePayload(t));
  }

  snapshot(socket: Socket) {
    const user = userOf(socket);
    socket.join(LOBBY);
    socket.emit("ludo:lobby", { tables: this.lobby() });
    const tid = this.userTable.get(user.id);
    const t = tid ? this.tables.get(tid) : undefined;
    if (t) {
      socket.join(tableRoom(t.id));
      socket.emit("ludo:table", this.tablePayload(t));
    } else {
      socket.emit("ludo:table", null);
    }
  }

  /* ---------------- lobby actions ---------------- */

  private seat(t: Table, user: { id: number; name: string }, openId: number) {
    const used = new Set(t.seats.map((s) => s.color));
    const color = seatColors(t.size).find((c) => !used.has(c)) as PlayerColor;
    t.seats.push({ color, userId: user.id, name: user.name, openId, idle: 0, flagged: false });
    this.userTable.set(user.id, t.id);
    this.io.in(`user:${user.id}`).socketsJoin(tableRoom(t.id));
  }

  private create(user: { id: number; name: string }, size: unknown, stake: unknown) {
    assertCanPlay(user.id);
    if (this.userTable.has(user.id)) throw new GameError("You are already at a table");
    if (size !== 2 && size !== 4) throw new GameError("Choose a 2 or 4 player table");
    const err = checkStake(GAME, stake);
    if (err) throw new GameError(err);
    if ([...this.tables.values()].filter((t) => t.status === "waiting").length >= MAX_WAITING_TABLES) {
      throw new GameError("The lobby is full — join an existing table");
    }
    const amount = stake as number;
    const t: Table = {
      id: `t${++this.seq}${crypto.randomBytes(2).toString("hex")}`,
      size,
      stake: amount,
      seats: [],
      status: "waiting",
      game: null,
      deadline: 0,
      createdAt: Date.now(),
      winner: null,
      prize: 0,
    };
    const openId = placeStake(user.id, GAME, amount, `Ludo table ${t.id} entry`);
    this.tables.set(t.id, t);
    this.seat(t, user, openId);
    this.broadcastLobby();
    this.broadcastTable(t);
  }

  private join(user: { id: number; name: string }, tableId: unknown) {
    assertCanPlay(user.id);
    if (this.userTable.has(user.id)) throw new GameError("You are already at a table");
    const t = typeof tableId === "string" ? this.tables.get(tableId) : undefined;
    if (!t || t.status !== "waiting") throw new GameError("That table is no longer open");
    if (t.seats.length >= t.size) throw new GameError("That table is full");
    const err = checkStake(GAME, t.stake);
    if (err) throw new GameError(err);
    const openId = placeStake(user.id, GAME, t.stake, `Ludo table ${t.id} entry`);
    this.seat(t, user, openId);
    if (t.seats.length === t.size) this.start(t);
    else this.broadcastTable(t);
    this.broadcastLobby();
  }

  private leave(userId: number) {
    const t = this.tables.get(this.userTable.get(userId) ?? "");
    if (!t) throw new GameError("You are not at a table");
    if (t.status !== "waiting") throw new GameError("The game has started — you cannot leave without forfeiting");
    this.cancelSeat(t, userId, "Ludo table left");
    this.broadcastLobby();
  }

  private cancelSeat(t: Table, userId: number, note: string) {
    const seat = t.seats.find((s) => s.userId === userId);
    if (!seat) return;
    refundStake(seat.openId, seat.userId, GAME, t.stake, note);
    t.seats = t.seats.filter((s) => s.userId !== userId);
    this.userTable.delete(userId);
    this.io.to(`user:${userId}`).emit("ludo:table", null);
    this.io.in(`user:${userId}`).socketsLeave(tableRoom(t.id));
    if (t.seats.length === 0) this.tables.delete(t.id);
    else this.broadcastTable(t);
  }

  private sweepWaiting() {
    const now = Date.now();
    for (const t of [...this.tables.values()]) {
      if (t.status === "waiting" && now - t.createdAt > WAITING_TTL_MS) {
        for (const s of [...t.seats]) this.cancelSeat(t, s.userId, "Ludo table expired — stake refunded");
        this.tables.delete(t.id);
        this.broadcastLobby();
      }
    }
  }

  /* ---------------- game flow ---------------- */

  private schedule(t: Table, ms: number, fn: () => void) {
    if (t.timer) clearTimeout(t.timer);
    t.timer = setTimeout(() => {
      t.timer = undefined;
      if (t.status === "playing") fn();
    }, ms);
  }

  private seatOf(t: Table, color: PlayerColor) {
    return t.seats.find((s) => s.color === color) as Seat;
  }

  private start(t: Table) {
    t.status = "playing";
    t.game = newGame(t.size);
    t.game.log = ["Game on! Roll a 6 to bring a token out."];
    this.armTurn(t);
  }

  /** Wait for the current player to act (roll or pick a token). */
  private armTurn(t: Table) {
    const g = t.game as LudoGameState;
    if (g.phase === "roll") this.seatOf(t, g.turn).flagged = false;
    t.deadline = Date.now() + TURN_MS;
    this.broadcastTable(t);
    this.schedule(t, TURN_MS, () => this.onTimeout(t));
  }

  private onTimeout(t: Table) {
    const g = t.game as LudoGameState;
    const seat = this.seatOf(t, g.turn);
    if (g.phase === "roll") {
      seat.idle++;
      seat.flagged = true;
      if (seat.idle >= MAX_IDLE_TURNS) return this.eliminate(t, seat);
      g.log = [`${PLAYER_META[g.turn].label} ran out of time — auto-rolled`, ...g.log].slice(0, 8);
      this.doRoll(t);
    } else {
      if (!seat.flagged) seat.idle++;
      if (seat.idle >= MAX_IDLE_TURNS) return this.eliminate(t, seat);
      this.doMove(t, autoPick(g));
    }
  }

  private clearTimer(t: Table) {
    if (t.timer) clearTimeout(t.timer);
    t.timer = undefined;
  }

  private doRoll(t: Table) {
    this.clearTimer(t);
    const g = t.game as LudoGameState;
    const color = g.turn;
    const label = PLAYER_META[color].label;
    const roll = crypto.randomInt(1, 7);
    g.roll = roll;
    g.phase = "move";
    g.sixStreak = roll === 6 ? g.sixStreak + 1 : 0;
    g.log = [`${label} rolled a ${roll}`, ...g.log].slice(0, 8);

    if (roll === 6 && g.sixStreak >= 3) {
      g.legal = [];
      g.log = [`${label} rolled three sixes — turn lost`, ...g.log].slice(0, 8);
      t.deadline = Date.now() + 1200;
      this.broadcastTable(t);
      return this.schedule(t, 1200, () => this.endTurn(t));
    }

    g.legal = legalMoves(g.tokens[color], roll);
    if (g.legal.length === 0) {
      g.log = [`${label} has no move`, ...g.log].slice(0, 8);
      t.deadline = Date.now() + 1200;
      this.broadcastTable(t);
      return this.schedule(t, 1200, () => this.endTurn(t));
    }
    if (g.legal.length === 1) {
      t.deadline = Date.now() + 800;
      this.broadcastTable(t);
      const only = g.legal[0];
      return this.schedule(t, 800, () => this.doMove(t, only));
    }
    this.armTurn(t);
  }

  private doMove(t: Table, tokenIndex: number) {
    this.clearTimer(t);
    const g = t.game as LudoGameState;
    const color = g.turn;
    const label = PLAYER_META[color].label;
    const res = applyMove(g, tokenIndex);
    const notes = [`${label} moved token ${tokenIndex + 1}`];
    for (const c of res.captured) notes.push(`captured ${PLAYER_META[c.color].label}'s token!`);
    if (res.reachedHome) notes.push("a token is home!");
    g.log = [notes.join(" — "), ...g.log].slice(0, 8);
    g.legal = [];

    if (hasWon(g, color)) return this.finish(t, color);
    if (res.extraTurn) {
      g.phase = "roll";
      return this.armTurn(t);
    }
    this.endTurn(t);
  }

  private endTurn(t: Table) {
    const g = t.game as LudoGameState;
    g.turn = nextColor(g);
    g.sixStreak = 0;
    g.phase = "roll";
    g.legal = [];
    this.armTurn(t);
  }

  private eliminate(t: Table, seat: Seat) {
    const g = t.game as LudoGameState;
    g.eliminated.push(seat.color);
    g.tokens[seat.color] = Array(TOKENS_PER_PLAYER).fill(-1);
    g.log = [`${seat.name} was inactive and forfeited`, ...g.log].slice(0, 8);
    const active = activeColors(g);
    if (active.length === 1) return this.finish(t, active[0]);
    if (g.turn === seat.color) return this.endTurn(t);
    this.broadcastTable(t);
  }

  private finish(t: Table, winner: PlayerColor) {
    if (t.timer) clearTimeout(t.timer);
    t.timer = undefined;
    const g = t.game as LudoGameState;
    g.winner = winner;
    g.phase = "roll";
    g.legal = [];
    t.status = "finished";
    t.winner = winner;
    const pot = t.stake * t.seats.length;
    const rake = Math.floor((pot * getConfig(GAME).rake) / 100);
    t.prize = pot - rake;
    for (const s of t.seats) {
      const won = s.color === winner;
      settleStake(s.openId, s.userId, GAME, won ? t.prize : 0, won ? `Ludo win · table ${t.id}` : `Ludo loss · table ${t.id}`);
      this.userTable.delete(s.userId);
    }
    const w = this.seatOf(t, winner);
    recordRound(GAME, `${PLAYER_META[winner].label} (${w.name})`, t.seats.length, pot, t.prize);
    if (t.prize - t.stake >= 100) {
      pushWin({ name: w.name, game: "Ludo", detail: `won a ${t.size}-player table`, amount: t.prize });
    }
    this.broadcastTable(t);
    this.broadcastLobby();
    setTimeout(() => {
      this.io.in(tableRoom(t.id)).socketsLeave(tableRoom(t.id));
      this.tables.delete(t.id);
    }, 60_000).unref();
  }

  /* ---------------- player actions ---------------- */

  private activeTable(userId: number) {
    const t = this.tables.get(this.userTable.get(userId) ?? "");
    if (!t || t.status !== "playing" || !t.game) throw new GameError("You are not in a running game");
    return t;
  }

  register(socket: Socket) {
    const user = userOf(socket);

    handle<{ size: number; stake: number }>(socket, "ludo:create", (p) => this.create(user, p?.size, p?.stake));
    handle<{ tableId: string }>(socket, "ludo:join", (p) => this.join(user, p?.tableId));
    handle(socket, "ludo:leave", () => this.leave(user.id));

    handle(socket, "ludo:roll", () => {
      const t = this.activeTable(user.id);
      const g = t.game as LudoGameState;
      const seat = this.seatOf(t, g.turn);
      if (seat.userId !== user.id) throw new GameError("It is not your turn");
      if (g.phase !== "roll") throw new GameError("Pick a token to move");
      seat.idle = 0;
      this.doRoll(t);
    });

    handle<{ token: number }>(socket, "ludo:move", (p) => {
      const t = this.activeTable(user.id);
      const g = t.game as LudoGameState;
      const seat = this.seatOf(t, g.turn);
      if (seat.userId !== user.id) throw new GameError("It is not your turn");
      if (g.phase !== "move" || !g.legal.includes(p?.token)) throw new GameError("That token cannot move");
      seat.idle = 0;
      this.doMove(t, p.token);
    });
  }
}

