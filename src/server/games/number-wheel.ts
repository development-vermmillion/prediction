import type { Server, Socket } from "socket.io";
import {
  isWheelBet,
  SEGMENT_ANGLE,
  settleWheelBet,
  WHEEL_BETTING_MS,
  WHEEL_RESULT_MS,
  WHEEL_SEGMENTS,
  WHEEL_SPIN_MS,
  type WheelBet,
} from "@/lib/games/number-wheel";
import { checkStake, getConfig } from "../config";
import { get } from "../db";
import { pushWin } from "../feed";
import { recentResults, recordRound } from "../rounds";
import { assertCanPlay, GameError, handle, secureFloat, userOf } from "../socket-utils";
import { placeStake, settleStake } from "../wallet";

type Phase = "betting" | "spinning" | "result" | "closed";

interface Placed {
  openId: number;
  userId: number;
  name: string;
  bet: WheelBet;
}

const GAME = "number-wheel";
const ROOM = "game:number-wheel";
const MAX_BETS_PER_ROUND = 30;

/** Shared Number Wheel: one spin for the whole table; everyone sees the same landing. */
export class WheelEngine {
  private phase: Phase = "closed";
  private roundNo = 0;
  private bettingEndsAt = 0;
  private spinStartedAt = 0;
  private result: number | null = null;
  private jitter = 0;
  private placed: Placed[] = [];
  private history: number[];
  private timer?: NodeJS.Timeout;
  private statsTimer?: NodeJS.Timeout;

  constructor(private io: Server) {
    this.history = recentResults(GAME, 12).map((r) => parseInt(r.result, 10));
    this.roundNo = get<{ n: number }>("SELECT COUNT(*) AS n FROM rounds WHERE game = ?", GAME)?.n ?? 0;
    this.begin();
  }

  private stats() {
    return {
      players: new Set(this.placed.map((p) => p.userId)).size,
      pool: this.placed.reduce((a, p) => a + p.bet.amount, 0),
    };
  }

  private phasePayload() {
    const reveal = this.phase === "spinning" || this.phase === "result";
    return {
      phase: this.phase,
      roundNo: this.roundNo,
      serverTime: Date.now(),
      bettingEndsAt: this.bettingEndsAt,
      spinStartedAt: this.spinStartedAt,
      spinMs: WHEEL_SPIN_MS,
      result: reveal ? this.result : null,
      jitter: reveal ? this.jitter : 0,
      history: this.history,
      stats: this.stats(),
    };
  }

  private mine(userId: number) {
    return this.placed.filter((p) => p.userId === userId).map((p) => p.bet);
  }

  snapshot(socket: Socket) {
    socket.emit("wheel:state", { ...this.phasePayload(), mine: this.mine(userOf(socket).id) });
  }

  private scheduleStats() {
    if (this.statsTimer) return;
    this.statsTimer = setTimeout(() => {
      this.statsTimer = undefined;
      this.io.to(ROOM).emit("wheel:stats", this.stats());
    }, 300);
  }

  private begin() {
    this.placed = [];
    this.result = null;
    if (!getConfig(GAME).enabled) {
      this.phase = "closed";
      this.io.to(ROOM).emit("wheel:phase", this.phasePayload());
      this.timer = setTimeout(() => this.begin(), 5000);
      return;
    }
    this.roundNo++;
    this.phase = "betting";
    this.bettingEndsAt = Date.now() + WHEEL_BETTING_MS;
    this.io.to(ROOM).emit("wheel:phase", this.phasePayload());
    this.timer = setTimeout(() => this.spin(), WHEEL_BETTING_MS);
  }

  private spin() {
    this.result = Math.floor(secureFloat() * WHEEL_SEGMENTS);
    this.jitter = (secureFloat() - 0.5) * SEGMENT_ANGLE * 0.6;
    this.phase = "spinning";
    this.spinStartedAt = Date.now();
    this.io.to(ROOM).emit("wheel:phase", this.phasePayload());
    this.timer = setTimeout(() => this.settle(), WHEEL_SPIN_MS);
  }

  private settle() {
    const result = this.result as number;
    const byUser = new Map<number, { bet: WheelBet; payout: number }[]>();
    const names = new Map<number, string>();
    let wagered = 0;
    let paid = 0;
    for (const p of this.placed) {
      const payout = settleWheelBet(p.bet, result);
      settleStake(p.openId, p.userId, GAME, payout, `Wheel #${this.roundNo} · ${p.bet.kind} ${p.bet.value}`);
      wagered += p.bet.amount;
      paid += payout;
      names.set(p.userId, p.name);
      const list = byUser.get(p.userId) ?? [];
      list.push({ bet: p.bet, payout });
      byUser.set(p.userId, list);
    }
    for (const [userId, list] of byUser) {
      const total = list.reduce((a, x) => a + x.payout, 0);
      const stake = list.reduce((a, x) => a + x.bet.amount, 0);
      this.io.to(`user:${userId}`).emit("wheel:settled", { roundNo: this.roundNo, result, total, stake });
      if (total - stake >= 100) {
        pushWin({ name: names.get(userId) ?? "Player", game: "Number Wheel", detail: `landed on ${result}`, amount: total });
      }
    }
    recordRound(GAME, String(result), byUser.size, wagered, paid);
    this.history = [result, ...this.history].slice(0, 12);
    this.phase = "result";
    this.io.to(ROOM).emit("wheel:phase", this.phasePayload());
    this.timer = setTimeout(() => this.begin(), WHEEL_RESULT_MS);
  }

  register(socket: Socket) {
    const user = userOf(socket);

    handle<{ bet: WheelBet }>(socket, "wheel:bet", (p) => {
      assertCanPlay(user.id);
      if (this.phase !== "betting") throw new GameError("Betting is closed for this spin");
      if (!isWheelBet(p?.bet)) throw new GameError("Invalid bet");
      const err = checkStake(GAME, p.bet.amount);
      if (err) throw new GameError(err);
      if (this.mine(user.id).length >= MAX_BETS_PER_ROUND) throw new GameError("Too many bets this spin");
      const bet = { ...p.bet } as WheelBet;
      const openId = placeStake(user.id, GAME, bet.amount, `Wheel #${this.roundNo} · ${bet.kind} ${bet.value}`);
      this.placed.push({ openId, userId: user.id, name: user.name, bet });
      this.scheduleStats();
      return { mine: this.mine(user.id) };
    });
  }
}
