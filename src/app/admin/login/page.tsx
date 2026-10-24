"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/ui/logo";
import { api } from "@/lib/api";
import { useSession, type ClientUser } from "@/store/session";
import { toast } from "@/store/toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, setUser } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") router.replace("/admin");
  }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ user: ClientUser }>("/api/auth/login", { method: "POST", json: { email, password } });
      if (res.user.role !== "admin") {
        await api("/api/auth/logout", { method: "POST" }).catch(() => {});
        toast.error("Not an owner account");
        return;
      }
      setUser(res.user);
      toast.success("Welcome, owner");
      router.replace("/admin");
    } catch (err) {
      toast.error("Sign-in failed", (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = "glass w-full rounded-2xl px-4 py-3 outline-none placeholder:text-white/35 focus:border-white/40";

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <GlassCard strong className="w-full max-w-md p-8">
        <Logo href="/admin" className="mb-6 justify-center" />
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand-red/20 text-brand-red">
            <ShieldCheck />
          </span>
          <h1 className="text-2xl font-extrabold">Owner console</h1>
          <p className="text-sm text-white/55">Restricted area — sign in to continue.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input className={field} type="email" placeholder="Owner email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={field} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button full size="lg" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
