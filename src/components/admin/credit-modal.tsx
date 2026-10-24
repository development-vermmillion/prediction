"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/lib/api";
import { formatCoins } from "@/lib/utils";
import { toast } from "@/store/toast";

interface CreditModalProps {
  user: { id: number; name: string; email: string; balance: number };
  onClose: () => void;
  onDone: () => void;
}

const QUICK = [100, 500, 1000, 5000, 10000];

/** Owner credit allocation: add credits to, or remove credits from, a player's wallet. */
export function CreditModal({ user, onClose, onDone }: CreditModalProps) {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState(1000);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isInteger(amount) || amount <= 0) return toast.error("Enter a whole number above 0");
    setBusy(true);
    try {
      const res = await api<{ balance: number }>(`/api/admin/users/${user.id}/credits`, {
        method: "POST",
        json: { amount: mode === "add" ? amount : -amount, note },
      });
      toast.success(
        mode === "add" ? `Added ${formatCoins(amount)} credits` : `Removed ${formatCoins(amount)} credits`,
        `${user.name} now has ${formatCoins(res.balance)}`,
      );
      onDone();
      onClose();
    } catch (err) {
      toast.error("Could not update credits", (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <GlassCard strong className="relative w-full max-w-md p-6">
        <button aria-label="Close" onClick={onClose} className="absolute top-4 right-4 cursor-pointer text-white/60 hover:text-white">
          <X />
        </button>
        <h2 className="text-lg font-extrabold">Allocate credits</h2>
        <p className="mt-1 text-sm text-white/60">
          {user.name} · {user.email}
        </p>
        <p className="mt-1 text-sm">
          Current balance: <span className="font-display font-bold">{formatCoins(user.balance)}</span>
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Chip type="button" active={mode === "add"} color="#22e58b" onClick={() => setMode("add")}>
              Add credits
            </Chip>
            <Chip type="button" active={mode === "remove"} color="#ff2d55" onClick={() => setMode("remove")}>
              Remove credits
            </Chip>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-white/55">Amount</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.floor(Number(e.target.value)))}
              className="glass w-full rounded-xl px-3 py-2.5 font-display text-lg font-bold outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <Chip key={q} type="button" active={amount === q} onClick={() => setAmount(q)}>
                {formatCoins(q)}
              </Chip>
            ))}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-white/55">Note (optional, visible in the ledger)</span>
            <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid via UPI ref 1234" className="glass w-full rounded-xl px-3 py-2.5 outline-none placeholder:text-white/30" />
          </label>
          <Button full size="lg" type="submit" variant={mode === "add" ? "success" : "danger"} disabled={busy}>
            {busy ? "Saving…" : mode === "add" ? `Add ${formatCoins(amount || 0)} credits` : `Remove ${formatCoins(amount || 0)} credits`}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
