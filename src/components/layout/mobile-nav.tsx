"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Gift, Home, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/profile", label: "Me", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full p-1.5 md:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold transition",
              active ? "bg-gradient-to-br from-[#ff5c9a] to-[#ff2d55] text-white shadow-lg" : "text-white/55",
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
