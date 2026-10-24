import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "ghost" | "success" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-[#ff5c9a] to-[#ff2d55] text-white shadow-[0_10px_30px_-8px_rgb(255_45_85/0.7),inset_0_1px_0_rgb(255_255_255/0.4)] hover:brightness-110",
  gold: "bg-gradient-to-br from-[#ffd75e] to-[#ff9d00] text-[#2b1700] shadow-[0_10px_30px_-8px_rgb(255_170_0/0.6),inset_0_1px_0_rgb(255_255_255/0.5)] hover:brightness-105",
  success:
    "bg-gradient-to-br from-[#3df0a0] to-[#0e9f6e] text-[#032a1a] shadow-[0_10px_30px_-8px_rgb(34_229_139/0.6),inset_0_1px_0_rgb(255_255_255/0.4)] hover:brightness-105",
  danger:
    "bg-gradient-to-br from-[#ff6b6b] to-[#c81e3a] text-white shadow-[0_10px_30px_-8px_rgb(255_45_85/0.5)] hover:brightness-110",
  glass: "glass text-white hover:bg-white/15",
  ghost: "text-white/80 hover:bg-white/10 hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-5 text-[15px] rounded-2xl",
  lg: "h-14 px-7 text-lg rounded-2xl",
};

export function Button({ variant = "primary", size = "md", full, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        full && "w-full",
        className,
      )}
      {...props}
    />
  );
}
