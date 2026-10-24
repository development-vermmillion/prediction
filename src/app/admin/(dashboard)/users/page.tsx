"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Chip } from "@/components/ui/chip";
import { GAME_LABEL, MOCK_NOW } from "@/lib/mock/data";
import { formatCoins, formatDate, timeAgo } from "@/lib/utils";
import { adminService } from "@/services";
import { toast } from "@/store/toast";
import type { PlatformUser, UserStatus } from "@/types";

const STATUS_COLOR: Record<UserStatus, string> = { active: "#22e58b", suspended: "#ffc83d", banned: "#ff2d55" };
const FILTERS: (UserStatus | "all")[] = ["all", "active", "suspended", "banned"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>(() => adminService.users());
  const [filter, setFilter] = useState<UserStatus | "all">("all");

  const setStatus = (id: string, status: UserStatus) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, status } : u)));
    toast.success(`Player ${status}`);
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
    { key: "country", header: "Country", cell: (u) => u.country },
    { key: "fav", header: "Favourite", cell: (u) => GAME_LABEL[u.favourite] },
    { key: "bal", header: "Balance", className: "text-right tabular-nums", cell: (u) => formatCoins(u.balance) },
    { key: "wag", header: "Wagered", className: "text-right tabular-nums", cell: (u) => formatCoins(u.wagered) },
    { key: "seen", header: "Last seen", cell: (u) => <span className="text-white/60">{timeAgo(u.lastSeenAt, MOCK_NOW)}</span> },
    { key: "join", header: "Joined", cell: (u) => <span className="text-white/60">{formatDate(u.joinedAt)}</span> },
    { key: "status", header: "Status", cell: (u) => <Badge color={STATUS_COLOR[u.status]}>{u.status}</Badge> },
    {
      key: "actions",
      header: "",
      cell: (u) =>
        u.status === "active" ? (
          <div className="flex gap-2">
            <button className="cursor-pointer text-xs font-semibold text-brand-gold hover:underline" onClick={() => setStatus(u.id, "suspended")}>Suspend</button>
            <button className="cursor-pointer text-xs font-semibold text-brand-red hover:underline" onClick={() => setStatus(u.id, "banned")}>Ban</button>
          </div>
        ) : (
          <button className="cursor-pointer text-xs font-semibold text-brand-green hover:underline" onClick={() => setStatus(u.id, "active")}>Restore</button>
        ),
    },
  ];

  const rows = filter === "all" ? users : users.filter((u) => u.status === filter);

  return (
    <>
      <PageHeader title="Players" subtitle={`${users.length} registered players`} />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(u) => u.id}
        searchText={(u) => `${u.name} ${u.email} ${u.country}`}
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
    </>
  );
}
