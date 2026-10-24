"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/ui/logo";
import { toast } from "@/store/toast";
import { usePlayer } from "@/store/player";

export function PlayerAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const signIn = usePlayer((s) => s.signIn);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isRegister = mode === "register";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 4 || (isRegister && !name.trim())) {
      toast.error("Check your details", "Enter a valid email and a password of 4+ characters.");
      return;
    }
    signIn(isRegister ? name.trim() : email.split("@")[0], email);
    toast.success(isRegister ? "Account created" : "Welcome back");
    router.push("/");
  };

  const field = "glass w-full rounded-2xl px-4 py-3 outline-none placeholder:text-white/35 focus:border-white/40";

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <GlassCard strong className="w-full max-w-md p-8">
        <Logo className="mb-6 justify-center" />
        <h1 className="mb-1 text-center text-2xl font-extrabold">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mb-6 text-center text-sm text-white/55">
          {isRegister ? "Get 2,450 free coins instantly." : "Sign in to keep playing."}
        </p>
        <form onSubmit={submit} className="space-y-3">
          {isRegister && <input className={field} placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />}
          <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button full size="lg" type="submit">{isRegister ? "Sign up" : "Sign in"}</Button>
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
