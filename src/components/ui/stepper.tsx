"use client";

import { Minus, Plus } from "lucide-react";
import { STAKE_PRESETS } from "@/lib/constants";
import { clamp, cn } from "@/lib/utils";
import { Chip } from "./chip";

interface StakeInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  color?: string;
  className?: string;
}

/** Stake selector: − / + stepper, editable amount and quick presets. */
export function StakeInput({ value, onChange, min = 10, max = 100000, disabled, color, className }: StakeInputProps) {
  const set = (v: number) => onChange(clamp(Math.round(v), min, max));
  return (
    <div className={cn("space-y-3", className)}>
      <div className="glass flex items-center justify-between rounded-2xl p-1.5">
        <button
          type="button"
          aria-label="Decrease stake"
          disabled={disabled}
          onClick={() => set(value - (value > 100 ? 50 : 10))}
          className="grid size-11 cursor-pointer place-items-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-95 disabled:opacity-40"
        >
          <Minus size={18} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => set(Number(e.target.value) || min)}
          className="w-28 bg-transparent text-center font-display text-2xl font-bold outline-none"
        />
        <button
          type="button"
          aria-label="Increase stake"
          disabled={disabled}
          onClick={() => set(value + (value >= 100 ? 50 : 10))}
          className="grid size-11 cursor-pointer place-items-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-95 disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {STAKE_PRESETS.map((p) => (
          <Chip key={p} active={value === p} color={color} disabled={disabled} onClick={() => set(p)}>
            {p}
          </Chip>
        ))}
        <Chip disabled={disabled} onClick={() => set(value * 2)}>
          2×
        </Chip>
        <Chip disabled={disabled} onClick={() => set(max)}>
          Max
        </Chip>
      </div>
    </div>
  );
}
