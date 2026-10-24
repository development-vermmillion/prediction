"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { formatCoins } from "@/lib/utils";
import { useSession } from "@/store/session";

function ProfileView() {
  const router = useRouter();
  const user = useSession((s) => s.user)!;
  const logout = useSession((s) => s.logout);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <GlassCard strong className="flex flex-col items-center gap-4 p-8 text-center md:flex-row md:text-left">
        <Avatar name={user.name} size={84} />
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{user.name}</h1>
          <p className="text-white/55">{user.email}</p>
        </div>
        <Button
          variant="glass"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
        >
          <LogOut size={16} /> Sign out
        </Button>
      </GlassCard>
      <GlassCard className="p-5">
        <p className="text-sm text-white/55">Balance</p>
        <p className="font-display text-2xl font-bold">{formatCoins(user.balance)} credits</p>
      </GlassCard>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGate allowAdmin>
      <ProfileView />
    </AuthGate>
  );
}
