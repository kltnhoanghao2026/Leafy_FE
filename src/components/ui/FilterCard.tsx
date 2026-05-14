import { LayoutGrid, List } from "lucide-react";
import type { ReactNode } from "react";

interface FilterCardProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  children: ReactNode;
}

export function FilterCard({ viewMode, onViewModeChange, children }: FilterCardProps) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black text-slate-900">Bộ lọc</p>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`rounded-lg p-1.5 transition ${viewMode === "grid" ? "bg-white shadow text-[#245A34]" : "text-slate-400 hover:text-slate-600"}`}
            title="Dạng lưới"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`rounded-lg p-1.5 transition ${viewMode === "list" ? "bg-white shadow text-[#245A34]" : "text-slate-400 hover:text-slate-600"}`}
            title="Dạng danh sách"
          >
            <List className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
