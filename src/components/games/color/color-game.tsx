"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StakeInput } from "@/components/ui/stepper";
import { useNow } from "@/hooks/use-now";
import {
  COLOR_META,
  LOCK_MS,
  NUMBER_ODDS,
  periodId,
  primaryColor,
  recentResults,
  resultFor,
  ROUND_MS,
  roundIndexAt,
  settleBet,
  type ColorBet,
  type ColorKey,
} from "@/lib/games/color-prediction";
import { cn, formatCoins } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useWallet } from "@/store/wallet";

const COLORS: ColorKey[] = ["green", "violet", "red"];

export function ColorGame() {
  const now = useNow(250);
  const placeBet = useWallet((s) => s.placeBet);
  const credit = useWallet((s) => s.credit);

  const [stake, setStake] = useState(50);
  const [bets, setBets] = useState<ColorBet[]>([]);
  const settledRef = useRef<number>(-1);

  const ready = now > 0;
  const roundIndex = ready ? roundIndexAt(now) : 0;
  const remaining = ready ? ROUND_MS - (now % ROUND_MS) : ROUND_MS;
  const locked = remaining <= LOCK_MS;

  // Settle bets from finished rounds whenever the round index advances.
  useEffect(() => {
    if (!ready || settledRef.current === roundIndex) return;
    settledRef.current = roundIndex;
    const finished = bets.filter((b) => b.roundIndex < roundIndex);
    if (finished.length === 0) return;
    let total = 0;
    for (const b of finished) {
      const result = resultFor(b.roundIndex);
      const payout = settleBet(b, result);
      if (payout > 0) {
        credit("color-prediction", Math.floor(payout), `Color round ${periodId(b.roundIndex)} won`);
        total += payout;
      }
    }
    if (total > 0) toast.success(`You won ${formatCoins(total)} coins`, "Nice prediction!");
    else toast.error("No luck this round", `Result was ${resultFor(finished[0].roundIndex)}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBets((prev) => prev.filter((b) => b.roundIndex >= roundIndex));
  }, [roundIndex, ready, bets, credit]);

  const place = (kind: "color" | "number", value: ColorKey | number) => {
    if (!ready || locked) return;
    if (!placeBet("color-prediction", stake, `Color bet · ${value}`)) {
      toast.error("Not enough coins");
      return;
    }
    const bet = { kind, value, amount: stake, roundIndex } as ColorBet;
    setBets((b) => [...b, bet]);
    toast.info("Bet placed", `${stake} on ${value}`);
  };

  const history = ready ? recentResults(roundIndex, 12) : [];
  const myBets = bets.filter((b) => b.roundIndex === roundIndex);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        {/* Round header */}
        <GlassCard strong className="flex items-center justify-between p-5 md:p-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-white/50 uppercase">Period</p>
            <p className="font-display text-lg font-bold md:text-2xl">{ready ? periodId(roundIndex) : "—"}</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-xs font-bold tracking-widest text-white/50 uppercase">
              {locked && <Lock size={12} />} {locked ? "Betting closed" : "Time left"}
            </p>
            <p className={cn("font-display text-3xl font-black tabular-nums md:text-4xl", locked && "text-brand-red")}>
              {ready ? `00:${String(Math.ceil(remaining / 1000)).padStart(2, "0")}` : "--:--"}
            </p>
          </div>
        </GlassCard>

        {/* Colour buttons */}
        <div className="grid grid-cols-3 gap-3">
          {COLORS.map((c) => (
            <button
              key={c}
              disabled={locked || !ready}
              onClick={() => place("color", c)}
              className="cursor-pointer rounded-3xl p-5 text-center font-extrabold text-black transition active:scale-95 disabled:opacity-40 md:p-7"
              style={{
                background: `linear-gradient(145deg, ${COLOR_META[c].hex}, ${COLOR_META[c].dark})`,
                boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.4), 0 18px 40px -14px ${COLOR_META[c].hex}`,
                color: "#fff",
              }}
            >
              <span className="block text-lg md:text-2xl">{COLOR_META[c].label}</span>
              <span className="text-sm opacity-80">x{COLOR_META[c].odds}</span>
            </button>
          ))}
        </div>

        {/* Number grid */}
        <GlassCard className="p-5">
          <h3 className="mb-4 font-bold">
            Or pick a number <span className="text-sm font-normal text-white/50">· pays x{NUMBER_ODDS}</span>
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, n) => {
              const c = COLOR_META[primaryColor(n)];
              return (
                <button
                  key={n}
                  disabled={locked || !ready}
                  onClick={() => place("number", n)}
                  className="aspect-square cursor-pointer rounded-full font-display text-xl font-black text-white transition hover:scale-105 active:scale-90 disabled:opacity-40"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, ${c.hex}, ${c.dark})`,
                    boxShadow: `0 8px 20px -8px ${c.hex}, inset 0 1px 0 rgb(255 255 255 / 0.4)`,
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <StakeInput value={stake} onChange={setStake} color="#a78bfa" max={5000} />
          {myBets.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {myBets.map((b, i) => (
                <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                  {b.amount} on {String(b.value)}
                </span>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* History */}
      <GlassCard className="h-fit p-5">
        <h3 className="mb-4 font-bold">Recent results</h3>
        <ul className="space-y-2">
          {history.map((h) => {
            const c = COLOR_META[primaryColor(h.result)];
            return (
              <li key={h.period} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                <span className="font-display text-xs text-white/60">{h.period}</span>
                <span
                  className="grid size-8 place-items-center rounded-full font-display text-sm font-black text-white"
                  style={{ background: `radial-gradient(circle at 30% 25%, ${c.hex}, ${c.dark})` }}
                >
                  {h.result}
                </span>
              </li>
            );
          })}
        </ul>
        <Button variant="ghost" full size="sm" className="mt-3" disabled>
          Results are shared by every player
        </Button>
      </GlassCard>
    </div>
  );
}
