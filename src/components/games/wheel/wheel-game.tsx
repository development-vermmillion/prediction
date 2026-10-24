"use client";

import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { StakeInput } from "@/components/ui/stepper";
import { useGameConfig } from "@/hooks/use-game-config";
import { useGameSocket, useServerClock } from "@/hooks/use-game-socket";
import {
  NUMBER_PAYOUT,
  OUTSIDE_BETS,
  segmentTone,
  SEGMENT_ANGLE,
  targetRotation,
  WHEEL_SEGMENTS,
  type OutsideBet,
  type WheelBet,
} from "@/lib/games/number-wheel";
import { emitAck } from "@/lib/socket";
import { cn, formatCoins } from "@/lib/utils";
import { toast } from "@/store/toast";

type Phase = "betting" | "spinning" | "result" | "closed";
interface WheelState {
  phase: Phase;
  roundNo: number;
  serverTime: number;
  bettingEndsAt: number;
  spinStartedAt: number;
  spinMs: number;
  result: number | null;
  jitter: number;
  history: number[];
  stats: { players: number; pool: number };
}

const TONES = { green: "#22e58b", red: "#ff2d55", navy: "#2a2a6e" } as const;
const R = 150;

function wedge(i: number) {
  const a0 = ((i * SEGMENT_ANGLE - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * SEGMENT_ANGLE - 90) * Math.PI) / 180;
  const p = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  return `M0 0 L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} Z`;
}

