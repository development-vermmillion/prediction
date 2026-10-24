"use client";

import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/chip";
import { GAME_LABEL, MOCK_NOW } from "@/lib/mock/data";
import { cn, formatCoins, timeAgo } from "@/lib/utils";
import { adminService } from "@/services";
import type { AdminTransaction, TxnKind } from "@/types";

const KIND_COLOR: Record<TxnKind, string> = { bet: "#ff5c9a", win: "#22e58b", bonus: "#ffc83d", topup: "#22d3ee" };

const columns: Column<AdminTransaction>[] = [
  { key: "id", header: "ID", cell: (t) => <span className="font-display text-xs text-white/60">{t.id}</span> },
  { key: "user", header: "Player", cell: (t) => t.userName },
  { key: "kind", header: "Type", cell: (t) => <Badge color={KIND_COLOR[t.kind]}>{t.kind}</Badge> },
  { key: "game", header: "Source", cell: (t) => GAME_LABEL[t.game] },
  {
    key: "amount",
    header: "Amount",
    className: "text-right tabular-nums",
    cell: (t) => (
      <span className={cn("font-semibold", t.amount > 0 ? "text-brand-green" : "text-white")}>
        {t.amount > 0 ? "+" : ""}
        {formatCoins(t.amount)}
      </span>
    ),
  },
  { key: "at", header: "When", cell: (t) => <span className="text-white/60">{timeAgo(t.at, MOCK_NOW)}</span> },
];

export default function AdminTransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" subtitle="Coin movements across all players." />
      <DataTable
        rows={adminService.transactions()}
        columns={columns}
        rowKey={(t) => t.id}
        searchText={(t) => `${t.id} ${t.userName} ${t.kind} ${GAME_LABEL[t.game]}`}
      />
    </>
  );
}
