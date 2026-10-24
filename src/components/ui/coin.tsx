import { cn } from "@/lib/utils";

export function Coin({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-black text-[#6b3b00]", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: "radial-gradient(circle at 30% 25%, #fff3b0, #ffc83d 45%, #e08a00)",
        boxShadow: "inset 0 -2px 3px rgb(160 80 0 / 0.5), 0 2px 6px rgb(255 170 0 / 0.4)",
      }}
    >
      C
    </span>
  );
}
