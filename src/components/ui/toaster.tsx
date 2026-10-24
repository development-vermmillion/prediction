"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToast } from "@/store/toast";

const ICONS = {
  success: <CheckCircle2 size={20} className="text-brand-green" />,
  error: <XCircle size={20} className="text-brand-red" />,
  info: <Info size={20} className="text-brand-cyan" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed top-4 right-4 left-4 z-[100] flex flex-col items-center gap-2 md:items-end">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="glass-strong pointer-events-auto flex w-full max-w-sm animate-pop cursor-pointer items-start gap-3 rounded-2xl p-4 text-left"
        >
          {ICONS[t.tone]}
          <span>
            <span className="block font-bold">{t.title}</span>
            {t.description && <span className="block text-sm text-white/70">{t.description}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
