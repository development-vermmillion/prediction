"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { DAILY_BONUS, SITE_NAME, STARTING_BALANCE } from "@/lib/constants";
import { toast } from "@/store/toast";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState(SITE_NAME);
  const [starting, setStarting] = useState(STARTING_BALANCE);
  const [daily, setDaily] = useState(DAILY_BONUS);
  const [maintenance, setMaintenance] = useState(false);

  const input = "glass w-full rounded-xl px-3 py-2.5 outline-none";

  return (
    <>
      <PageHeader title="Settings" subtitle="Global platform configuration." />
      <GlassCard className="max-w-2xl space-y-5 p-6">
        <label className="block text-sm">
          <span className="mb-1 block text-white/55">Site name</span>
          <input className={input} value={siteName} onChange={(e) => setSiteName(e.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-white/55">Starting balance (coins)</span>
            <input type="number" className={input} value={starting} onChange={(e) => setStarting(Number(e.target.value))} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-white/55">Daily bonus base (coins)</span>
            <input type="number" className={input} value={daily} onChange={(e) => setDaily(Number(e.target.value))} />
          </label>
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-white/5 p-4">
          <span>
            <span className="block font-semibold">Maintenance mode</span>
            <span className="text-sm text-white/50">Temporarily disable all games for players.</span>
          </span>
          <input type="checkbox" className="size-5 accent-[#ff2d55]" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
        </label>
        <p className="rounded-2xl bg-brand-gold/10 p-4 text-sm text-brand-gold">
          These values are not persisted yet — connect them to your backend in <code>src/services</code>.
        </p>
        <Button onClick={() => toast.success("Settings saved (demo)")}>Save settings</Button>
      </GlassCard>
    </>
  );
}
