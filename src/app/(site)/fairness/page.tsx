"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck, ShieldX } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/lib/api";
import { verifyRound, type FairRound } from "@/lib/games/fair-verify";
import { timeAgo } from "@/lib/utils";

interface Row { id: number; roundNo: number | null; result: string; commit: string | null; seed: string | null; rtp: number | null; at: number }

const TABS = [
  { id: "aviator", label: "Aviator" },
  { id: "color-prediction", label: "Color Prediction" },
  { id: "number-wheel", label: "Number Wheel" },
];

export default function FairnessPage() {
  const [game, setGame] = useState("aviator");
  const [rows, setRows] = useState<(Row & { ok: boolean })[] | null>(null);

  useEffect(() => {
    let live = true;
    setRows(null);
    api<{ rounds: Row[] }>(`/api/fairness?game=${game}`)
      .then(async (d) => {
        const checked = await Promise.all(d.rounds.map(async (r) => ({ ...r, ok: await verifyRound({ game, ...r } as FairRound) })));
        if (live) setRows(checked);
      })
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [game]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold"><ShieldCheck className="text-brand-green" /> Fairness</h1>
        <p className="mt-1 text-white/60">Every round of Aviator, Color Prediction and Number Wheel is decided before any bet is placed, and you can check it yourself.</p>
      </div>

      <GlassCard className="space-y-2 p-5 text-sm text-white/70">
        <p><b className="text-white">1. Commit.</b> Before betting opens, the server picks a secret seed and shows you its fingerprint (SHA-256 hash) on the game screen.</p>
        <p><b className="text-white">2. Play.</b> The result is calculated from that seed alone. Nobody&apos;s bets can change it, and the hash proves the seed was fixed first.</p>
        <p><b className="text-white">3. Reveal.</b> After the round the seed is published. Hash it: it must equal the fingerprint you saw. Run the same formula and you get the same result.</p>
        <p className="text-white/45">The checks below run in your browser, not on our server.</p>
      </GlassCard>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Chip key={t.id} active={game === t.id} onClick={() => setGame(t.id)}>{t.label}</Chip>
        ))}
      </div>

      <GlassCard className="p-5">
        {rows === null ? (
          <p className="text-sm text-white/45">Checking rounds…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-white/45">No verified rounds yet.</p>
        ) : (
          <>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-green">
              <BadgeCheck size={16} /> {rows.filter((r) => r.ok).length} of {rows.length} recent rounds verified
            </p>
            <ul className="divide-y divide-white/10">
              {rows.map((r) => (
                <li key={r.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold">Round {r.roundNo} → {r.result}</span>
                    <span className={r.ok ? "flex items-center gap-1 text-brand-green" : "flex items-center gap-1 text-brand-red"}>
                      {r.ok ? <ShieldCheck size={15} /> : <ShieldX size={15} />} {r.ok ? "Verified" : "Mismatch"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">{timeAgo(r.at)}</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-white/40">hash {r.commit}</p>
                  <p className="break-all font-mono text-[11px] text-white/40">seed {r.seed}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </GlassCard>
    </div>
  );
}
