"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Gamepad2,
  Coins,
  LayoutDashboard,
  LogOut,
  Menu,
  Timer,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Players", icon: Users },
  { href: "/admin/credits", label: "Credits", icon: Coins },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/rounds", label: "Rounds", icon: Timer },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loaded, logout } = useSession();
  const [open, setOpen] = useState(false);
  const authed = !!user && user.role === "admin";
  const email = user?.email ?? null;

  useEffect(() => {
    if (loaded && !authed) router.replace("/admin/login");
  }, [loaded, authed, router]);

  if (!loaded || !authed) {
    return <div className="grid min-h-dvh place-items-center text-white/50">Checking access…</div>;
  }

  const sidebar = (
    <div className="flex h-full flex-col p-4">
      <Logo href="/admin" className="mb-1 px-2" />
      <p className="mb-6 px-2 text-xs font-bold tracking-widest text-brand-pink uppercase">Owner console</p>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "bg-gradient-to-r from-[#ff2d55]/30 to-transparent text-white ring-1 ring-white/15"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={18} /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="glass flex items-center gap-3 rounded-2xl p-3">
        <Avatar name={email ?? "A"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{email}</p>
          <p className="text-xs text-white/45">Owner</p>
        </div>
        <button
          aria-label="Sign out"
          className="cursor-pointer rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          onClick={async () => {
            await logout();
            router.replace("/admin/login");
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="glass sticky top-0 hidden h-dvh rounded-none border-y-0 border-l-0 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      <div className="glass-strong sticky top-0 z-30 flex items-center justify-between rounded-none px-4 py-3 lg:hidden">
        <Logo href="/admin" />
        <button aria-label="Menu" className="cursor-pointer p-2" onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="glass-strong absolute inset-y-0 left-0 w-72 rounded-none">
            <button aria-label="Close" className="absolute top-4 right-4 cursor-pointer" onClick={() => setOpen(false)}>
              <X />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
