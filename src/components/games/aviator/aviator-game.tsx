"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plane } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { GlassCard } from "@/components/ui/glass-card";
import { StakeInput } from "@/components/ui/stepper";
import { useGameConfig } from "@/hooks/use-game-config";
import { useGameSocket, useServerClock } from "@/hooks/use-game-socket";
import {
  AVIATOR_BETTING_MS,
  curvePath,
  multiplierAt,
  multiplierTone,
  timeToMultiplier,
  TONE_COLORS,
  type CurvePoint,
} from "@/lib/games/aviator";
import { emitAck } from "@/lib/socket";
import { cn, formatCoins, formatMultiplier } from "@/lib/utils";
import { useSession } from "@/store/session";
import { toast } from "@/store/toast";

type Phase = "betting" | "flying" | "crashed" | "closed";

interface PublicBet {
  userId: number;
  name: string;
  amount: number;
  cashedAt: number | null;
  payout: number;
}
interface Mine {
  amount: number;
  autoCash: number | null;
  cashedAt: number | null;
  payout: number;
}
interface PhaseState {
  phase: Phase;
  roundId: number;
  serverTime: number;
  bettingEndsAt: number;
  startedAt: number;
  crashPoint: number | null;
  history: number[];
}

const W = 800;
const H = 420;

