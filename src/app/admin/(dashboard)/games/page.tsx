"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { GameArt } from "@/components/home/game-art";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { GAMES } from "@/lib/constants";
import { cn, formatCoins } from "@/lib/utils";
import { toast } from "@/store/toast";
import type { GameConfig } from "@/types";

const STAKE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000];

function Select({ label, value, onChange, options }: { label: string; value: number; onChange: (v: number) => void; options: number[] }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-white/55">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="glass w-full cursor-pointer rounded-xl bg-transparent px-3 py-2.5 font-semibold outline-none">
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#140d26]">
            {formatCoins(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Num({ label, value, onChange, suffix, min, max }: { label: string; value: number; onChange: (v: number) => void; suffix: string; min: number; max: number }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-white/55">{label}</span>
      <span className="glass flex items-center rounded-xl px-3 py-2.5">
        <input type="number" min={min} max={max} step={0.5} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-transparent font-semibold outline-none" />
        <span className="text-white/45">{suffix}</span>
      </span>
    </label>
  );
}

function GameCardConfig({ initial, onSaved }: { initial: GameConfig; onSaved: () => void }) {
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => setC(initial), [initial]);
  const meta = GAMES.find((g) => g.id === c.game)!;
  const dirty = JSON.stringify(c) !== JSON.stringify(initial);
  const isLudo = c.game === "ludo";

  const save = async () => {
    setBusy(true);
    try {
      await api("/api/admin/games", {
        method: "PUT",
        json: { game: c.game, enabled: c.enabled, minBet: c.minBet, maxBet: c.maxBet, ...(isLudo ? { rake: c.rake } : { rtp: c.rtp }) },
      });
      toast.success(`${meta.name} settings saved`, "Applies from the next round.");
      onSaved();
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="p-5" glow={c.enabled ? `${meta.accent}33` : undefined}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GameArt id={c.game} size={52} />
          <div>
            <h2 className="text-lg font-bold">{meta.name}</h2>
            <p className="text-xs text-white/50">{c.enabled ? "Open to players" : "Closed"}</p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={c.enabled}
          aria-label={`Toggle ${meta.name}`}
          onClick={() => setC({ ...c, enabled: !c.enabled })}
          className={cn("relative h-7 w-12 cursor-pointer rounded-full transition", c.enabled ? "bg-brand-green" : "bg-white/15")}
        >
          <span className={cn("absolute top-0.5 size-6 rounded-full bg-white transition-all", c.enabled ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {isLudo ? (
          <Num label="House fee (rake)" suffix="%" min={0} max={30} value={c.rake} onChange={(v) => setC({ ...c, rake: v })} />
        ) : (
          <Num label="Return to player (RTP)" suffix="%" min={80} max={99} value={c.rtp} onChange={(v) => setC({ ...c, rtp: v })} />
        )}
        <div />
        <Select label="Min stake" value={c.minBet} options={STAKE_OPTIONS} onChange={(v) => setC({ ...c, minBet: v })} />
        <Select label="Max stake" value={c.maxBet} options={STAKE_OPTIONS} onChange={(v) => setC({ ...c, maxBet: v })} />
      </div>
      {c.game === "aviator" && <p className="mt-3 text-xs text-white/45">RTP shapes Aviator&apos;s crash distribution. Color Prediction and Number Wheel use fixed odds.</p>}
      {(c.game === "color-prediction" || c.game === "number-wheel") && <p className="mt-3 text-xs text-white/45">This game pays fixed odds; the house edge comes from the odds table, so the RTP field is informational.</p>}
      <Button className="mt-4" full disabled={!dirty || busy} onClick={save}>
        {busy ? "Saving…" : "Save changes"}
      </Button>
    </GlassCard>
  );
}

export default function AdminGamesPage() {
  const { data, error, reload } = useApi<{ games: GameConfig[] }>("/api/admin/games");
  if (error) return <p className="text-brand-red">{error}</p>;
  return (
    <>
      <PageHeader title="Games" subtitle="Open or close games and set stake limits. Changes apply from the next round." />
      <div className="grid gap-4 xl:grid-cols-2">
        {(data?.games ?? []).map((g) => (
          <GameCardConfig key={g.game} initial={g} onSaved={() => void reload()} />
        ))}
      </div>
    </>
  );
}
