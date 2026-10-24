"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plane } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { GlassCard } from "@/components/ui/glass-card";
import { StakeInput } from "@/components/ui/stepper";
import {
  curvePath,
  generateBotBets,
  generateCrashPoint,
  multiplierAt,
  multiplierTone,
  TONE_COLORS,
  type BotBet,
  type CurvePoint,
} from "@/lib/games/aviator";
import { cn, formatCoins, formatMultiplier } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useWallet } from "@/store/wallet";

type Phase = "waiting" | "flying" | "crashed";
const WAIT_MS = 5000;
const W = 800;
const H = 420;

export function AviatorGame() {
  const placeBet = useWallet((s) => s.placeBet);
  const credit = useWallet((s) => s.credit);

  const [phase, setPhase] = useState<Phase>("waiting");
  const [multiplier, setMultiplier] = useState(1);
  const [countdown, setCountdown] = useState(WAIT_MS);
  const [points, setPoints] = useState<CurvePoint[]>([]);
  const [history, setHistory] = useState<number[]>([2.31, 1.12, 5.4, 1.0, 3.78, 12.04, 1.55, 2.02]);
  const [bots, setBots] = useState<BotBet[]>([]);

  const [stake, setStake] = useState(100);
  const [autoCash, setAutoCash] = useState(2);
  const [autoOn, setAutoOn] = useState(false);
  const [bet, setBet] = useState<number | null>(null); // active stake this round
  const [cashed, setCashed] = useState<number | null>(null); // multiplier cashed at

  const betRef = useRef<number | null>(null);
  const cashedRef = useRef<number | null>(null);
  const autoRef = useRef({ on: false, at: 2 });
  autoRef.current = { on: autoOn, at: autoCash };

  const cashOut = useCallback(
    (m: number) => {
      const s = betRef.current;
      if (s === null || cashedRef.current !== null) return;
      cashedRef.current = m;
      setCashed(m);
      const payout = Math.floor(s * m);
      credit("aviator", payout, `Aviator cash-out @ ${m.toFixed(2)}x`);
      toast.success(`Cashed out ${formatMultiplier(m)}`, `+${formatCoins(payout)} coins`);
    },
    [credit],
  );

  // Round loop
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const startRound = () => {
      if (cancelled) return;
      setPhase("waiting");
      setMultiplier(1);
      setPoints([]);
      setCashed(null);
      cashedRef.current = null;
      setBots(generateBotBets());
      const waitStart = performance.now();
      const crash = generateCrashPoint();

      const wait = () => {
        if (cancelled) return;
        const left = Math.max(0, WAIT_MS - (performance.now() - waitStart));
        setCountdown(left);
        if (left > 0) {
          raf = requestAnimationFrame(wait);
          return;
        }
        fly(crash);
      };
      raf = requestAnimationFrame(wait);
    };

    const fly = (crash: number) => {
      setPhase("flying");
      const t0 = performance.now();
      const samples: CurvePoint[] = [];
      const frame = () => {
        if (cancelled) return;
        const t = performance.now() - t0;
        const m = multiplierAt(t);
        if (m >= crash) {
          samples.push({ t, m: crash });
          setPoints([...samples]);
          setMultiplier(crash);
          setPhase("crashed");
          setHistory((h) => [crash, ...h].slice(0, 12));
          if (betRef.current !== null && cashedRef.current === null) {
            toast.error(`Crashed at ${formatMultiplier(crash)}`, "Your stake was lost.");
          }
          betRef.current = null;
          setBet(null);
          timer = setTimeout(startRound, 3200);
          return;
        }
        if (autoRef.current.on && betRef.current !== null && cashedRef.current === null && m >= autoRef.current.at) {
          cashOut(autoRef.current.at);
        }
        samples.push({ t, m });
        if (samples.length % 2 === 0) setPoints([...samples]);
        setMultiplier(m);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    startRound();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [cashOut]);

  const onPrimary = () => {
    if (phase === "waiting" && bet === null) {
      if (!placeBet("aviator", stake, `Aviator bet (${stake})`)) {
        toast.error("Not enough coins", "Top up from the wallet page.");
        return;
      }
      betRef.current = stake;
      setBet(stake);
    } else if (phase === "waiting" && bet !== null) {
      // cancel bet -> refund
      credit("aviator", bet, "Aviator bet refunded");
      betRef.current = null;
      setBet(null);
    } else if (phase === "flying" && bet !== null && cashed === null) {
      cashOut(multiplier);
    }
  };

  const tone = multiplierTone(multiplier);
  const color = phase === "crashed" ? "#ff2d55" : TONE_COLORS[tone];
  const path = useMemo(() => curvePath(points, W, H), [points]);

  const label =
    phase === "waiting"
      ? bet === null
        ? `Place bet · ${formatCoins(stake)}`
        : "Cancel bet"
      : phase === "flying" && bet !== null && cashed === null
        ? `Cash out · ${formatCoins(Math.floor(bet * multiplier))}`
        : phase === "flying"
          ? "Next round soon"
          : "Round over";

  const primaryDisabled = !(
    (phase === "waiting") ||
    (phase === "flying" && bet !== null && cashed === null)
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {/* History */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {history.map((h, i) => (
            <span
              key={i}
              className="glass shrink-0 rounded-full px-3 py-1 text-sm font-bold"
              style={{ color: TONE_COLORS[multiplierTone(h)] }}
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Stage */}
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
            {points.length > 0 && phase !== "crashed" && (
              <g transform={`translate(${path.head.x} ${path.head.y}) rotate(${path.head.angle})`}>
                <path d="M-6 -14 L28 0 L-6 14 L0 0 Z" fill={color} />
                <circle r="6" fill="#fff" />
              </g>
            )}
          </svg>

          <div className="absolute inset-0 grid place-items-center">
            {phase === "waiting" ? (
              <div className="text-center">
                <p className="text-sm font-semibold tracking-widest text-white/60 uppercase">Next flight in</p>
                <p className="font-display text-6xl font-black tabular-nums">{(countdown / 1000).toFixed(1)}s</p>
                <div className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand-pink" style={{ width: `${(countdown / WAIT_MS) * 100}%` }} />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p
                  className="font-display text-6xl font-black tabular-nums md:text-8xl"
                  style={{ color, textShadow: `0 0 40px ${color}` }}
                >
                  {formatMultiplier(multiplier)}
                </p>
                {phase === "crashed" && <p className="mt-1 text-xl font-bold text-brand-red">Flew away!</p>}
                {cashed !== null && <p className="mt-1 text-lg font-bold text-brand-green">You cashed out at {formatMultiplier(cashed)}</p>}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Controls */}
        <GlassCard className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-4">
            <StakeInput value={stake} onChange={setStake} disabled={bet !== null} color="#ff2d55" max={10000} />
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={autoOn} onChange={(e) => setAutoOn(e.target.checked)} className="size-4 accent-[#ff2d55]" />
              Auto cash-out at
              <input
                type="number"
                min={1.1}
                step={0.1}
                value={autoCash}
                onChange={(e) => setAutoCash(Math.max(1.1, Number(e.target.value) || 1.1))}
                className="glass w-20 rounded-xl px-2 py-1 text-center font-bold outline-none"
              />
              x
            </label>
          </div>
          <Button
            size="lg"
            variant={phase === "flying" && bet !== null && cashed === null ? "success" : bet !== null ? "glass" : "primary"}
            className="min-w-56"
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            <Plane size={20} /> {label}
          </Button>
        </GlassCard>
      </div>

      {/* Live bets */}
      <GlassCard className="p-5">
        <h3 className="mb-4 flex items-center justify-between font-bold">
          Live bets <span className="text-xs font-semibold text-white/50">{bots.length + (bet ? 1 : 0)} players</span>
        </h3>
        <ul className="space-y-2">
          {bet !== null && (
            <li className="flex items-center justify-between rounded-2xl bg-brand-pink/15 p-2.5">
              <span className="flex items-center gap-2 font-semibold"><Avatar name="You" size={30} /> You</span>
              <span className="flex items-center gap-1 text-sm font-bold">{formatCoins(bet)} <Coin size={14} /></span>
            </li>
          )}
          {bots.map((b) => {
            const out = phase !== "waiting" && multiplier >= b.target;
            return (
              <li
                key={b.id}
                className={cn("flex items-center justify-between rounded-2xl p-2.5 text-sm transition", out ? "bg-brand-green/15" : "bg-white/5")}
              >
                <span className="flex items-center gap-2 font-semibold"><Avatar name={b.name} hue={b.hue} size={30} /> {b.name}</span>
                <span className={cn("font-bold", out ? "text-brand-green" : "text-white/70")}>
                  {out ? `${b.target.toFixed(2)}x · +${formatCoins(Math.floor(b.amount * b.target))}` : formatCoins(b.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </div>
  );
}
