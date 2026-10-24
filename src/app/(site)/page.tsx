import Link from "next/link";
import { Plane, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { DailyStreak } from "@/components/home/daily-streak";
import { GameArt } from "@/components/home/game-art";
import { GameCard } from "@/components/home/game-card";
import { LiveWins } from "@/components/home/live-wins";
import { Podium } from "@/components/home/podium";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeader } from "@/components/ui/section-header";
import { GAMES, SITE_NAME } from "@/lib/constants";
import { playerService } from "@/services";

const PERKS = [
  { icon: Zap, title: "Instant rounds", text: "New rounds every few seconds — no waiting around." },
  { icon: ShieldCheck, title: "Free to play", text: "Virtual coins only. Nothing to deposit or withdraw." },
  { icon: Sparkles, title: "Daily rewards", text: "Keep your streak alive for growing bonuses." },
];

export default function HomePage() {
  const top = playerService.leaderboard().slice(0, 3);

  return (
    <div className="space-y-14 md:space-y-20">
      {/* Hero */}
      <section className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fade-up">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest text-brand-pink uppercase">
            <span className="size-2 animate-pulse-glow rounded-full bg-brand-green" /> 32,000+ players online
          </span>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] font-black md:text-6xl">
            Predict. <span className="text-gradient">Play.</span>
            <br />
            Rise to the top.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/65">
            {SITE_NAME} is your arcade of four fast prediction games — Aviator, Ludo, Color Prediction and the Number Wheel.
            Start with 2,450 free coins.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/games/aviator">
              <Button size="lg">
                <Plane size={20} /> Play Aviator
              </Button>
            </Link>
            <Link href="/games">
              <Button size="lg" variant="glass">
                Browse all games
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-8 rounded-full bg-brand-red/30 blur-[80px]" />
          <GlassCard strong className="absolute top-4 left-2 animate-float p-5">
            <GameArt id="aviator" size={110} />
          </GlassCard>
          <GlassCard strong className="absolute top-24 right-0 animate-float p-5 [animation-delay:-2s]">
            <GameArt id="number-wheel" size={120} />
          </GlassCard>
          <GlassCard strong className="absolute bottom-6 left-10 animate-float p-5 [animation-delay:-4s]">
            <GameArt id="ludo" size={100} />
          </GlassCard>
          <GlassCard strong className="absolute right-12 bottom-0 animate-float p-4 [animation-delay:-1s]">
            <GameArt id="color-prediction" size={80} />
          </GlassCard>
        </div>
      </section>

      <LiveWins />

      {/* Games bento */}
      <section>
        <SectionHeader eyebrow="Pick your game" title="Four ways to play" href="/games" />
        <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
          <div className="md:col-span-2 md:row-span-2">
            <GameCard game={GAMES[0]} tall />
          </div>
          <div className="md:col-span-2">
            <GameCard game={GAMES[1]} />
          </div>
          <GameCard game={GAMES[2]} />
          <GameCard game={GAMES[3]} />
        </div>
      </section>

      {/* Perks + streak */}
      <section className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <GlassCard key={title} className="flex items-center gap-4 p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-brand-pink">
                <Icon />
              </span>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-sm text-white/60">{text}</p>
              </div>
            </GlassCard>
          ))}
        </div>
        <DailyStreak />
      </section>

      {/* Leaderboard teaser */}
      <section>
        <SectionHeader eyebrow="This week" title="Top predictors" href="/leaderboard" />
        <GlassCard className="p-6 pt-10 md:p-10 md:pt-14">
          <Podium entries={top} />
        </GlassCard>
      </section>
    </div>
  );
}
