"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/ui/logo";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/constants";
import { useAdminAuth } from "@/store/admin-auth";
import { toast } from "@/store/toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { authed, login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (authed) router.replace("/admin");
  }, [authed, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      toast.success("Welcome, owner");
      router.replace("/admin");
    } else {
      toast.error("Invalid credentials");
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
          <input className={field} type="email" placeholder="Owner email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button full size="lg" type="submit">Sign in</Button>
        </form>
        <div className="mt-5 rounded-2xl bg-white/5 p-3 text-xs text-white/55">
          Demo credentials: <span className="font-semibold text-white/80">{ADMIN_EMAIL}</span> /{" "}
          <span className="font-semibold text-white/80">{ADMIN_PASSWORD}</span>
        </div>
      </GlassCard>
    </div>
  );
}
