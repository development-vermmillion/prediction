import { Crown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Coin } from "@/components/ui/coin";
import { cn, formatCoins } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

const ORDER = [1, 0, 2]; // render 2nd, 1st, 3rd
const HEIGHTS = ["h-32 md:h-40", "h-24 md:h-32", "h-20 md:h-24"];
const TINTS = ["#ffc83d", "#cbd5e1", "#e08a4a"];
const HUES: [string, string][] = [
  ["#ffc83d", "#ff7a00"],
  ["#22d3ee", "#2563eb"],
  ["#a78bfa", "#ec4899"],
];

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="grid grid-cols-3 items-end gap-3 md:gap-5">
      {ORDER.map((idx) => {
        const e = entries[idx];
        if (!e) return <div key={idx} />;
        return (
          <div key={e.rank} className="flex flex-col items-center text-center">
            <div className="relative mb-2">
              {idx === 0 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#ffc83d]" size={26} />}
              <Avatar name={e.name} hue={HUES[idx]} size={idx === 0 ? 72 : 56} />
            </div>
            <p className="max-w-full truncate text-sm font-bold md:text-base">{e.name}</p>
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-white/60">
              {formatCoins(e.won)} <Coin size={13} />
            </p>
            <div
              className={cn("glass-strong flex w-full items-start justify-center rounded-t-3xl pt-3", HEIGHTS[idx])}
              style={{ boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.3), 0 -10px 40px -20px ${TINTS[idx]}` }}
            >
              <span className="font-display text-3xl font-black" style={{ color: TINTS[idx] }}>
                {e.rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
