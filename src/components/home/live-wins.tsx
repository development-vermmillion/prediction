import { Avatar } from "@/components/ui/avatar";
import { Coin } from "@/components/ui/coin";
import { formatCoins } from "@/lib/utils";
import { playerService } from "@/services";

export function LiveWins() {
  const wins = playerService.liveWins();
  const loop = [...wins, ...wins];
  return (
    <div className="relative overflow-hidden rounded-full">
      <div className="flex w-max animate-ticker gap-3 py-1 hover:[animation-play-state:paused]">
        {loop.map((w, i) => (
          <div key={`${w.id}-${i}`} className="glass flex items-center gap-3 rounded-full py-2 pr-5 pl-2">
            <Avatar name={w.name} hue={w.hue} size={34} />
            <div className="text-sm leading-tight">
              <p className="font-bold">
                {w.name} <span className="font-normal text-white/50">· {w.game}</span>
              </p>
              <p className="text-xs text-white/55">{w.detail}</p>
            </div>
            <span className="flex items-center gap-1 font-display text-sm font-bold text-brand-green">
              +{formatCoins(w.amount)} <Coin size={16} />
            </span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#07050f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#07050f] to-transparent" />
    </div>
  );
}
