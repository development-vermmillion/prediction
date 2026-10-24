"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Chip } from "@/components/ui/chip";
import { useApi } from "@/hooks/use-api";
import { GAME_LABEL, GAMES } from "@/lib/constants";
import { cn, formatCoins, timeAgo } from "@/lib/utils";
import type { RoundRecord } from "@/types";

const columns: Column<RoundRecord>[] = [
  { key: "id", header: "Round", cell: (r) => <span className="font-display text-xs text-white/60">#{r.id}</span> },
  { key: "game", header: "Game", cell: (r) => GAME_LABEL[r.game] ?? r.game },
  { key: "result", header: "Result", cell: (r) => <span className="font-display font-bold">{r.result}</span> },
  { key: "players", header: "Players", className: "text-right tabular-nums", cell: (r) => r.players },
  { key: "wagered", header: "Wagered", className: "text-right tabular-nums", cell: (r) => formatCoins(r.wagered) },
  { key: "paid", header: "Paid out", className: "text-right tabular-nums", cell: (r) => formatCoins(r.paidOut) },
  {
    key: "net",
    header: "House net",
    className: "text-right tabular-nums",
    cell: (r) => {
      const net = r.wagered - r.paidOut;
      return <span className={cn("font-semibold", net >= 0 ? "text-brand-green" : "text-brand-red")}>{net >= 0 ? "+" : ""}{formatCoins(net)}</span>;
    },
  },
  { key: "at", header: "When", cell: (r) => <span className="text-white/60">{timeAgo(r.at)}</span> },
];

export default function AdminRoundsPage() {
  const { data, error } = useApi<{ rounds: RoundRecord[] }>("/api/admin/rounds", 10_000);
  const [game, setGame] = useState<string>("all");
  if (error) return <p className="text-brand-red">{error}</p>;
  const all = data?.rounds ?? [];
  const rows = game === "all" ? all : all.filter((r) => r.game === game);

  return (
    <>
      <PageHeader title="Rounds" subtitle="Every settled round with house profit and loss (latest 500)." />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => String(r.id)}
        searchText={(r) => `${r.id} ${GAME_LABEL[r.game] ?? r.game} ${r.result}`}
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Chip active={game === "all"} onClick={() => setGame("all")}>All</Chip>
            {GAMES.map((g) => (
              <Chip key={g.id} active={game === g.id} color={g.accent} onClick={() => setGame(g.id)}>
                {g.name}
              </Chip>
            ))}
          </div>
        }
      />
    </>
  );
}
