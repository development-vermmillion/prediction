import { cn } from "@/lib/utils";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: string;
}

export function Chip({ active, color = "#ff2d55", className, style, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition active:scale-95 disabled:opacity-40",
        active ? "text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
        className,
      )}
      style={active ? { ...style, borderColor: color, background: `${color}33`, boxShadow: `0 0 18px -4px ${color}` } : style}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  color = "#ff2d55",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}
      style={{ background: `${color}26`, color }}
    >
      {children}
    </span>
  );
}
