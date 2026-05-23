import { useState, useMemo } from "react";
import { Search, TreePine, List } from "lucide-react";
import { ModalShell } from "../../../../components/ui/ModalShell";
import type { FarmPlotResponse } from "../../../farm-management/types";

interface FarmPlotSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlotId: string;
  onSelect: (plotId: string) => void;
  plots: FarmPlotResponse[];
  isLoading?: boolean;
}

function FarmPlotCard({
  plot,
  isSelected,
  onClick,
}: {
  plot: FarmPlotResponse;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isSelected
          ? "border-[#245A34] bg-emerald-50/30 ring-2 ring-[#245A34]/20"
          : "border-slate-100 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${isSelected ? "bg-[#245A34]/10" : "bg-slate-100"}`}>
            <TreePine className={`h-3.5 w-3.5 ${isSelected ? "text-[#245A34]" : "text-slate-400"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#245A34]">
              {plot.code || "—"}
            </p>
            <p className="mt-1 text-sm font-black text-slate-900 truncate">
              {plot.name || "—"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500 truncate">
              {plot.addressLine || "—"}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {isSelected && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#245A34]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#245A34]" />
              Đã chọn
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function FarmPlotSelectModal({
  isOpen,
  onClose,
  selectedPlotId,
  onSelect,
  plots,
  isLoading,
}: FarmPlotSelectModalProps) {
  const [search, setSearch] = useState("");

  const filteredPlots = useMemo(() => {
    if (!search.trim()) return plots;
    const q = search.toLowerCase();
    return plots.filter(
      (p) =>
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.code ?? "").toLowerCase().includes(q) ||
        (p.addressLine ?? "").toLowerCase().includes(q),
    );
  }, [plots, search]);

  if (!isOpen) return null;

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  return (
    <ModalShell
      onClose={onClose}
      icon={<TreePine className="h-5 w-5 text-[#245A34]" />}
      title="Chọn vườn"
      subtitle={
        selectedPlot ? (
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">
            Đã chọn: <span className="font-normal text-slate-500">{selectedPlot.name || "—"}</span>
          </p>
        ) : undefined
      }
      maxWidth="sm:max-w-3xl"
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { onSelect(""); onClose(); }}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Bỏ chọn
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#245A34] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1e4a2c] transition-colors"
          >
            Xong
          </button>
        </div>
      }
    >
      {/* Search */}
      <div className="px-6 py-3 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã vườn, địa chỉ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-[#245A34] focus:outline-none focus:ring-1 focus:ring-[#245A34]"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-6 py-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#245A34] border-t-transparent" />
            <p className="text-sm font-semibold text-slate-400">Đang tải vườn...</p>
          </div>
        ) : filteredPlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <TreePine className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-semibold text-slate-400">
              {search ? "Không tìm thấy vườn phù hợp" : "Chưa có vườn nào"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* All option */}
            <button
              type="button"
              onClick={() => { onSelect(""); onClose(); }}
              className={`w-full text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                !selectedPlotId
                  ? "border-[#245A34] bg-emerald-50/30 ring-2 ring-[#245A34]/20"
                  : "border-slate-100 bg-white shadow-sm hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`shrink-0 rounded-full p-2 ${!selectedPlotId ? "bg-[#245A34]/10" : "bg-slate-100"}`}>
                  <List className={`h-4 w-4 ${!selectedPlotId ? "text-[#245A34]" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Tất cả vườn</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {search ? `${filteredPlots.length} phù hợp` : `${plots.length} vườn`}
                  </p>
                </div>
              </div>
            </button>
            {filteredPlots.map((plot) => (
              <FarmPlotCard
                key={plot.id}
                plot={plot}
                isSelected={plot.id === selectedPlotId}
                onClick={() => { onSelect(plot.id); onClose(); }}
              />
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
