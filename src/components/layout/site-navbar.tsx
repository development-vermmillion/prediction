"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { useMounted } from "@/hooks/use-mounted";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/store/player";
import { WalletPill } from "./wallet-pill";

export function SiteNavbar() {
  const pathname = usePathname();
  const mounted = useMounted();
  const { loggedIn, name } = usePlayer();

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <div className="glass-strong mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  active ? "bg-white/15 text-white" : "text-white/60 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <WalletPill />
          {mounted && loggedIn ? (
            <Link href="/profile" aria-label="Profile">
              <Avatar name={name} size={38} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 sm:block"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
