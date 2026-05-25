import type { ReactNode } from "react";

interface InfoChipProps {
  icon: ReactNode;
  label: string;
  value: string;
}

export function InfoChip({ icon, label, value }: InfoChipProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 ring-1 ring-slate-100">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <span className="text-[9px] font-black uppercase tracking-wide text-slate-400 leading-none">{label}</span>
        <p className="text-[10px] font-bold text-slate-700 truncate leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}
