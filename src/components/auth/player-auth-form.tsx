"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/ui/logo";
import { api } from "@/lib/api";
import { useSession, type ClientUser } from "@/store/session";
import { toast } from "@/store/toast";

export function PlayerAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const setUser = useSession((s) => s.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = await api<{ user: ClientUser }>(`/api/auth/${mode}`, {
        method: "POST",
        json: isRegister ? { name, email, password } : { email, password },
      });
      if (user.role === "admin") {
        setUser(user);
        router.push("/admin");
        return;
      }
      setUser(user);
      toast.success(isRegister ? "Account created" : "Welcome back");
      router.push("/");
    } catch (err) {
      toast.error(isRegister ? "Could not register" : "Could not sign in", (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = "glass w-full rounded-2xl px-4 py-3 outline-none placeholder:text-white/35 focus:border-white/40";

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <GlassCard strong className="w-full max-w-md p-8">
        <Logo className="mb-6 justify-center" />
        <h1 className="mb-1 text-center text-2xl font-extrabold">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mb-6 text-center text-sm text-white/55">
          {isRegister ? "Join live rounds with players online right now." : "Sign in to keep playing."}
        </p>
        <form onSubmit={submit} className="space-y-3">
          {isRegister && (
            <input className={field} placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          )}
          <input className={field} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className={field}
            type="password"
            placeholder={isRegister ? "Password (min 8 characters)" : "Password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button full size="lg" type="submit" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Sign up" : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-white/55">
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-brand-pink">
            {isRegister ? "Sign in" : "Create account"}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
