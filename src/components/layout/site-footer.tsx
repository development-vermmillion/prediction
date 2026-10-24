import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { GAMES, SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-20 max-w-7xl px-4 pb-32 md:px-6 md:pb-12">
      <div className="glass rounded-3xl p-6 md:p-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-white/60">
              {SITE_NAME} is a free-to-play prediction arcade. All games use virtual coins that have no cash value and can
              never be withdrawn.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold">Games</h4>
            <ul className="space-y-2 text-sm text-white/60">
              {GAMES.map((g) => (
                <li key={g.id}>
                  <Link href={g.href} className="hover:text-white">
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold">Account</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/wallet" className="hover:text-white">Wallet</Link></li>
              <li><Link href="/rewards" className="hover:text-white">Rewards</Link></li>
              <li><Link href="/profile" className="hover:text-white">Profile</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-white/10 pt-5 text-xs text-white/40">
          © {new Date().getFullYear()} {SITE_NAME}. For entertainment only · 18+ · Play responsibly.
        </p>
      </div>
    </footer>
  );
}
