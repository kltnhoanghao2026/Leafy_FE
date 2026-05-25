import { useState, useMemo } from "react";
import { Search, ClipboardCheck, Leaf, LayoutGrid, TreePine, CalendarDays, List } from "lucide-react";
import { ModalShell } from "../../../../components/ui/ModalShell";
import type { PlanApplyResponse, TreatmentStatus } from "../../shared/types";

interface PlanApplySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedApplyId: string;
  onSelect: (applyId: string) => void;
  applies: PlanApplyResponse[];
  applyLabel: (apply: PlanApplyResponse) => string;
}

const STATUS_CONFIG: Record<
  TreatmentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: "Chờ xử lý",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  APPLYING: {
    label: "Đang áp dụng",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  ACTIVE: {
    label: "Đang thực hiện",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  COMPLETED: {
    label: "Hoàn thành",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
  },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function PlanApplyCard({
  apply,
  isSelected,
  onClick,
  applyLabel,
}: {
  apply: PlanApplyResponse;
  isSelected: boolean;
  onClick: () => void;
  applyLabel: (apply: PlanApplyResponse) => string;
}) {
  const cfg = STATUS_CONFIG[apply.status] ?? STATUS_CONFIG.PENDING;

  const scopeLabel = apply.targetName || (apply.plantId
    ? "Cây cụ thể"
    : apply.farmZoneId
      ? "Khu vực"
      : apply.farmPlotId
        ? "Vườn"
        : "Không rõ");

  const ScopeIcon = apply.plantId
    ? Leaf
    : apply.farmZoneId
      ? LayoutGrid
      : TreePine;

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
            <ClipboardCheck className={`h-3.5 w-3.5 ${isSelected ? "text-[#245A34]" : "text-slate-400"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#245A34]">
              {apply.planName || apply.diseaseName || "—"}
            </p>
            <p className="mt-1 text-sm font-black text-slate-900 truncate">
              {applyLabel(apply)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500 truncate">
              {scopeLabel}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.label}
          </span>
          {isSelected && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#245A34]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#245A34]" />
              Đã chọn
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {apply.startDate && (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Bắt đầu</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-700">
              <CalendarDays className="h-3 w-3 text-slate-400" />
              {formatDate(apply.startDate)}
            </p>
          </div>
        )}
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Phạm vi</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-700">
            <ScopeIcon className="h-3 w-3 text-slate-400" />
            {scopeLabel}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 col-span-2">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Sự kiện</p>
          <p className="mt-0.5 text-xs font-bold text-slate-700">
            {apply.plantEventIds?.length ?? 0} sự kiện
            {apply.trackingGranularity && (
              <span className="ml-2 text-slate-400 font-normal">
                · {apply.trackingGranularity === "PLANT" ? "Theo cây" : apply.trackingGranularity === "ZONE" ? "Theo khu vực" : "Không theo dõi"}
              </span>
            )}
          </p>
        </div>
      </div>
    </button>
  );
}

export function PlanApplySelectModal({
  isOpen,
  onClose,
  selectedApplyId,
  onSelect,
  applies,
  applyLabel,
}: PlanApplySelectModalProps) {
  const [search, setSearch] = useState("");

  const filteredApplies = useMemo(() => {
    if (!search.trim()) return applies;
    const q = search.toLowerCase();
    return applies.filter(
      (a) =>
        (applyLabel(a) ?? "").toLowerCase().includes(q) ||
        (a.planName ?? "").toLowerCase().includes(q) ||
        (a.diseaseName ?? "").toLowerCase().includes(q) ||
        (a.targetName ?? "").toLowerCase().includes(q),
    );
  }, [applies, search, applyLabel]);

  if (!isOpen) return null;

  const selectedApply = applies.find((a) => a.id === selectedApplyId);

  return (
    <ModalShell
      onClose={onClose}
      icon={<ClipboardCheck className="h-5 w-5 text-[#245A34]" />}
      title="Chọn áp dụng kế hoạch"
      subtitle={
        selectedApply ? (
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">
            Đã chọn: <span className="font-normal text-slate-500">{applyLabel(selectedApply)}</span>
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
            placeholder="Tìm kiếm theo tên kế hoạch, bệnh, phạm vi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-[#245A34] focus:outline-none focus:ring-1 focus:ring-[#245A34]"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-6 py-3">
        {filteredApplies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <ClipboardCheck className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-semibold text-slate-400">
              {search ? "Không tìm thấy áp dụng phù hợp" : "Chưa có áp dụng kế hoạch nào"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* All option */}
            <button
              type="button"
              onClick={() => { onSelect(""); onClose(); }}
              className={`w-full text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                !selectedApplyId
                  ? "border-[#245A34] bg-emerald-50/30 ring-2 ring-[#245A34]/20"
                  : "border-slate-100 bg-white shadow-sm hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`shrink-0 rounded-full p-2 ${!selectedApplyId ? "bg-[#245A34]/10" : "bg-slate-100"}`}>
                  <List className={`h-4 w-4 ${!selectedApplyId ? "text-[#245A34]" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Tất cả áp dụng</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {search ? `${filteredApplies.length} phù hợp` : `${applies.length} kế hoạch`}
                  </p>
                </div>
              </div>
            </button>
            {filteredApplies.map((apply) => (
              <PlanApplyCard
                key={apply.id}
                apply={apply}
                isSelected={apply.id === selectedApplyId}
                onClick={() => { onSelect(apply.id); onClose(); }}
                applyLabel={applyLabel}
              />
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
