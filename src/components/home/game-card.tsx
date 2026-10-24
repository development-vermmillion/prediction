import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { formatCompact } from "@/lib/utils";
import type { GameMeta } from "@/types";
import { GameArt } from "./game-art";

export function GameCard({ game, tall }: { game: GameMeta; tall?: boolean }) {
  return (
    <Link
      href={game.href}
      className="group glass relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 transition hover:-translate-y-1 md:p-6"
      style={{ minHeight: tall ? 300 : 200, boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.22), 0 24px 60px -28px ${game.accent}` }}
    >
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full opacity-40 blur-3xl transition group-hover:opacity-70"
        style={{ background: game.accent }}
      />
      <div className="relative flex items-start justify-between">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: `${game.accent}30`, color: game.accent }}
        >
          up to {game.maxMultiplier}
        </span>
        <span className="grid size-9 place-items-center rounded-full bg-white/10 transition group-hover:bg-white group-hover:text-black">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="relative -mb-2 self-end transition group-hover:scale-110 group-hover:rotate-3">
        <GameArt id={game.id} size={tall ? 150 : 104} />
      </div>
      <div className="relative -mt-14">
        <h3 className="text-xl font-extrabold md:text-2xl">{game.name}</h3>
        <p className="mt-1 max-w-[70%] text-sm text-white/60">{game.tagline}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-white/50">
          <Users size={14} /> Live multiplayer · {game.maxMultiplier}
        </p>
      </div>
    </Link>
  );
}
