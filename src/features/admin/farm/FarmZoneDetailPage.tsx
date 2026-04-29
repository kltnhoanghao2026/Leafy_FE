import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Ruler,
  CalendarDays,
  Clock,
  Hash,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Layers,
  MapPin,
  Sprout,
  Mountain,
} from "lucide-react";
import {
  useAdminFarmZoneDetail,
  useAdminFarmPlotDetail,
  useDeleteFarmZone,
} from "./farm.queries";
import { ROUTES } from "../../../lib/routes";
import type { FarmZoneStatus } from "../types";

// ---- Helpers ---------------------------------------------------------------

function StatusBadge({ status }: { status: FarmZoneStatus }) {
  const cfg: Record<string, { label: string; cls: string; dot: string }> = {
    ACTIVE: {
      label: "Hoạt động",
      cls: "bg-green-50 text-green-700 ring-green-200",
      dot: "bg-green-500",
    },
    INACTIVE: {
      label: "Tạm dừng",
      cls: "bg-amber-50 text-amber-700 ring-amber-200",
      dot: "bg-amber-500",
    },
    ARCHIVED: {
      label: "Đã lưu trữ",
      cls: "bg-slate-100 text-slate-500 ring-slate-200",
      dot: "bg-slate-400",
    },
  };
  const c = cfg[status] ?? cfg.ACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${c.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

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
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-700 font-medium mt-0.5">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatArea(val: number | null) {
  if (val == null) return "—";
  return `${val.toLocaleString("vi-VN")} m²`;
}

// ---- Main component --------------------------------------------------------

export function FarmZoneDetailPage() {
  const { zoneId = "" } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();

  const { data: zone, isLoading, isError } = useAdminFarmZoneDetail(zoneId);
  const { data: parentPlot } = useAdminFarmPlotDetail(zone?.farmPlotId ?? "");
  const deleteMutation = useDeleteFarmZone();

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Error / not found
  if (isError || !zone) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate(ROUTES.ADMIN.FARMS)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <AlertCircle className="w-10 h-10" />
          <p className="text-base font-medium">Không tìm thấy khu vực</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        {parentPlot ? (
          <button
            onClick={() => navigate(ROUTES.ADMIN.FARM_DETAIL(parentPlot.id))}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại {parentPlot.name}
          </button>
        ) : (
          <button
            onClick={() => navigate(ROUTES.ADMIN.FARMS)}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
        )}
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 shrink-0 flex items-center justify-center text-emerald-600 ring-4 ring-emerald-100/50">
            <Layers className="w-8 h-8" strokeWidth={1.5} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800">
                {zone.zoneName}
              </h1>
              {zone.zoneCode && (
                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  {zone.zoneCode}
                </span>
              )}
            </div>
            {parentPlot && (
              <p className="text-sm text-slate-400 mb-3">
                <Sprout className="w-3.5 h-3.5 inline mr-1" />
                Thuộc nông trại:{" "}
                <button
                  onClick={() =>
                    navigate(ROUTES.ADMIN.FARM_DETAIL(parentPlot.id))
                  }
                  className="text-emerald-600 hover:underline font-medium"
                >
                  {parentPlot.name}
                </button>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={zone.status} />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                <Ruler className="w-3 h-3" />
                {formatArea(zone.areaM2)}
              </span>
              {zone.cropType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <Sprout className="w-3 h-3" />
                  {zone.cropType}
                </span>
              )}
              {zone.soilType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                  <Layers className="w-3 h-3" />
                  {zone.soilType}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0">
            <button
              onClick={() => {
                deleteMutation.mutate(zone.id, {
                  onSuccess: () => {
                    if (parentPlot) {
                      navigate(ROUTES.ADMIN.FARM_DETAIL(parentPlot.id));
                    } else {
                      navigate(ROUTES.ADMIN.FARMS);
                    }
                  },
                });
              }}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
              )}
              Xóa khu vực
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Thông tin chung
          </h2>
          <InfoRow
            icon={<FileText className="w-4 h-4" />}
            label="Mô tả"
            value={zone.description || "Chưa có mô tả"}
          />
          <InfoRow
            icon={<Ruler className="w-4 h-4" />}
            label="Diện tích"
            value={formatArea(zone.areaM2)}
          />
          <InfoRow
            icon={<Hash className="w-4 h-4" />}
            label="Mã khu vực"
            value={
              zone.zoneCode ? (
                <span className="font-mono text-xs text-slate-500">
                  {zone.zoneCode}
                </span>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            icon={<Hash className="w-4 h-4" />}
            label="ID"
            value={
              <span className="font-mono text-xs text-slate-500">
                {zone.id}
              </span>
            }
          />
        </div>

        {/* Farming info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Thông tin canh tác
          </h2>
          <InfoRow
            icon={<Sprout className="w-4 h-4" />}
            label="Loại cây trồng"
            value={zone.cropType}
          />
          <InfoRow
            icon={<Layers className="w-4 h-4" />}
            label="Loại đất"
            value={zone.soilType}
          />
          <InfoRow
            icon={<CalendarDays className="w-4 h-4" />}
            label="Ngày gieo trồng"
            value={
              zone.plantingDate
                ? new Date(zone.plantingDate).toLocaleDateString("vi-VN")
                : null
            }
          />
          <InfoRow
            icon={<Mountain className="w-4 h-4" />}
            label="Độ cao"
            value={zone.elevationM != null ? `${zone.elevationM} m` : null}
          />
        </div>

        {/* Timestamps */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Thời gian
          </h2>
          <InfoRow
            icon={<CalendarDays className="w-4 h-4" />}
            label="Ngày tạo"
            value={formatDate(zone.createdAt)}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Cập nhật lần cuối"
            value={formatDate(zone.lastModifiedAt)}
          />
        </div>

        {/* Parent farm */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Nông trại
          </h2>
          {parentPlot ? (
            <>
              <InfoRow
                icon={<Sprout className="w-4 h-4" />}
                label="Tên nông trại"
                value={
                  <button
                    onClick={() =>
                      navigate(ROUTES.ADMIN.FARM_DETAIL(parentPlot.id))
                    }
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    {parentPlot.name}
                  </button>
                }
              />
              <InfoRow
                icon={<Hash className="w-4 h-4" />}
                label="Mã nông trại"
                value={
                  <span className="font-mono text-xs text-slate-500">
                    {parentPlot.code}
                  </span>
                }
              />
              {parentPlot.addressLine && (
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Địa chỉ"
                  value={parentPlot.addressLine}
                />
              )}
            </>
          ) : (
            <InfoRow
              icon={<Hash className="w-4 h-4" />}
              label="Farm Plot ID"
              value={
                <span className="font-mono text-xs text-slate-500">
                  {zone.farmPlotId}
                </span>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
