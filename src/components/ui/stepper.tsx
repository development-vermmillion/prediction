"use client";

import { Minus, Plus } from "lucide-react";
import { ABSOLUTE_MAX_STAKE, nextStake, prevStake, snapStake, STAKE_PRESETS } from "@/lib/games/stakes";
import { cn } from "@/lib/utils";
import { Chip } from "./chip";

interface StakeInputProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
  color?: string;
  className?: string;
}

/**
 * Stake selector. Allowed amounts: 10, 20, 50 and any multiple of 100.
 * The − / + buttons walk that sequence; typed values snap to the nearest allowed stake.
 */
export function StakeInput({ value, onChange, min = 10, max = ABSOLUTE_MAX_STAKE, disabled, color, className }: StakeInputProps) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className={cn("space-y-3", className)}>
      <div className="glass flex items-center justify-between rounded-2xl p-1.5">
        <button
          type="button"
          aria-label="Decrease stake"
          disabled={disabled}
          onClick={() => set(prevStake(value))}
          className="grid size-11 cursor-pointer place-items-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-95 disabled:opacity-40"
        >
          <Minus size={18} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => set(snapStake(Number(e.target.value)))}
          aria-label="Stake"
          className="w-28 bg-transparent text-center font-display text-2xl font-bold outline-none"
        />
        <button
          type="button"
          aria-label="Increase stake"
          disabled={disabled}
          onClick={() => set(nextStake(value))}
          className="grid size-11 cursor-pointer place-items-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-95 disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {STAKE_PRESETS.filter((p) => p >= min && p <= max).map((p) => (
          <Chip key={p} active={value === p} color={color} disabled={disabled} onClick={() => set(p)}>
            {p}
          </Chip>
        ))}
      </div>
    </div>
  );
}
