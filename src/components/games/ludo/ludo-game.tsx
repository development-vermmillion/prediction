"use client";

import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StakeInput } from "@/components/ui/stepper";
import {
  BOARD_SIZE,
  cellFor,
  HOME_COLUMN,
  newRace,
  PLAYER_META,
  PLAYER_ORDER,
  progressPct,
  rollDie,
  stepRace,
  TRACK,
  WIN_ODDS,
  YARD_SLOTS,
  type RaceState,
} from "@/lib/games/ludo";
import { cn, formatCoins } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useWallet } from "@/store/wallet";
import type { PlayerColor } from "@/types";

const STEP_MS = 650;
const S = 40; // cell size in svg units

export function LudoGame() {
  const placeBet = useWallet((s) => s.placeBet);
  const credit = useWallet((s) => s.credit);

  const [pick, setPick] = useState<PlayerColor>("red");
  const [stake, setStake] = useState(100);
  const [race, setRace] = useState<RaceState>(newRace);
  const [running, setRunning] = useState(false);
  const betRef = useRef<{ color: PlayerColor; amount: number } | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRace((prev) => stepRace(prev, rollDie()));
    }, STEP_MS);
    return () => clearInterval(id);
  }, [running]);

  // React to a finished race.
  useEffect(() => {
    if (!race.winner || !running) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRunning(false);
    const bet = betRef.current;
    if (bet) {
      if (bet.color === race.winner) {
        const payout = Math.floor(bet.amount * WIN_ODDS);
        credit("ludo", payout, `Ludo: ${PLAYER_META[race.winner].label} won`);
        toast.success(`${PLAYER_META[race.winner].label} wins!`, `+${formatCoins(payout)} coins`);
      } else {
        toast.error(`${PLAYER_META[race.winner].label} won the race`, "Your pick lost.");
      }
      betRef.current = null;
    }
  }, [race.winner, running, credit]);

  const start = () => {
    if (running) return;
    if (!placeBet("ludo", stake, `Ludo bet on ${PLAYER_META[pick].label}`)) {
      toast.error("Not enough coins");
      return;
    }
    betRef.current = { color: pick, amount: stake };
    setRace(newRace());
    setRunning(true);
  };

  const cellColor = (c: number, r: number): string | null => {
    for (const p of PLAYER_ORDER) {
      if (HOME_COLUMN[p].some(([hc, hr]) => hc === c && hr === r)) return PLAYER_META[p].hex;
      const [sc, sr] = TRACK[PLAYER_META[p].start];
      if (sc === c && sr === r) return PLAYER_META[p].hex;
    }
    return null;
  };

  const isTrack = (c: number, r: number) => TRACK.some(([tc, tr]) => tc === c && tr === r);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <GlassCard strong className="p-4 md:p-6" glow="rgb(255 200 61 / 0.3)">
        <svg viewBox={`0 0 ${BOARD_SIZE * S} ${BOARD_SIZE * S}`} className="mx-auto block w-full max-w-xl">
          {/* Yards */}
          {PLAYER_ORDER.map((p) => {
            const [x, y] = YARD_SLOTS[p][0];
            const ox = x < 7 ? 0 : 9;
            const oy = y < 7 ? 0 : 9;
            return (
              <g key={p}>
                <rect
                  x={ox * S + 4}
                  y={oy * S + 4}
                  width={6 * S - 8}
                  height={6 * S - 8}
                  rx={22}
                  fill={PLAYER_META[p].hex}
                  fillOpacity={0.22}
                  stroke={PLAYER_META[p].hex}
                  strokeOpacity={0.6}
                  strokeWidth={2}
                />
                {YARD_SLOTS[p].map(([sx, sy], i) => (
                  <circle key={i} cx={sx * S} cy={sy * S} r={S * 0.5} fill="#07050f" fillOpacity={0.5} />
                ))}
              </g>
            );
          })}
          {/* Track cells */}
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
            const c = i % BOARD_SIZE;
            const r = Math.floor(i / BOARD_SIZE);
            const color = cellColor(c, r);
            if (!color && !isTrack(c, r)) return null;
            return (
              <rect
                key={i}
                x={c * S + 2}
                y={r * S + 2}
                width={S - 4}
                height={S - 4}
                rx={8}
                fill={color ?? "#ffffff"}
                fillOpacity={color ? 0.75 : 0.1}
                stroke="#fff"
                strokeOpacity={0.12}
              />
            );
          })}
          {/* Centre */}
          <rect x={6 * S + 4} y={6 * S + 4} width={3 * S - 8} height={3 * S - 8} rx={14} fill="#ffc83d" fillOpacity={0.25} stroke="#ffc83d" />
          <text x={7.5 * S} y={7.5 * S} textAnchor="middle" dominantBaseline="central" fontSize={26}>🏁</text>

          {/* Tokens */}
          {PLAYER_ORDER.map((p) => {
            const [cx, cy] = cellFor(p, race.progress[p]);
            return (
              <g
                key={p}
                style={{ transform: `translate(${cx * S}px, ${cy * S}px)`, transition: `transform ${STEP_MS * 0.8}ms ease` }}
              >
                <circle r={S * 0.36} fill={PLAYER_META[p].hex} stroke="#fff" strokeWidth={3} />
                <circle r={S * 0.14} fill="#fff" fillOpacity={0.8} />
                {pick === p && <circle r={S * 0.5} fill="none" stroke="#fff" strokeDasharray="4 4" />}
              </g>
            );
          })}
        </svg>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard className="p-5">
          <h3 className="mb-3 font-bold">
            Who finishes first? <span className="text-sm font-normal text-white/50">· pays x{WIN_ODDS}</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {PLAYER_ORDER.map((p) => (
              <button
                key={p}
                disabled={running}
                onClick={() => setPick(p)}
                className={cn(
                  "cursor-pointer rounded-2xl border p-3 text-left transition active:scale-95 disabled:opacity-60",
                  pick === p ? "border-white/70 bg-white/15" : "border-white/10 bg-white/5",
                )}
              >
                <span className="flex items-center gap-2 font-bold">
                  <span className="size-4 rounded-full" style={{ background: PLAYER_META[p].hex }} />
                  {PLAYER_META[p].label}
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct(race.progress[p])}%`, background: PLAYER_META[p].hex }}
                  />
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="space-y-4 p-5">
          <StakeInput value={stake} onChange={setStake} disabled={running} color="#ffc83d" max={8000} />
          <Button full size="lg" variant="gold" onClick={start} disabled={running}>
            <Dices size={20} /> {running ? "Race in progress…" : race.winner ? "Race again" : "Start race"}
          </Button>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Dice</h3>
            <span className="grid size-12 place-items-center rounded-2xl bg-white text-2xl font-black text-black">
              {race.lastRoll ?? "–"}
            </span>
          </div>
          <ul className="space-y-1 text-sm text-white/65">
            {race.log.length === 0 && <li>Tokens need a 6 to leave the yard.</li>}
            {race.log.map((l, i) => (
              <li key={i} className={i === 0 ? "font-semibold text-white" : ""}>{l}</li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
