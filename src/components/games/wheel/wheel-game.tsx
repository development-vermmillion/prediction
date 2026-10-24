"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StakeInput } from "@/components/ui/stepper";
import {
  NUMBER_PAYOUT,
  OUTSIDE_BETS,
  segmentTone,
  SEGMENT_ANGLE,
  settleWheel,
  SPIN_MS,
  spinResult,
  targetRotation,
  totalStake,
  WHEEL_SEGMENTS,
  type OutsideBet,
  type WheelBets,
} from "@/lib/games/number-wheel";
import { cn, formatCoins } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useWallet } from "@/store/wallet";

const TONES = { green: "#22e58b", red: "#ff2d55", navy: "#2a2a6e" } as const;
const R = 150;

function wedge(i: number) {
  const a0 = ((i * SEGMENT_ANGLE - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * SEGMENT_ANGLE - 90) * Math.PI) / 180;
  const p = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  return `M0 0 L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} Z`;
}

export function WheelGame() {
  const placeBet = useWallet((s) => s.placeBet);
  const credit = useWallet((s) => s.credit);

  const [stake, setStake] = useState(50);
  const [bets, setBets] = useState<WheelBets>({ numbers: {}, outside: {} });
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([4, 11, 7, 0, 2, 9]);

  const total = totalStake(bets);

  const addNumber = (n: number) => setBets((b) => ({ ...b, numbers: { ...b.numbers, [n]: (b.numbers[n] ?? 0) + stake } }));
  const addOutside = (o: OutsideBet) => setBets((b) => ({ ...b, outside: { ...b.outside, [o]: (b.outside[o] ?? 0) + stake } }));
  const clear = () => setBets({ numbers: {}, outside: {} });

  const spin = () => {
    if (total <= 0 || spinning) return;
    if (!placeBet("number-wheel", total, `Wheel spin (${formatCoins(total)})`)) {
      toast.error("Not enough coins", "Reduce your bets or top up.");
      return;
    }
    const outcome = spinResult();
    setSpinning(true);
    setResult(null);
    setRotation((r) => targetRotation(r, outcome));
    const placed = bets;
    setTimeout(() => {
      setSpinning(false);
      setResult(outcome);
      setHistory((h) => [outcome, ...h].slice(0, 10));
      const payout = settleWheel(placed, outcome);
      if (payout > 0) {
        credit("number-wheel", payout, `Wheel hit ${outcome}`);
        toast.success(`Landed on ${outcome}`, `You won ${formatCoins(payout)} coins`);
      } else {
        toast.error(`Landed on ${outcome}`, "Better luck next spin.");
      }
      setBets({ numbers: {}, outside: {} });
    }, SPIN_MS + 100);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <GlassCard strong className="grid place-items-center p-6 md:p-10" glow="rgb(34 211 238 / 0.35)">
        <div className="relative w-full max-w-md">
          <svg viewBox="-170 -170 340 340" className="block w-full drop-shadow-[0_0_40px_rgba(34,211,238,0.4)]">
            <circle r="166" fill="#0c0818" stroke="#22d3ee" strokeOpacity="0.6" strokeWidth="3" />
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : "none",
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
            <span className="font-display text-3xl font-black text-[#ffc83d]">{result ?? (spinning ? "…" : "?")}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {history.map((h, i) => (
            <span
              key={i}
              className="grid size-9 place-items-center rounded-full font-display text-sm font-bold"
              style={{ background: TONES[segmentTone(h)] }}
            >
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
            {Array.from({ length: WHEEL_SEGMENTS }, (_, n) => (
              <button
                key={n}
                disabled={spinning}
                onClick={() => addNumber(n)}
                className={cn(
                  "relative aspect-square cursor-pointer rounded-xl font-display font-bold text-white transition active:scale-90 disabled:opacity-50",
                  bets.numbers[n] ? "ring-2 ring-[#ffc83d]" : "",
                )}
                style={{ background: TONES[segmentTone(n)] }}
              >
                {n}
                {bets.numbers[n] ? (
                  <span className="absolute -top-2 -right-2 rounded-full bg-[#ffc83d] px-1.5 text-[10px] font-black text-black">
                    {bets.numbers[n]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {OUTSIDE_BETS.map((o) => (
              <button
                key={o.id}
                disabled={spinning}
                onClick={() => addOutside(o.id)}
                className={cn(
                  "cursor-pointer rounded-2xl border p-3 text-left transition active:scale-95 disabled:opacity-50",
                  bets.outside[o.id] ? "border-white/60 bg-white/15" : "border-white/10 bg-white/5",
                )}
              >
                <span className="block font-bold" style={{ color: o.hex }}>{o.label}</span>
                <span className="text-xs text-white/50">
                  {o.hint} · x2{bets.outside[o.id] ? ` · ${bets.outside[o.id]}` : ""}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="space-y-4 p-5">
          <StakeInput value={stake} onChange={setStake} disabled={spinning} color="#22d3ee" max={5000} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Total stake</span>
            <span className="font-display text-lg font-bold">{formatCoins(total)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="glass" onClick={clear} disabled={spinning || total === 0}>Clear</Button>
            <Button full size="lg" onClick={spin} disabled={spinning || total === 0}>
              {spinning ? "Spinning…" : "Spin the wheel"}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
