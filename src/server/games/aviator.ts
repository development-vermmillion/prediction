import type { Server, Socket } from "socket.io";
import {
  AVIATOR_BETTING_MS,
  AVIATOR_CRASH_PAUSE_MS,
  generateCrashPoint,
  multiplierAt,
  timeToMultiplier,
} from "@/lib/games/aviator";
import { checkStake, getConfig } from "../config";
import { pushWin } from "../feed";
import { recentResults, recordRound } from "../rounds";
import { assertCanPlay, GameError, handle, secureFloat, userOf } from "../socket-utils";
import { placeStake, refundStake, settleStake } from "../wallet";

type Phase = "betting" | "flying" | "crashed" | "closed";

interface Bet {
  openId: number;
  userId: number;
  name: string;
  amount: number;
  autoCash: number | null;
  cashedAt: number | null;
  payout: number;
}

const GAME = "aviator";
const ROOM = "game:aviator";

/**
 * One shared Aviator table for everybody: a 60-second betting window, then a flight that
 * every client animates from the same server timestamp, then a short "flew away" pause.
 * The crash point is drawn with a CSPRNG at the start of the round and only revealed on crash.
 */
export class AviatorEngine {
  private phase: Phase = "closed";
  private roundId = 0;
  private bettingEndsAt = 0;
  private startedAt = 0;
  private crashPoint = 1;
  private crashAtMs = 0;
  private bets = new Map<number, Bet>();
  private history: number[];
  private timer?: NodeJS.Timeout;
  private ticker?: NodeJS.Timeout;
  private betsTimer?: NodeJS.Timeout;

  constructor(private io: Server) {
    this.history = recentResults(GAME, 15).map((r) => parseFloat(r.result));
    this.beginBetting();
  }

  /* ---------------- state ---------------- */

  private publicBets() {
    return [...this.bets.values()].map((b) => ({
      userId: b.userId,
      name: b.name,
      amount: b.amount,
      cashedAt: b.cashedAt,
      payout: b.payout,
    }));
  }

  private phasePayload() {
    return {
      phase: this.phase,
      roundId: this.roundId,
      serverTime: Date.now(),
      bettingEndsAt: this.bettingEndsAt,
      startedAt: this.startedAt,
      crashPoint: this.phase === "crashed" ? this.crashPoint : null,
      history: this.history,
    };
  }

  snapshot(socket: Socket) {
    const me = this.bets.get(userOf(socket).id);
    socket.emit("aviator:state", {
      ...this.phasePayload(),
      bets: this.publicBets(),
      mine: me ? { amount: me.amount, autoCash: me.autoCash, cashedAt: me.cashedAt, payout: me.payout } : null,
    });
  }

  private broadcastPhase() {
    this.io.to(ROOM).emit("aviator:phase", this.phasePayload());
  }

  private scheduleBetsBroadcast() {
    if (this.betsTimer) return;
    this.betsTimer = setTimeout(() => {
      this.betsTimer = undefined;
      this.io.to(ROOM).emit("aviator:bets", { bets: this.publicBets() });
    }, 120);
  }

  /* ---------------- round loop ---------------- */

  private beginBetting() {
    const cfg = getConfig(GAME);
    this.bets.clear();
    if (!cfg.enabled) {
      this.phase = "closed";
      this.broadcastPhase();
      this.io.to(ROOM).emit("aviator:bets", { bets: [] });
      this.timer = setTimeout(() => this.beginBetting(), 5000);
      return;
    }
    this.roundId++;
    this.phase = "betting";
    this.bettingEndsAt = Date.now() + AVIATOR_BETTING_MS;
    this.startedAt = 0;
    this.crashPoint = generateCrashPoint(secureFloat, Math.min(0.99, Math.max(0.8, cfg.rtp / 100)));
    this.crashAtMs = timeToMultiplier(this.crashPoint);
    this.broadcastPhase();
    this.io.to(ROOM).emit("aviator:bets", { bets: [] });
    this.timer = setTimeout(() => this.startFlight(), AVIATOR_BETTING_MS);
  }

  private startFlight() {
    this.phase = "flying";
    this.startedAt = Date.now();
    this.broadcastPhase();
    this.ticker = setInterval(() => this.onTick(), 50);
  }

