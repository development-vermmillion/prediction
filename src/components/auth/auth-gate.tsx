"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useSession } from "@/store/session";

/** Renders children only for a signed-in player; otherwise shows a sign-in prompt. */
export function AuthGate({ children, allowAdmin = false }: { children: React.ReactNode; allowAdmin?: boolean }) {
  const { user, loaded } = useSession();

  if (!loaded) return <div className="grid min-h-64 place-items-center text-white/45">Loading…</div>;

  if (!user) {
    return (
      <GlassCard strong className="mx-auto mt-10 max-w-md p-8 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-red/20 text-brand-pink">
          <LogIn />
        </span>
        <h2 className="text-xl font-extrabold">Sign in to play</h2>
        <p className="mt-2 mb-6 text-sm text-white/60">Create a free account to join live rounds with other players.</p>
        <div className="flex justify-center gap-3">
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="glass">Create account</Button>
          </Link>
        </div>
      </GlassCard>
    );
  }

  if (user.role === "admin" && !allowAdmin) {
    return (
      <GlassCard className="mx-auto mt-10 max-w-md p-8 text-center">
        <h2 className="text-xl font-extrabold">Owner account</h2>
        <p className="mt-2 mb-6 text-sm text-white/60">Owner accounts manage the platform and cannot place bets.</p>
        <Link href="/admin">
          <Button>Open owner console</Button>
        </Link>
      </GlassCard>
    );
  }

  return <>{children}</>;
}
