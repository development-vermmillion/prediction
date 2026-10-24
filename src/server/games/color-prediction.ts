import type { Server, Socket } from "socket.io";
import {
  COLOR_LOCK_MS,
  COLOR_ROUND_MS,
  isColorBet,
  settleColorBet,
  type ColorBet,
} from "@/lib/games/color-prediction";
import { checkStake, getConfig } from "../config";
import { get } from "../db";
import { pushWin } from "../feed";
import { recentResults, recordRound } from "../rounds";
import { assertCanPlay, GameError, handle, secureFloat, userOf } from "../socket-utils";
import { placeStake, settleStake } from "../wallet";

type Phase = "betting" | "locked" | "closed";

interface Placed {
  openId: number;
  userId: number;
  name: string;
  bet: ColorBet;
}

const GAME = "color-prediction";
const ROOM = "game:color-prediction";
const MAX_BETS_PER_ROUND = 20;

/** Shared Color Prediction rounds: every player bets on, and sees, the same result. */
export class ColorEngine {
  private phase: Phase = "closed";
  private roundNo = 0;
  private lockAt = 0;
  private endsAt = 0;
  private placed: Placed[] = [];
  private history: { id: number; result: number }[];
  private timer?: NodeJS.Timeout;
  private statsTimer?: NodeJS.Timeout;

  constructor(private io: Server) {
    this.history = recentResults(GAME, 15).map((r) => ({ id: r.id, result: parseInt(r.result, 10) }));
    this.roundNo = get<{ n: number }>("SELECT COUNT(*) AS n FROM rounds WHERE game = ?", GAME)?.n ?? 0;
    this.begin();
  }

  private stats() {
    const players = new Set(this.placed.map((p) => p.userId)).size;
    const pool = this.placed.reduce((a, p) => a + p.bet.amount, 0);
    return { players, pool };
  }

  private phasePayload() {
    return {
      phase: this.phase,
      roundNo: this.roundNo,
      serverTime: Date.now(),
      lockAt: this.lockAt,
      endsAt: this.endsAt,
      history: this.history,
      stats: this.stats(),
    };
  }

  private mine(userId: number) {
    return this.placed.filter((p) => p.userId === userId).map((p) => p.bet);
  }

  snapshot(socket: Socket) {
    socket.emit("color:state", { ...this.phasePayload(), mine: this.mine(userOf(socket).id) });
  }

  private scheduleStats() {
    if (this.statsTimer) return;
    this.statsTimer = setTimeout(() => {
      this.statsTimer = undefined;
      this.io.to(ROOM).emit("color:stats", this.stats());
    }, 300);
  }

  private begin() {
    this.placed = [];
    if (!getConfig(GAME).enabled) {
      this.phase = "closed";
      this.io.to(ROOM).emit("color:phase", this.phasePayload());
      this.timer = setTimeout(() => this.begin(), 5000);
      return;
    }
    this.roundNo++;
    this.phase = "betting";
    const now = Date.now();
    this.endsAt = now + COLOR_ROUND_MS;
    this.lockAt = this.endsAt - COLOR_LOCK_MS;
    this.io.to(ROOM).emit("color:phase", this.phasePayload());
    this.timer = setTimeout(() => {
      this.phase = "locked";
      this.io.to(ROOM).emit("color:phase", this.phasePayload());
      this.timer = setTimeout(() => this.finish(), COLOR_LOCK_MS);
    }, COLOR_ROUND_MS - COLOR_LOCK_MS);
  }

  private finish() {
    const result = Math.floor(secureFloat() * 10);
    const byUser = new Map<number, { bet: ColorBet; payout: number }[]>();
    let wagered = 0;
    let paid = 0;
    const names = new Map<number, string>();
    for (const p of this.placed) {
      const payout = settleColorBet(p.bet, result);
      settleStake(p.openId, p.userId, GAME, payout, `Color #${this.roundNo} · ${p.bet.kind} ${p.bet.value}`);
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
      this.io.to(`user:${userId}`).emit("color:settled", {
        roundNo: this.roundNo,
        result,
        total,
        stake,
        bets: list.map((x) => ({ ...x.bet, payout: x.payout })),
      });
      if (total - stake >= 100) {
        pushWin({ name: names.get(userId) ?? "Player", game: "Color Prediction", detail: `hit ${result}`, amount: total });
      }
    }
    const id = recordRound(GAME, String(result), byUser.size, wagered, paid);
    this.history = [{ id, result }, ...this.history].slice(0, 15);
    this.io.to(ROOM).emit("color:result", { roundNo: this.roundNo, result, history: this.history });
    this.begin();
  }

  register(socket: Socket) {
    const user = userOf(socket);

    handle<{ bet: ColorBet }>(socket, "color:bet", (p) => {
      assertCanPlay(user.id);
      if (this.phase !== "betting") throw new GameError("Betting is closed for this round");
      if (!isColorBet(p?.bet)) throw new GameError("Invalid bet");
      const err = checkStake(GAME, p.bet.amount);
      if (err) throw new GameError(err);
      if (this.mine(user.id).length >= MAX_BETS_PER_ROUND) throw new GameError("Too many bets this round");
      const bet = { ...p.bet } as ColorBet;
      const openId = placeStake(user.id, GAME, bet.amount, `Color #${this.roundNo} · ${bet.kind} ${bet.value}`);
      this.placed.push({ openId, userId: user.id, name: user.name, bet });
      this.scheduleStats();
      return { mine: this.mine(user.id) };
    });
  }
}
