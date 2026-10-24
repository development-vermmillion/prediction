import { TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number; // percent change
  icon?: React.ReactNode;
  accent?: string;
}

export function StatCard({ label, value, delta, icon, accent = "#ff2d55" }: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <GlassCard className="relative overflow-hidden p-5">
      <div className="absolute -top-10 -right-10 size-32 rounded-full opacity-30 blur-3xl" style={{ background: accent }} />
      <div className="relative flex items-start justify-between">
        <p className="text-sm text-white/60">{label}</p>
        {icon && (
          <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${accent}25`, color: accent }}>
            {icon}
          </span>
        )}
      </div>
      <p className="relative mt-2 font-display text-2xl font-bold md:text-3xl">{value}</p>
      {delta !== undefined && (
        <p className={cn("relative mt-1 flex items-center gap-1 text-xs font-semibold", up ? "text-brand-green" : "text-brand-red")}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {Math.abs(delta).toFixed(1)}% vs prev. period
        </p>
      )}
    </GlassCard>
  );
}
