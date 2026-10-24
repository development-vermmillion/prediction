"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { useApi } from "@/hooks/use-api";
import { cn, formatCoins } from "@/lib/utils";

interface TableRisk {
  phase: string;
  roundNo: number;
  players: number;
  pool: number;
  outcomes: { label: string; owed: number; houseNet: number }[];
  expectedHouseNet: number;
  worstHouseNet: number;
}
interface AviatorRisk {
  phase: string;
  roundNo: number;
  players: number;
  pool: number;
  paidSoFar: number;
  cashedOut: number;
  stillIn: number;
  maxWinPerBet: number;
}
interface Risk {
  aviator: AviatorRisk | null;
  color: TableRisk | null;
  wheel: TableRisk | null;
}

const net = (n: number) => (
  <span className={cn("font-bold tabular-nums", n >= 0 ? "text-brand-green" : "text-brand-red")}>
    {n >= 0 ? "+" : ""}
    {formatCoins(n)}
  </span>
);

function Table({ title, r }: { title: string; r: TableRisk | null }) {
  if (!r) return null;
  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-bold">{title}</h3>
        <span className="text-xs text-white/45">round {r.roundNo} · {r.phase}</span>
      </div>
      <p className="text-sm text-white/60">
        {formatCoins(r.players)} players · {formatCoins(r.pool)} staked
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-white/45">Expected house result</p>
          {net(r.expectedHouseNet)}
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-white/45">Worst case if this round ended now</p>
          {net(r.worstHouseNet)}
        </div>
      </div>
      <div className="mt-4 flex h-16 items-end gap-1">
        {(() => {
          const max = Math.max(1, ...r.outcomes.map((o) => Math.abs(o.houseNet)));
          return r.outcomes.map((o) => (
            <div key={o.label} className="flex flex-1 flex-col items-center gap-1" title={`Result ${o.label}: house ${o.houseNet}`}>
              <div
                className={cn("w-full rounded-sm", o.houseNet >= 0 ? "bg-brand-green/70" : "bg-brand-red/80")}
                style={{ height: `${Math.max(4, (Math.abs(o.houseNet) / max) * 48)}px` }}
              />
              <span className="text-[10px] text-white/40">{o.label}</span>
            </div>
          ));
        })()}
      </div>
      <p className="mt-2 text-[11px] text-white/40">Bars: house result for each possible result (green = house wins).</p>
    </GlassCard>
  );
}

export function RiskPanel() {
  const { data } = useApi<Risk>("/api/admin/risk", 3_000);
  if (!data) return null;
  const a = data.aviator;
  return (
    <section className="mt-6">
      <h2 className="mb-1 text-lg font-bold">Live table risk</h2>
      <p className="mb-4 text-sm text-white/50">What the house stands to win or lose on the round in progress. Updates every 3 seconds.</p>
      <div className="grid gap-4 xl:grid-cols-3">
        {a && (
          <GlassCard className="p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-bold">Aviator</h3>
              <span className="text-xs text-white/45">round {a.roundNo} · {a.phase}</span>
            </div>
            <p className="text-sm text-white/60">
              {formatCoins(a.players)} players · {formatCoins(a.pool)} staked
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/45">Cashed out / still in</p>
                <p className="font-bold">{a.cashedOut} / {a.stillIn}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/45">Paid so far</p>
                <p className="font-bold">{formatCoins(a.paidSoFar)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/45">Max win per bet: {formatCoins(a.maxWinPerBet)}. The crash point is fixed by a hash published before betting and is not visible here.</p>
          </GlassCard>
        )}
        <Table title="Color Prediction" r={data.color} />
        <Table title="Number Wheel" r={data.wheel} />
      </div>
    </section>
  );
}
