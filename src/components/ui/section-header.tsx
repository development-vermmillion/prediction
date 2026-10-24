import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  href?: string;
  action?: string;
}

export function SectionHeader({ title, eyebrow, href, action = "See all" }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold tracking-[0.2em] text-brand-pink uppercase">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold md:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-white/60 hover:text-white">
          {action} <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