export function AviatorGame() {
  const me = useSession((s) => s.user)!;
  const cfg = useGameConfig("aviator");
  const clock = useServerClock();

  const [round, setRound] = useState<PhaseState | null>(null);
  const [bets, setBets] = useState<PublicBet[]>([]);
  const [mine, setMine] = useState<Mine | null>(null);
  const [stake, setStake] = useState(100);
  const [autoOn, setAutoOn] = useState(false);
  const [autoAt, setAutoAt] = useState(2);
  const [busy, setBusy] = useState(false);
  const [, frame] = useState(0);
  const mineRef = useRef<Mine | null>(null);
  mineRef.current = mine;

  const connected = useGameSocket("aviator", {
    "aviator:state": (s: PhaseState & { bets: PublicBet[]; mine: Mine | null }) => {
      clock.sync(s.serverTime);
      setRound(s);
      setBets(s.bets);
      setMine(s.mine);
    },
    "aviator:phase": (s: PhaseState) => {
      clock.sync(s.serverTime);
      setRound(s);
      if (s.phase === "betting") setMine(null);
      if (s.phase === "crashed" && mineRef.current && mineRef.current.cashedAt === null) {
        toast.error(`Flew away at ${formatMultiplier(s.crashPoint ?? 1)}`, "Your stake was lost.");
      }
    },
    "aviator:bets": (p: { bets: PublicBet[] }) => setBets(p.bets),
    "aviator:cashed": (p: { multiplier: number; payout: number }) => {
      setMine((m) => (m ? { ...m, cashedAt: p.multiplier, payout: p.payout } : m));
      toast.success(`Cashed out at ${formatMultiplier(p.multiplier)}`, `+${formatCoins(p.payout)} credits`);
    },
  });

  // Animation clock: re-render every animation frame while a flight is on screen.
  useEffect(() => {
    if (round?.phase !== "flying") return;
    let raf = 0;
    const loop = () => {
      frame((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [round?.phase, round?.roundId]);

  // Countdown refresh while betting.
  useEffect(() => {
    if (round?.phase !== "betting") return;
    const id = setInterval(() => frame((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [round?.phase, round?.roundId]);

  const now = clock.now();
  const phase = round?.phase ?? "closed";
  const crashPoint = round?.crashPoint ?? null;

  const elapsed =
    phase === "flying" ? Math.max(0, now - (round?.startedAt ?? now)) : phase === "crashed" && crashPoint ? timeToMultiplier(crashPoint) : 0;
  const multiplier = phase === "crashed" && crashPoint ? crashPoint : phase === "flying" ? multiplierAt(elapsed) : 1;

  const points: CurvePoint[] = useMemo(() => {
    if (elapsed <= 0) return [];
    const n = 90;
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = (elapsed * i) / n;
      return { t, m: multiplierAt(t) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(elapsed / 40), phase]);
  const path = curvePath(points, W, H);

  const tone = multiplierTone(multiplier);
  const color = phase === "crashed" ? "#ff2d55" : TONE_COLORS[tone];
  const countdown = phase === "betting" ? Math.max(0, (round?.bettingEndsAt ?? 0) - now) : 0;

  const act = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (phase === "betting" && !mine) {
        const res = await emitAck("aviator:bet", { amount: stake, autoCash: autoOn ? autoAt : null });
        if (!res.ok) toast.error("Bet not placed", res.error);
        else setMine(res.mine as Mine);
      } else if (phase === "betting" && mine) {
        const res = await emitAck("aviator:cancel");
        if (!res.ok) toast.error("Could not cancel", res.error);
        else setMine(null);
      } else if (phase === "flying" && mine && mine.cashedAt === null) {
        const res = await emitAck("aviator:cashout");
        if (!res.ok) toast.error("Cash-out failed", res.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const canCashOut = phase === "flying" && !!mine && mine.cashedAt === null;
  const label =
    phase === "betting"
      ? mine
        ? `Bet placed · ${formatCoins(mine.amount)} — tap to cancel`
        : `Place bet · ${formatCoins(stake)}`
      : canCashOut
        ? `Cash out · ${formatCoins(Math.floor(mine!.amount * multiplier))}`
        : phase === "flying"
          ? mine?.cashedAt
            ? `Cashed out at ${formatMultiplier(mine.cashedAt)}`
            : "Next round starts after the break"
          : phase === "crashed"
            ? "Round over"
            : "Game closed";
  const disabled = !connected || busy || !(phase === "betting" || canCashOut) || (phase === "betting" && !cfg.enabled);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="no-scrollbar flex min-h-9 gap-2 overflow-x-auto">
          {(round?.history ?? []).map((h, i) => (
            <span key={i} className="glass shrink-0 rounded-full px-3 py-1 text-sm font-bold" style={{ color: TONE_COLORS[multiplierTone(h)] }}>
              {h.toFixed(2)}x
            </span>
          ))}
        </div>

        <GlassCard strong className="relative overflow-hidden" glow={`${color}55`}>
          <svg viewBox={`0 0 ${W} ${H}`} className="block aspect-[800/420] w-full">
            <defs>
              <linearGradient id="av-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[1, 2, 3, 4].map((i) => (
              <line key={i} x1="0" x2={W} y1={(H / 5) * i} y2={(H / 5) * i} stroke="white" strokeOpacity="0.05" />
            ))}
            {path.area && <path d={path.area} fill="url(#av-fill)" />}
            {path.line && <path d={path.line} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
            {points.length > 0 && phase === "flying" && (
              <g transform={`translate(${path.head.x} ${path.head.y}) rotate(${path.head.angle})`}>
                <path d="M-6 -14 L28 0 L-6 14 L0 0 Z" fill={color} />
                <circle r="6" fill="#fff" />
              </g>
            )}
          </svg>

          <div className="absolute inset-0 grid place-items-center">
            {phase === "betting" ? (
              <div className="text-center">
                <p className="text-sm font-semibold tracking-widest text-white/60 uppercase">Next flight in</p>
                <p className="font-display text-6xl font-black tabular-nums">{Math.ceil(countdown / 1000)}s</p>
                <div className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand-pink" style={{ width: `${(countdown / AVIATOR_BETTING_MS) * 100}%` }} />
                </div>
                <p className="mt-3 text-sm text-white/55">Place your bets now</p>
              </div>
            ) : phase === "closed" ? (
              <p className="text-xl font-bold text-white/60">{round ? "Aviator is currently closed" : "Connecting…"}</p>
            ) : (
              <div className="text-center">
                <p className="font-display text-6xl font-black tabular-nums md:text-8xl" style={{ color, textShadow: `0 0 40px ${color}` }}>
                  {formatMultiplier(multiplier)}
                </p>
                {phase === "crashed" && <p className="mt-1 text-xl font-bold text-brand-red">Flew away!</p>}
                {mine?.cashedAt != null && (
                  <p className="mt-1 text-lg font-bold text-brand-green">
                    You cashed out at {formatMultiplier(mine.cashedAt)} · +{formatCoins(mine.payout)}
                  </p>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-4">
            <StakeInput value={stake} onChange={setStake} disabled={phase !== "betting" || !!mine} color="#ff2d55" min={cfg.minBet} max={cfg.maxBet} />
            <label className="flex flex-wrap items-center gap-3 text-sm">
              <input type="checkbox" checked={autoOn} disabled={phase !== "betting" || !!mine} onChange={(e) => setAutoOn(e.target.checked)} className="size-4 accent-[#ff2d55]" />
              Auto cash-out at
              <input
                type="number"
                min={1.1}
                step={0.1}
                value={autoAt}
                disabled={phase !== "betting" || !!mine}
                onChange={(e) => setAutoAt(Math.max(1.1, Number(e.target.value) || 1.1))}
                className="glass w-20 rounded-xl px-2 py-1 text-center font-bold outline-none"
              />
              x
            </label>
          </div>
          <Button
            size="lg"
            variant={canCashOut ? "success" : mine && phase === "betting" ? "glass" : "primary"}
            className="min-w-60"
            disabled={disabled}
            onClick={act}
          >
            <Plane size={20} /> {label}
          </Button>
        </GlassCard>
        {!cfg.enabled && <p className="text-center text-sm text-brand-gold">Aviator is temporarily closed by the owner.</p>}
        {me.balance < cfg.minBet && (
          <p className="text-center text-sm text-white/55">You have no credits to bet with. Ask the owner to allocate credits to your account.</p>
        )}
      </div>

      <GlassCard className="p-5">
        <h3 className="mb-4 flex items-center justify-between font-bold">
          Live bets <span className="text-xs font-semibold text-white/50">{bets.length} players</span>
        </h3>
        {bets.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/45">No bets yet this round.</p>
        ) : (
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
            {bets.map((b) => (
              <li
                key={b.userId}
                className={cn(
                  "flex items-center justify-between rounded-2xl p-2.5 text-sm transition",
                  b.cashedAt ? "bg-brand-green/15" : b.userId === me.id ? "bg-brand-pink/15" : "bg-white/5",
                )}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Avatar name={b.name} size={30} /> {b.userId === me.id ? "You" : b.name}
                </span>
                <span className={cn("flex items-center gap-1 font-bold", b.cashedAt ? "text-brand-green" : "text-white/75")}>
                  {b.cashedAt ? `${b.cashedAt.toFixed(2)}x · +${formatCoins(b.payout)}` : formatCoins(b.amount)}
                  {!b.cashedAt && <Coin size={14} />}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
