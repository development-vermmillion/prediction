"use client";

import { useEffect, useState } from "react";
import { Lock, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { StakeInput } from "@/components/ui/stepper";
import { useGameConfig } from "@/hooks/use-game-config";
import { useGameSocket, useServerClock } from "@/hooks/use-game-socket";
import {
  COLOR_META,
  NUMBER_ODDS,
  primaryColor,
  type ColorBet,
  type ColorKey,
} from "@/lib/games/color-prediction";
import { emitAck } from "@/lib/socket";
import { cn, formatCoins } from "@/lib/utils";
import { toast } from "@/store/toast";

type Phase = "betting" | "locked" | "closed";
interface RoundState {
  phase: Phase;
  roundNo: number;
  serverTime: number;
  lockAt: number;
  endsAt: number;
  history: { id: number; result: number }[];
  stats: { players: number; pool: number };
}

const COLORS: ColorKey[] = ["green", "violet", "red"];

export function ColorGame() {
  const cfg = useGameConfig("color-prediction");
  const clock = useServerClock();
  const [round, setRound] = useState<RoundState | null>(null);
  const [mine, setMine] = useState<ColorBet[]>([]);
  const [stake, setStake] = useState(50);
  const [last, setLast] = useState<{ roundNo: number; result: number } | null>(null);
  const [, tick] = useState(0);

  const connected = useGameSocket("color-prediction", {
    "color:state": (s: RoundState & { mine: ColorBet[] }) => {
      clock.sync(s.serverTime);
      setRound(s);
      setMine(s.mine);
    },
    "color:phase": (s: RoundState) => {
      clock.sync(s.serverTime);
      setRound(s);
      if (s.phase === "betting") setMine([]);
    },
    "color:stats": (stats: { players: number; pool: number }) => setRound((r) => (r ? { ...r, stats } : r)),
    "color:result": (p: { roundNo: number; result: number; history: RoundState["history"] }) => {
      setLast({ roundNo: p.roundNo, result: p.result });
      setRound((r) => (r ? { ...r, history: p.history } : r));
    },
    "color:settled": (p: { result: number; total: number; stake: number }) => {
      if (p.total > 0) toast.success(`You won ${formatCoins(p.total)} credits`, `Result was ${p.result}`);
      else toast.error("No luck this round", `Result was ${p.result}`);
    },
  });

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  const phase = round?.phase ?? "closed";
  const left = round ? Math.max(0, round.endsAt - clock.now()) : 0;
  const locked = phase !== "betting";
  const disabled = !connected || locked || !cfg.enabled;

  const place = async (bet: Omit<ColorBet, "amount">) => {
    if (disabled) return;
    const res = await emitAck("color:bet", { bet: { ...bet, amount: stake } });
    if (!res.ok) toast.error("Bet not placed", res.error);
    else setMine(res.mine as ColorBet[]);
  };

  const myTotal = mine.reduce((a, b) => a + b.amount, 0);
  const stakeOn = (kind: "color" | "number", value: string | number) =>
    mine.filter((b) => b.kind === kind && b.value === value).reduce((a, b) => a + b.amount, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <GlassCard strong className="flex items-center justify-between p-5 md:p-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-white/50 uppercase">Round</p>
            <p className="font-display text-lg font-bold md:text-2xl">{round ? `#${round.roundNo}` : "—"}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
              <Users size={13} /> {round?.stats.players ?? 0} players · pool {formatCoins(round?.stats.pool ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-xs font-bold tracking-widest text-white/50 uppercase">
              {locked && <Lock size={12} />} {phase === "closed" ? "Game closed" : locked ? "Betting closed" : "Time left"}
            </p>
            <p className={cn("font-display text-3xl font-black tabular-nums md:text-4xl", locked && "text-brand-red")}>
              {round && phase !== "closed" ? `00:${String(Math.ceil(left / 1000)).padStart(2, "0")}` : "--:--"}
            </p>
          </div>
        </GlassCard>

        {last && (
          <div className="glass flex items-center justify-center gap-3 rounded-2xl p-3 text-sm">
            <span className="text-white/60">Last result (#{last.roundNo})</span>
            <span
              className="grid size-9 place-items-center rounded-full font-display font-black text-white"
              style={{ background: `radial-gradient(circle at 30% 25%, ${COLOR_META[primaryColor(last.result)].hex}, ${COLOR_META[primaryColor(last.result)].dark})` }}
            >
              {last.result}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {COLORS.map((c) => {
            const on = stakeOn("color", c);
            return (
              <button
                key={c}
                disabled={disabled}
                onClick={() => place({ kind: "color", value: c })}
                className="relative cursor-pointer rounded-3xl p-5 text-center font-extrabold text-white transition active:scale-95 disabled:opacity-40 md:p-7"
                style={{
                  background: `linear-gradient(145deg, ${COLOR_META[c].hex}, ${COLOR_META[c].dark})`,
                  boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.4), 0 18px 40px -14px ${COLOR_META[c].hex}`,
                }}
              >
                <span className="block text-lg md:text-2xl">{COLOR_META[c].label}</span>
                <span className="text-sm opacity-80">x{COLOR_META[c].odds}</span>
                {on > 0 && <span className="absolute -top-2 -right-2 rounded-full bg-white px-2 py-0.5 text-xs font-black text-black">{on}</span>}
              </button>
            );
          })}
        </div>

        <GlassCard className="p-5">
          <h3 className="mb-4 font-bold">
            Or pick a number <span className="text-sm font-normal text-white/50">· pays x{NUMBER_ODDS}</span>
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, n) => {
              const c = COLOR_META[primaryColor(n)];
              const on = stakeOn("number", n);
              return (
                <button
                  key={n}
                  disabled={disabled}
                  onClick={() => place({ kind: "number", value: n })}
                  className="relative aspect-square cursor-pointer rounded-full font-display text-xl font-black text-white transition hover:scale-105 active:scale-90 disabled:opacity-40"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, ${c.hex}, ${c.dark})`,
                    boxShadow: `0 8px 20px -8px ${c.hex}, inset 0 1px 0 rgb(255 255 255 / 0.4)`,
                  }}
                >
                  {n}
                  {on > 0 && <span className="absolute -top-1 -right-1 rounded-full bg-white px-1.5 text-[10px] font-black text-black">{on}</span>}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <StakeInput value={stake} onChange={setStake} color="#a78bfa" min={cfg.minBet} max={cfg.maxBet} />
          <p className="mt-4 text-sm text-white/60">
            Your bets this round: <span className="font-bold text-white">{formatCoins(myTotal)}</span> credits
            {mine.length > 0 && <span> · {mine.length} bet{mine.length > 1 ? "s" : ""}</span>}
          </p>
          {!cfg.enabled && <p className="mt-2 text-sm text-brand-gold">This game is temporarily closed by the owner.</p>}
        </GlassCard>
      </div>

      <GlassCard className="h-fit p-5">
        <h3 className="mb-4 font-bold">Recent results</h3>
        <ul className="space-y-2">
          {(round?.history ?? []).map((h) => {
            const c = COLOR_META[primaryColor(h.result)];
            return (
              <li key={h.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                <span className="font-display text-xs text-white/60">#{h.id}</span>
                <span
                  className="grid size-8 place-items-center rounded-full font-display text-sm font-black text-white"
                  style={{ background: `radial-gradient(circle at 30% 25%, ${c.hex}, ${c.dark})` }}
                >
                  {h.result}
                </span>
              </li>
            );
          })}
          {(round?.history.length ?? 0) === 0 && <li className="py-6 text-center text-sm text-white/45">No rounds yet.</li>}
        </ul>
      </GlassCard>
    </div>
  );
}
