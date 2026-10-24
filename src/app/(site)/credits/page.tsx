"use client";

import { useState } from "react";
import { AuthGate } from "@/components/auth/auth-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { formatCoins, timeAgo } from "@/lib/utils";
import { toast } from "@/store/toast";

interface Req { id: number; amount: number; message: string | null; status: string; at: number }
const COLOR: Record<string, string> = { pending: "#ffc83d", approved: "#22e58b", dismissed: "#ff2d55" };

function Content() {
  const { data, reload } = useApi<{ requests: Req[] }>("/api/credit-requests", 15_000);
  const [amount, setAmount] = useState(500);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api("/api/credit-requests", { method: "POST", json: { amount, message } });
      toast.success("Request sent", "The owner will add credits to your wallet.");
      setMessage("");
      void reload();
    } catch (e) {
      toast.error("Could not send request", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-3xl font-extrabold">Get credits</h1>
        <p className="mt-1 text-white/60">Ask the owner to add credits to your wallet. They appear instantly once approved.</p>
      </div>

      <GlassCard strong className="space-y-4 p-5">
        <label className="block text-sm">
          <span className="mb-1 block text-white/55">Credits requested</span>
          <input type="number" min={10} max={100000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="glass w-full rounded-xl bg-transparent px-3 py-3 text-lg font-bold outline-none" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-white/55">Message (optional)</span>
          <input value={message} maxLength={200} onChange={(e) => setMessage(e.target.value)} className="glass w-full rounded-xl bg-transparent px-3 py-3 outline-none" />
        </label>
        <Button full disabled={busy} onClick={submit}>{busy ? "Sending…" : "Send request"}</Button>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="mb-1 font-bold">Payment methods</h2>
        <p className="text-sm text-white/55">Online payment isn&apos;t available yet. For now, credits are added by the owner.</p>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="mb-3 font-bold">Your requests</h2>
        {(data?.requests ?? []).length === 0 ? (
          <p className="text-sm text-white/45">No requests yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {data!.requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold">{formatCoins(r.amount)} credits</p>
                  <p className="text-xs text-white/45">{timeAgo(r.at)}{r.message ? ` · ${r.message}` : ""}</p>
                </div>
                <Badge color={COLOR[r.status]}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

export default function CreditsPage() {
  return (
    <AuthGate>
      <Content />
    </AuthGate>
  );
}
