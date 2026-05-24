import { Leaf, LayoutGrid, Search, TreePine } from "lucide-react";
import { Layers } from "lucide-react";
import type { ScopeSelectorProps } from "../schemas/apply-dialog.schema";

interface ScopeSelectorOwnProps extends ScopeSelectorProps {
  onOpenPlotModal: () => void;
  onOpenZoneModal: () => void;
  onOpenPlantModal: () => void;
}

export function ScopeSelector({
  farmPlotId,
  farmZoneId,
  plantId,
  onOpenPlotModal,
  onOpenZoneModal,
  onOpenPlantModal,
  plotName,
  zoneName,
  plantLabel,
}: ScopeSelectorOwnProps) {
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-1.5 text-sm font-black text-slate-700">
        <Layers className="h-4 w-4 text-slate-400" />
        Phạm vi áp dụng
        <span className="text-xs font-semibold text-slate-400">(chọn ít nhất một)</span>
      </p>
      <div className="space-y-3">
        {/* Plot selector */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
            <TreePine className="h-3 w-3" />
            Vườn
          </label>
          <button
            type="button"
            onClick={onOpenPlotModal}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
          >
            <span className={farmPlotId ? "text-slate-900" : "text-slate-400"}>
              {plotName || "Chọn vườn..."}
            </span>
            <Search className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Zone selector - only show when plot is selected */}
        {farmPlotId && (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <LayoutGrid className="h-3 w-3" />
              Khu vực
            </label>
            <button
              type="button"
              onClick={onOpenZoneModal}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
            >
              <span className={farmZoneId ? "text-slate-900" : "text-slate-400"}>
                {zoneName || "Chọn khu vực..."}
              </span>
              <Search className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* Plant selector - only show when plot is selected */}
        {farmPlotId && (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <Leaf className="h-3 w-3" />
              Cây cụ thể
            </label>
            <button
              type="button"
              onClick={onOpenPlantModal}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
            >
              <span className={plantId ? "text-slate-900" : "text-slate-400"}>
                {plantLabel || "Chọn cây..."}
              </span>
              <Search className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
