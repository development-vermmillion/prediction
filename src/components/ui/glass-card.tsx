import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  glow?: string;
}

export function GlassCard({ className, strong, glow, style, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn("glass rounded-3xl", strong && "glass-strong", className)}
      style={glow ? { ...style, boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.22), 0 20px 60px -20px ${glow}` } : style}
      {...props}
    >
      {children}
    </div>
  );
}
