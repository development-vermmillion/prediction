"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CreditModal } from "@/components/admin/credit-modal";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { useApi } from "@/hooks/use-api";
import { cn, formatCoins, timeAgo } from "@/lib/utils";
import type { AdminLedgerEntry, PlatformUser } from "@/types";

const columns: Column<AdminLedgerEntry>[] = [
  { key: "when", header: "When", cell: (e) => <span className="text-white/60">{timeAgo(e.at)}</span> },
  { key: "user", header: "Player", cell: (e) => <span className="font-semibold">{e.userName}</span> },
  {
    key: "kind",
    header: "Action",
    cell: (e) => <Badge color={e.kind === "grant" ? "#22e58b" : "#ff2d55"}>{e.kind === "grant" ? "Added" : "Removed"}</Badge>,
  },
  {
    key: "amount",
    header: "Amount",
    className: "text-right tabular-nums",
    cell: (e) => <span className={cn("font-bold", e.amount > 0 ? "text-brand-green" : "text-brand-red")}>{e.amount > 0 ? "+" : ""}{formatCoins(e.amount)}</span>,
  },
  { key: "bal", header: "Balance after", className: "text-right tabular-nums", cell: (e) => formatCoins(e.balanceAfter) },
  { key: "note", header: "Note", cell: (e) => <span className="text-white/65">{e.note}</span> },
  { key: "by", header: "By", cell: (e) => <span className="text-white/50">{e.adminName ?? "—"}</span> },
];

export default function AdminCreditsPage() {
  const users = useApi<{ users: PlatformUser[] }>("/api/admin/users");
  const log = useApi<{ entries: AdminLedgerEntry[] }>("/api/admin/ledger?kinds=grant,deduct", 15_000);
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<PlatformUser | null>(null);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return (users.data?.users ?? []).filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(term)).slice(0, 6);
  }, [q, users.data]);

  return (
    <>
      <PageHeader title="Credits" subtitle="Allocate credits to players. They appear in the player's wallet instantly and every change is logged." />

      <GlassCard strong className="mb-6 p-5">
        <h2 className="mb-3 font-bold">Find a player</h2>
        <label className="glass flex items-center gap-2 rounded-xl px-3 py-3">
          <Search size={18} className="text-white/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="w-full bg-transparent outline-none placeholder:text-white/35" />
        </label>
        {q.trim() && (
          <ul className="mt-3 divide-y divide-white/10">
            {matches.length === 0 && <li className="py-4 text-center text-sm text-white/45">No players match.</li>}
            {matches.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <Avatar name={u.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{u.name}</p>
                  <p className="truncate text-xs text-white/45">{u.email}</p>
                </div>
                <span className="font-display font-bold">{formatCoins(u.balance)}</span>
                <button onClick={() => setTarget(u)} className="cursor-pointer rounded-xl bg-brand-gold/20 px-3 py-1.5 text-sm font-semibold text-brand-gold hover:bg-brand-gold/30">
                  Allocate
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <h2 className="mb-3 font-bold">Allocation log</h2>
      <DataTable
        rows={log.data?.entries ?? []}
        columns={columns}
        rowKey={(e) => String(e.id)}
        searchText={(e) => `${e.userName} ${e.note ?? ""}`}
      />

      {target && (
        <CreditModal
          user={target}
          onClose={() => setTarget(null)}
          onDone={() => {
            void users.reload();
            void log.reload();
            setQ("");
          }}
        />
      )}
    </>
  );
}