export function WheelGame() {
  const cfg = useGameConfig("number-wheel");
  const clock = useServerClock();
  const [round, setRound] = useState<WheelState | null>(null);
  const [mine, setMine] = useState<WheelBet[]>([]);
  const [stake, setStake] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const rotationRef = useRef(0);
  const spunRound = useRef(0);
  const [, tick] = useState(0);

  const animateTo = (s: WheelState) => {
    if (s.result === null || spunRound.current === s.roundNo) return;
    spunRound.current = s.roundNo;
    const elapsed = clock.now() - s.spinStartedAt;
    if (elapsed >= s.spinMs) {
      // Joined after the spin finished: just show the landing position.
      const next = targetRotation(rotationRef.current, s.result, 0, s.jitter);
      rotationRef.current = next;
      setSpinning(false);
      setRotation(next);
      return;
    }
    const next = targetRotation(rotationRef.current, s.result, 6, s.jitter);
    rotationRef.current = next;
    setSpinning(true);
    setRotation(next);
  };

  const connected = useGameSocket("number-wheel", {
    "wheel:state": (s: WheelState & { mine: WheelBet[] }) => {
      clock.sync(s.serverTime);
      setRound(s);
      setMine(s.mine);
      animateTo(s);
    },
    "wheel:phase": (s: WheelState) => {
      clock.sync(s.serverTime);
      setRound(s);
      if (s.phase === "betting") {
        setMine([]);
        setSpinning(false);
      }
      if (s.phase === "spinning") animateTo(s);
      if (s.phase === "result") setSpinning(false);
    },
    "wheel:stats": (stats: { players: number; pool: number }) => setRound((r) => (r ? { ...r, stats } : r)),
    "wheel:settled": (p: { result: number; total: number; stake: number }) => {
      if (p.total > 0) toast.success(`Landed on ${p.result}`, `You won ${formatCoins(p.total)} credits`);
      else toast.error(`Landed on ${p.result}`, "Better luck next spin.");
    },
  });

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  const phase = round?.phase ?? "closed";
  const left = phase === "betting" && round ? Math.max(0, round.bettingEndsAt - clock.now()) : 0;
  const disabled = !connected || phase !== "betting" || !cfg.enabled;

  const place = async (bet: Omit<WheelBet, "amount">) => {
    if (disabled) return;
    const res = await emitAck("wheel:bet", { bet: { ...bet, amount: stake } });
    if (!res.ok) toast.error("Bet not placed", res.error);
    else setMine(res.mine as WheelBet[]);
  };

  const onNumber = (n: number) => mine.filter((b) => b.kind === "number" && b.value === n).reduce((a, b) => a + b.amount, 0);
  const onOutside = (o: OutsideBet) => mine.filter((b) => b.kind === "outside" && b.value === o).reduce((a, b) => a + b.amount, 0);
  const total = mine.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <GlassCard strong className="grid place-items-center p-6 md:p-10" glow="rgb(34 211 238 / 0.35)">
        <div className="mb-4 flex w-full items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-white/55">
            <Users size={14} /> {round?.stats.players ?? 0} players · pool {formatCoins(round?.stats.pool ?? 0)}
          </span>
          <span className="font-display text-lg font-bold tabular-nums">
            {phase === "betting" ? `Bets close in ${Math.ceil(left / 1000)}s` : phase === "spinning" ? "Spinning…" : phase === "result" ? "Result" : "Closed"}
          </span>
        </div>
        <div className="relative w-full max-w-md">
          <svg viewBox="-170 -170 340 340" className="block w-full drop-shadow-[0_0_40px_rgba(34,211,238,0.4)]">
            <circle r="166" fill="#0c0818" stroke="#22d3ee" strokeOpacity="0.6" strokeWidth="3" />
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? `transform ${round?.spinMs ?? 6000}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : "none",
              }}
            >
              {Array.from({ length: WHEEL_SEGMENTS }, (_, i) => {
                const mid = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
                return (
                  <g key={i}>
                    <path d={wedge(i)} fill={TONES[segmentTone(i)]} stroke="#07050f" strokeWidth="2" />
                    <text
                      x={Math.cos(mid) * 118}
                      y={Math.sin(mid) * 118}
                      transform={`rotate(${(i + 0.5) * SEGMENT_ANGLE} ${Math.cos(mid) * 118} ${Math.sin(mid) * 118})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fff"
                      fontFamily="Orbitron, sans-serif"
                      fontWeight="900"
                      fontSize="22"
                    >
                      {i}
                    </text>
                  </g>
                );
              })}
              <circle r="34" fill="#0c0818" stroke="#ffc83d" strokeWidth="4" />
            </g>
            <path d="M-12 -172 L12 -172 L0 -146 Z" fill="#fff" stroke="#07050f" strokeWidth="2" />
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="font-display text-3xl font-black text-[#ffc83d]">
              {phase === "result" && round?.result != null ? round.result : phase === "spinning" ? "…" : "?"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {(round?.history ?? []).map((h, i) => (
            <span key={i} className="grid size-9 place-items-center rounded-full font-display text-sm font-bold" style={{ background: TONES[segmentTone(h)] }}>
              {h}
            </span>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard className="p-5">
          <h3 className="mb-3 font-bold">
            Pick numbers <span className="text-sm font-normal text-white/50">· pays x{NUMBER_PAYOUT}</span>
          </h3>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: WHEEL_SEGMENTS }, (_, n) => {
              const on = onNumber(n);
              return (
                <button
                  key={n}
                  disabled={disabled}
                  onClick={() => place({ kind: "number", value: n })}
                  className={cn(
                    "relative aspect-square cursor-pointer rounded-xl font-display font-bold text-white transition active:scale-90 disabled:opacity-50",
                    on ? "ring-2 ring-[#ffc83d]" : "",
                  )}
                  style={{ background: TONES[segmentTone(n)] }}
                >
                  {n}
                  {on > 0 && <span className="absolute -top-2 -right-2 rounded-full bg-[#ffc83d] px-1.5 text-[10px] font-black text-black">{on}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {OUTSIDE_BETS.map((o) => {
              const on = onOutside(o.id);
              return (
                <button
                  key={o.id}
                  disabled={disabled}
                  onClick={() => place({ kind: "outside", value: o.id })}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-3 text-left transition active:scale-95 disabled:opacity-50",
                    on ? "border-white/60 bg-white/15" : "border-white/10 bg-white/5",
                  )}
                >
                  <span className="block font-bold" style={{ color: o.hex }}>{o.label}</span>
                  <span className="text-xs text-white/50">
                    {o.hint} · x{o.odds}
                    {on ? ` · ${on}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="space-y-4 p-5">
          <StakeInput value={stake} onChange={setStake} color="#22d3ee" min={cfg.minBet} max={cfg.maxBet} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Your total stake this spin</span>
            <span className="font-display text-lg font-bold">{formatCoins(total)}</span>
          </div>
          <p className="text-xs text-white/45">Tap a number or box to add one chip of your stake. Bets lock when the timer ends.</p>
          {!cfg.enabled && <p className="text-sm text-brand-gold">This game is temporarily closed by the owner.</p>}
        </GlassCard>
      </div>
    </div>
  );
}