  private onTick() {
    const elapsed = Date.now() - this.startedAt;
    if (elapsed >= this.crashAtMs) return this.crash();
    const m = multiplierAt(elapsed);
    for (const bet of this.bets.values()) {
      if (bet.cashedAt === null && bet.autoCash !== null && bet.autoCash <= this.crashPoint && m >= bet.autoCash) {
        this.cashOut(bet, bet.autoCash);
      }
    }
  }

  private cashOut(bet: Bet, multiplier: number) {
    const payout = Math.floor(bet.amount * multiplier);
    bet.cashedAt = multiplier;
    bet.payout = payout;
    settleStake(bet.openId, bet.userId, GAME, payout, `Aviator cash-out @ ${multiplier.toFixed(2)}x`);
    this.io.to(`user:${bet.userId}`).emit("aviator:cashed", { multiplier, payout });
    if (payout - bet.amount >= 100) {
      pushWin({ name: bet.name, game: "Aviator", detail: `cashed out at ${multiplier.toFixed(2)}x`, amount: payout });
    }
    this.scheduleBetsBroadcast();
  }

  private crash() {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = undefined;
    this.phase = "crashed";
    let wagered = 0;
    let paid = 0;
    for (const bet of this.bets.values()) {
      wagered += bet.amount;
      if (bet.cashedAt === null) settleStake(bet.openId, bet.userId, GAME, 0, "Aviator crash");
      else paid += bet.payout;
    }
    recordRound(GAME, `${this.crashPoint.toFixed(2)}x`, this.bets.size, wagered, paid);
    this.history = [this.crashPoint, ...this.history].slice(0, 15);
    this.broadcastPhase();
    this.io.to(ROOM).emit("aviator:bets", { bets: this.publicBets() });
    this.timer = setTimeout(() => this.beginBetting(), AVIATOR_CRASH_PAUSE_MS);
  }

  /* ---------------- player actions ---------------- */

  register(socket: Socket) {
    const user = userOf(socket);

    handle<{ amount: number; autoCash?: number | null }>(socket, "aviator:bet", (p) => {
      assertCanPlay(user.id);
      if (this.phase !== "betting") throw new GameError("Betting is closed — wait for the next round");
      if (this.bets.has(user.id)) throw new GameError("You already have a bet in this round");
      const err = checkStake(GAME, p?.amount);
      if (err) throw new GameError(err);
      let autoCash: number | null = null;
      if (p.autoCash != null) {
        if (typeof p.autoCash !== "number" || !(p.autoCash >= 1.1 && p.autoCash <= 1000)) {
          throw new GameError("Auto cash-out must be between 1.10x and 1000x");
        }
        autoCash = Math.floor(p.autoCash * 100) / 100;
      }
      const openId = placeStake(user.id, GAME, p.amount, `Aviator bet · round ${this.roundId}`);
      this.bets.set(user.id, { openId, userId: user.id, name: user.name, amount: p.amount, autoCash, cashedAt: null, payout: 0 });
      this.scheduleBetsBroadcast();
      return { mine: { amount: p.amount, autoCash, cashedAt: null, payout: 0 } };
    });

    handle(socket, "aviator:cancel", () => {
      const bet = this.bets.get(user.id);
      if (this.phase !== "betting" || !bet) throw new GameError("Nothing to cancel");
      refundStake(bet.openId, user.id, GAME, bet.amount, "Aviator bet cancelled");
      this.bets.delete(user.id);
      this.scheduleBetsBroadcast();
    });

    handle(socket, "aviator:cashout", () => {
      const bet = this.bets.get(user.id);
      if (this.phase !== "flying" || !bet) throw new GameError("No active bet to cash out");
      if (bet.cashedAt !== null) throw new GameError("Already cashed out");
      const elapsed = Date.now() - this.startedAt;
      if (elapsed >= this.crashAtMs) throw new GameError("Too late — the plane flew away");
      const m = Math.max(1, Math.floor(multiplierAt(elapsed) * 100) / 100);
      this.cashOut(bet, m);
      return { multiplier: m, payout: bet.payout };
    });
  }
}
