import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sprout,
  AlertCircle,
  Loader2,
  Tag,
  CalendarDays,
  Wheat,
  MapPin,
} from "lucide-react";
import { usePlant } from "../api/";

// ---- Helpers ---------------------------------------------------------------

function formatDate(iso: string | null | undefined) {
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

const PLANT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang trồng",
  INACTIVE: "Không hoạt động",
  ARCHIVED: "Đã lưu trữ",
};

const PLANT_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 ring-green-200",
  INACTIVE: "bg-slate-100 text-slate-500 ring-slate-200",
  ARCHIVED: "bg-amber-50 text-amber-700 ring-amber-200",
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <div className="text-sm text-slate-800 font-medium wrap-break-word">
          {value}
        </div>
      </div>
    </div>
  );
}

// ---- Page ------------------------------------------------------------------

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plant, isLoading, isError } = usePlant(id ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Đang tải...</span>
      </div>
    );
  }

  if (isError || !plant) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-medium">Không tìm thấy cây trồng</p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-emerald-600 hover:underline font-semibold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const statusStyle =
    PLANT_STATUS_STYLES[plant.plantStatus] ??
    "bg-slate-100 text-slate-500 ring-slate-200";

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-50">
            <Sprout className="w-5 h-5 text-sky-600" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">
              {plant.nickName ?? plant.plantNumber}
            </h1>
            <p className="text-xs text-slate-400 font-mono">ID: {plant.id}</p>
          </div>
        </div>
        <span
          className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${statusStyle}`}
        >
          {PLANT_STATUS_LABELS[plant.plantStatus] ?? plant.plantStatus}
        </span>
      </div>

      {/* 2-column detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Identification */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Nhận dạng
          </h2>
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Mã cây"
            value={<span className="font-mono">{plant.plantNumber}</span>}
          />
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Tên thân thiện"
            value={plant.nickName ?? "—"}
          />
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Mã tag"
            value={plant.tagCode ?? "—"}
          />
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Số lô"
            value={plant.batchNumber ?? "—"}
          />
        </div>

        {/* Associations */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Liên kết
          </h2>
          <InfoRow
            icon={<Sprout className="w-3.5 h-3.5 text-slate-400" />}
            label="Loài cây (ID)"
            value={plant.speciesId ?? "—"}
          />
          <InfoRow
            icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
            label="Farm Plot (ID)"
            value={plant.farmPlotId ?? "—"}
          />
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Nguồn gốc"
            value={plant.sourceType ?? "—"}
          />
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Cây mẹ (ID)"
            value={plant.motherPlantId ?? "—"}
          />
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Ngày tháng
          </h2>
          <InfoRow
            icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
            label="Ngày trồng"
            value={formatDate(plant.plantingDate)}
          />
          <InfoRow
            icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
            label="Ngày nảy mầm"
            value={formatDate(plant.germinationDate)}
          />
          <InfoRow
            icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
            label="Ngày thu hoạch thực tế"
            value={formatDate(plant.actualHarvestDate)}
          />
        </div>

        {/* Yield */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Sản lượng
          </h2>
          <InfoRow
            icon={<Wheat className="w-3.5 h-3.5 text-slate-400" />}
            label="Sản lượng (kg)"
            value={
              plant.totalYieldKg != null ? `${plant.totalYieldKg} kg` : "—"
            }
          />
        </div>
      </div>
    </div>
  );
}
