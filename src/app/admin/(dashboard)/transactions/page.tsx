"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Badge, Chip } from "@/components/ui/chip";
import { useApi } from "@/hooks/use-api";
import { GAME_LABEL } from "@/lib/constants";
import { cn, formatCoins, timeAgo } from "@/lib/utils";
import type { AdminLedgerEntry, TxnKind } from "@/types";

const KIND_COLOR: Record<TxnKind, string> = { bet: "#ff5c9a", win: "#22e58b", grant: "#ffc83d", deduct: "#ff2d55", refund: "#22d3ee" };
const KINDS: (TxnKind | "all")[] = ["all", "bet", "win", "grant", "deduct", "refund"];

const columns: Column<AdminLedgerEntry>[] = [
  { key: "id", header: "ID", cell: (t) => <span className="font-display text-xs text-white/60">#{t.id}</span> },
  { key: "user", header: "Player", cell: (t) => t.userName },
  { key: "kind", header: "Type", cell: (t) => <Badge color={KIND_COLOR[t.kind]}>{t.kind}</Badge> },
  { key: "game", header: "Source", cell: (t) => (t.game ? (GAME_LABEL[t.game] ?? t.game) : "—") },
  {
    key: "amount",
    header: "Amount",
    className: "text-right tabular-nums",
    cell: (t) => <span className={cn("font-semibold", t.amount > 0 ? "text-brand-green" : "text-white")}>{t.amount > 0 ? "+" : ""}{formatCoins(t.amount)}</span>,
  },
  { key: "bal", header: "Balance after", className: "text-right tabular-nums", cell: (t) => formatCoins(t.balanceAfter) },
  { key: "note", header: "Note", cell: (t) => <span className="text-white/55">{t.note}</span> },
  { key: "at", header: "When", cell: (t) => <span className="text-white/60">{timeAgo(t.at)}</span> },
];

export default function AdminTransactionsPage() {
  const { data, error } = useApi<{ entries: AdminLedgerEntry[] }>("/api/admin/ledger", 10_000);
  const [kind, setKind] = useState<TxnKind | "all">("all");
  if (error) return <p className="text-brand-red">{error}</p>;
  const all = data?.entries ?? [];
  const rows = kind === "all" ? all : all.filter((e) => e.kind === kind);

  return (
    <>
      <PageHeader title="Transactions" subtitle="Full credit ledger across all players (latest 500)." />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(t) => String(t.id)}
        searchText={(t) => `${t.id} ${t.userName} ${t.kind} ${t.note ?? ""}`}
        toolbar={
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
                {k[0].toUpperCase() + k.slice(1)}
              </Chip>
            ))}
          </div>
        }
      />
    </>
  );
}
