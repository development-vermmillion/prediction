"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { MOCK_NOW } from "@/lib/mock/data";
import { cn, formatCoins, formatDate, uid } from "@/lib/utils";
import { adminService } from "@/services";
import { toast } from "@/store/toast";
import type { Promotion } from "@/types";

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>(() => adminService.promotions());
  const [title, setTitle] = useState("");
  const [coins, setCoins] = useState(500);

  const toggle = (id: string) => setPromos((l) => l.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Give the promotion a title");
    setPromos((l) => [
      {
        id: uid("promo"),
        title: title.trim(),
        description: `${coins} bonus coins for eligible players.`,
        coins,
        active: true,
        claimed: 0,
        endsAt: MOCK_NOW + 30 * 86_400_000,
      },
      ...l,
    ]);
    setTitle("");
    toast.success("Promotion created");
  };

  return (
    <>
      <PageHeader title="Promotions" subtitle="Bonuses and campaigns shown on the Rewards page." />

      <GlassCard className="mb-6 p-5">
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1 text-sm">
            <span className="mb-1 block text-white/55">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali bonus" className="glass w-full rounded-xl px-3 py-2.5 outline-none placeholder:text-white/30" />
          </label>
          <label className="w-36 text-sm">
            <span className="mb-1 block text-white/55">Coins</span>
            <input type="number" value={coins} onChange={(e) => setCoins(Math.max(1, Number(e.target.value)))} className="glass w-full rounded-xl px-3 py-2.5 outline-none" />
          </label>
          <Button type="submit">Create promotion</Button>
        </form>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {promos.map((p) => (
          <GlassCard key={p.id} className="flex flex-col p-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="font-bold">{p.title}</h3>
              <Badge color={p.active ? "#22e58b" : "#94a3b8"}>{p.active ? "Active" : "Paused"}</Badge>
            </div>
            <p className="flex-1 text-sm text-white/60">{p.description}</p>
            <dl className="my-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-white/5 p-2"><dt className="text-white/45">Reward</dt><dd className="font-display font-bold text-brand-gold">{formatCoins(p.coins)}</dd></div>
              <div className="rounded-xl bg-white/5 p-2"><dt className="text-white/45">Claimed</dt><dd className="font-display font-bold">{formatCoins(p.claimed)}</dd></div>
              <div className="rounded-xl bg-white/5 p-2"><dt className="text-white/45">Ends</dt><dd className="font-bold">{formatDate(p.endsAt)}</dd></div>
            </dl>
            <Button variant={p.active ? "glass" : "success"} size="sm" onClick={() => toggle(p.id)} className={cn(p.active && "text-white/80")}>
              {p.active ? "Pause" : "Activate"}
            </Button>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
