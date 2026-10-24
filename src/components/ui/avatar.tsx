import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  hue?: [string, string];
  size?: number;
  className?: string;
}

export function Avatar({ name, hue = ["#ff5c9a", "#7c5cff"], size = 36, className }: AvatarProps) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-bold text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${hue[0]}, ${hue[1]})`,
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.4)",
      }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
