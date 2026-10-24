"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { GameArt } from "@/components/home/game-art";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { adminService } from "@/services";
import { toast } from "@/store/toast";
import type { GameConfig } from "@/types";

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-white/55">{label}</span>
      <span className="glass flex items-center rounded-xl px-3 py-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent font-semibold outline-none"
        />
        {suffix && <span className="text-white/45">{suffix}</span>}
      </span>
    </label>
  );
}

export default function AdminGamesPage() {
  const [configs, setConfigs] = useState<GameConfig[]>(() => adminService.gameConfigs());
  const [dirty, setDirty] = useState(false);

  const update = (id: GameConfig["id"], patch: Partial<GameConfig>) => {
    setConfigs((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setDirty(true);
  };

  const save = () => {
    // Replace with: await fetch("/api/admin/games", { method: "PUT", body: JSON.stringify(configs) })
    setDirty(false);
    toast.success("Game settings saved");
  };

  return (
    <>
      <PageHeader
        title="Games"
        subtitle="Enable games, tune return-to-player and set stake limits."
        actions={<Button onClick={save} disabled={!dirty}>Save changes</Button>}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {configs.map((c) => {
          const meta = GAMES.find((g) => g.id === c.id)!;
          return (
            <GlassCard key={c.id} className="p-5" glow={c.enabled ? `${meta.accent}33` : undefined}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GameArt id={c.id} size={52} />
                  <div>
                    <h2 className="text-lg font-bold">{meta.name}</h2>
                    <p className="text-xs text-white/50">{meta.tagline}</p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={c.enabled}
                  aria-label={`Toggle ${meta.name}`}
                  onClick={() => update(c.id, { enabled: !c.enabled })}
                  className={cn(
                    "relative h-7 w-12 cursor-pointer rounded-full transition",
                    c.enabled ? "bg-brand-green" : "bg-white/15",
                  )}
                >
                  <span className={cn("absolute top-0.5 size-6 rounded-full bg-white transition-all", c.enabled ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Return to player" suffix="%" value={c.rtp} onChange={(v) => update(c.id, { rtp: Math.min(99, Math.max(80, v)) })} />
                <NumberField label="Round length" suffix="sec" value={c.roundSeconds} onChange={(v) => update(c.id, { roundSeconds: Math.max(5, v) })} />
                <NumberField label="Min stake" value={c.minBet} onChange={(v) => update(c.id, { minBet: Math.max(1, v) })} />
                <NumberField label="Max stake" value={c.maxBet} onChange={(v) => update(c.id, { maxBet: Math.max(c.minBet, v) })} />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}
