"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { CreditModal } from "@/components/admin/credit-modal";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Chip } from "@/components/ui/chip";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { formatCoins, formatDate, timeAgo } from "@/lib/utils";
import { toast } from "@/store/toast";
import type { PlatformUser, UserStatus } from "@/types";

const STATUS_COLOR: Record<UserStatus, string> = { active: "#22e58b", suspended: "#ffc83d", banned: "#ff2d55" };
const FILTERS: (UserStatus | "all")[] = ["all", "active", "suspended", "banned"];

export default function AdminUsersPage() {
  const { data, error, reload } = useApi<{ users: PlatformUser[] }>("/api/admin/users", 15_000);
  const [filter, setFilter] = useState<UserStatus | "all">("all");
  const [target, setTarget] = useState<PlatformUser | null>(null);

  const setStatus = async (id: number, status: UserStatus) => {
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", json: { status } });
      toast.success(`Player ${status}`);
      void reload();
    } catch (e) {
      toast.error("Could not update player", (e as Error).message);
    }
  };

  const columns: Column<PlatformUser>[] = [
    {
      key: "name",
      header: "Player",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size={34} />
          <div>
            <p className="font-semibold">{u.name}</p>
            <p className="text-xs text-white/45">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "bal", header: "Balance", className: "text-right tabular-nums", cell: (u) => <span className="font-bold">{formatCoins(u.balance)}</span> },
    { key: "wag", header: "Wagered", className: "text-right tabular-nums", cell: (u) => formatCoins(u.wagered) },
    { key: "won", header: "Won", className: "text-right tabular-nums", cell: (u) => formatCoins(u.won) },
    { key: "seen", header: "Last seen", cell: (u) => <span className="text-white/60">{timeAgo(u.lastSeenAt)}</span> },
    { key: "join", header: "Joined", cell: (u) => <span className="text-white/60">{formatDate(u.joinedAt)}</span> },
    { key: "status", header: "Status", cell: (u) => <Badge color={STATUS_COLOR[u.status]}>{u.status}</Badge> },
    {
      key: "actions",
      header: "",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <button className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-gold hover:underline" onClick={() => setTarget(u)}>
            <Coins size={13} /> Credits
          </button>
          {u.status === "active" ? (
            <>
              <button className="cursor-pointer text-xs font-semibold text-white/60 hover:underline" onClick={() => setStatus(u.id, "suspended")}>Suspend</button>
              <button className="cursor-pointer text-xs font-semibold text-brand-red hover:underline" onClick={() => setStatus(u.id, "banned")}>Ban</button>
            </>
          ) : (
            <button className="cursor-pointer text-xs font-semibold text-brand-green hover:underline" onClick={() => setStatus(u.id, "active")}>Restore</button>
          )}
        </div>
      ),
    },
  ];

  if (error) return <p className="text-brand-red">{error}</p>;
  const users = data?.users ?? [];
  const rows = filter === "all" ? users : users.filter((u) => u.status === filter);

  return (
    <>
      <PageHeader title="Players" subtitle={data ? `${users.length} registered players` : "Loading…"} />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(u) => String(u.id)}
        searchText={(u) => `${u.name} ${u.email}`}
        toolbar={
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </Chip>
            ))}
          </div>
        }
      />
      {target && <CreditModal user={target} onClose={() => setTarget(null)} onDone={() => void reload()} />}
    </>
  );
}
