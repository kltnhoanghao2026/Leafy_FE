import { ChevronDown } from "lucide-react";
import { LayoutGrid, Leaf, MinusCircle, TreePine } from "lucide-react";
import type { ExcludeSectionProps } from "../schemas/apply-dialog.schema";

interface ExcludeSectionOwnProps extends ExcludeSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  totalExcluded: number;
}

export function ExcludeSection({
  zones,
  plants,
  excludedZoneIds,
  excludedPlantIds,
  onToggleZone,
  onTogglePlant,
  onClearZones,
  onClearPlants,
  showZones,
  showPlants,
  zoneSubtitle,
  isOpen,
  onToggle,
  totalExcluded,
}: ExcludeSectionOwnProps) {
  const hasZones = showZones && zones.length > 0;
  const hasPlants = showPlants && plants.length > 0;

  if (!hasZones && !hasPlants) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <MinusCircle className="h-4 w-4 text-rose-400" />
          Loại trừ
          {totalExcluded > 0 ? (
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-600">
              {totalExcluded}
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">tùy chọn</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3">

          {/* Zone exclusions */}
          {hasZones && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <LayoutGrid className="h-3 w-3" />
                  Bỏ qua khu vực
                </p>
                {excludedZoneIds.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearZones}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>
              <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-0.5">
                {zones.map((z) => {
                  const excluded = excludedZoneIds.includes(z.id);
                  return (
                    <label
                      key={z.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2 transition-all ${
                        excluded ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={excluded}
                        onChange={() => onToggleZone(z.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-rose-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <LayoutGrid className={`h-3.5 w-3.5 shrink-0 ${excluded ? "text-rose-400" : "text-slate-300"}`} />
                          <span className={`truncate text-sm font-semibold ${excluded ? "text-rose-700 line-through" : "text-slate-700"}`}>
                            {z.zoneName}
                          </span>
                          {excluded && (
                            <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-500">loại trừ</span>
                          )}
                        </div>
                        {zoneSubtitle && (
                          <p className={`mt-0.5 truncate text-[10px] font-medium ${excluded ? "text-rose-400" : "text-slate-400"}`}>
                            <TreePine className="mr-0.5 inline h-2.5 w-2.5" />
                            {zoneSubtitle}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plant exclusions */}
          {hasPlants && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <Leaf className="h-3 w-3" />
                  Bỏ qua cây
                </p>
                {excludedPlantIds.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearPlants}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>
              <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-0.5">
                {plants.map((pl) => {
                  const excluded = excludedPlantIds.includes(pl.id);
                  return (
                    <label
                      key={pl.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2 transition-all ${
                        excluded ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={excluded}
                        onChange={() => onTogglePlant(pl.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-rose-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Leaf className={`h-3.5 w-3.5 shrink-0 ${excluded ? "text-rose-400" : "text-slate-300"}`} />
                          <span className={`truncate text-sm font-semibold ${excluded ? "text-rose-700 line-through" : "text-slate-700"}`}>
                            {pl.nickName ?? pl.plantNumber ?? pl.id}
                          </span>
                          {excluded && (
                            <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-500">loại trừ</span>
                          )}
                        </div>
                        {pl.farmZoneId && (
                          <p className={`mt-0.5 truncate text-[10px] font-medium ${excluded ? "text-rose-400" : "text-slate-400"}`}>
                            <LayoutGrid className="mr-0.5 inline h-2.5 w-2.5" />
                            {pl.farmZoneId}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
