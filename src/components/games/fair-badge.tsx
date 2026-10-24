import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/** Shows the fingerprint (hash) the server committed to before betting opened. */
export function FairBadge({ commit }: { commit?: string | null }) {
  if (!commit) return null;
  return (
    <Link href="/fairness" className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70" title="Round fingerprint. After the round you can verify it on the Fairness page.">
      <ShieldCheck size={13} className="text-brand-green" />
      Round fingerprint <span className="font-mono">{commit.slice(0, 12)}…</span>
    </Link>
  );
}
