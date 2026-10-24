import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span
        className="grid size-9 place-items-center rounded-xl font-display text-lg font-black text-white"
        style={{
          background: "linear-gradient(135deg,#ff5c9a,#ff2d55 55%,#ff9d00)",
          boxShadow: "0 8px 24px -6px rgb(255 45 85 / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.4)",
        }}
      >
        P
      </span>
      <span className="font-display text-lg font-black tracking-wider">{SITE_NAME.toUpperCase()}</span>
    </Link>
  );
}
