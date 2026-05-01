import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  CalendarDays,
  Clock,
  Hash,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Sprout,
  Layers,
} from "lucide-react";
import {
  useAdminFarmPlotDetail,
  usePlotZones,
  useDeleteFarmPlot,
  useDeleteFarmZone,
} from "./farm.queries";
import { useProvinces } from "./useProvinces";
import { ROUTES } from "../../../lib/routes";
import { AdminDetailButton } from "../../../components/admin/AdminDetailButton";
import type { FarmPlotStatus, FarmZoneStatus, FarmZoneDto } from "../types";

// ---- Helpers ---------------------------------------------------------------

function StatusBadge({ status }: { status: FarmPlotStatus | FarmZoneStatus }) {
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

// ---- Zone card inside plot detail -----------------------------------------

function ZoneCard({ zone }: { zone: FarmZoneDto }) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteFarmZone();
  const isPending =
    deleteMutation.isPending && deleteMutation.variables === zone.id;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-emerald-50 shrink-0 flex items-center justify-center text-emerald-600">
        <Layers className="w-5 h-5" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {zone.zoneName}
          {zone.zoneCode && (
            <span className="ml-2 text-xs text-slate-400 font-mono">
              {zone.zoneCode}
            </span>
          )}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">
          {zone.cropType ?? "—"} · {zone.soilType ?? "—"} ·{" "}
          {formatArea(zone.areaM2)}
        </p>
      </div>

      <StatusBadge status={zone.status} />

      <div className="flex items-center gap-1.5 shrink-0">
        <AdminDetailButton
          onClick={() => navigate(ROUTES.ADMIN.FARM_ZONE_DETAIL(zone.id))}
        />
        <button
          onClick={() => deleteMutation.mutate(zone.id)}
          disabled={isPending}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Xóa zone"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
          ) : (
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}

// ---- Main component --------------------------------------------------------

export function FarmPlotDetailPage() {
  const { plotId = "" } = useParams<{ plotId: string }>();
  const navigate = useNavigate();
  const { provinceMap } = useProvinces();

  const { data: plot, isLoading, isError } = useAdminFarmPlotDetail(plotId);
  const { data: zones, isLoading: zonesLoading } = usePlotZones(plotId);
  const deleteMutation = useDeleteFarmPlot();

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Error / not found
  if (isError || !plot) {
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
          <p className="text-base font-medium">Không tìm thấy nông trại</p>
        </div>
      </div>
    );
  }

  const provinceName = provinceMap.get(plot.provinceCode ?? "");

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(ROUTES.ADMIN.FARMS)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách nông trại
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 shrink-0 flex items-center justify-center text-emerald-600 ring-4 ring-emerald-100/50">
            <Sprout className="w-8 h-8" strokeWidth={1.5} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800">{plot.name}</h1>
              <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                {plot.code}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              {plot.addressLine ?? "Chưa có địa chỉ"}
              {provinceName && <span> · {provinceName}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={plot.status} />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                <Ruler className="w-3 h-3" />
                {formatArea(plot.areaM2)}
              </span>
              {zones && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <Layers className="w-3 h-3" />
                  {zones.length} khu vực
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0">
            <button
              onClick={() => {
                deleteMutation.mutate(plot.id, {
                  onSuccess: () => navigate(ROUTES.ADMIN.FARMS),
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
              Xóa nông trại
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
            value={plot.description || "Chưa có mô tả"}
          />
          <InfoRow
            icon={<Ruler className="w-4 h-4" />}
            label="Diện tích"
            value={formatArea(plot.areaM2)}
          />
          <InfoRow
            icon={<Hash className="w-4 h-4" />}
            label="Mã nông trại"
            value={
              <span className="font-mono text-xs text-slate-500">
                {plot.code}
              </span>
            }
          />
          <InfoRow
            icon={<Hash className="w-4 h-4" />}
            label="ID"
            value={
              <span className="font-mono text-xs text-slate-500">
                {plot.id}
              </span>
            }
          />
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Vị trí
          </h2>
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Địa chỉ"
            value={plot.addressLine}
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Tỉnh/Thành phố"
            value={provinceName ?? plot.provinceCode ?? "—"}
          />
          {plot.latitude != null && plot.longitude != null && (
            <InfoRow
              icon={<MapPin className="w-4 h-4" />}
              label="Tọa độ"
              value={`${plot.latitude}, ${plot.longitude}`}
            />
          )}
        </div>

        {/* Timestamps */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Thời gian
          </h2>
          <InfoRow
            icon={<CalendarDays className="w-4 h-4" />}
            label="Ngày tạo"
            value={formatDate(plot.createdAt)}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Cập nhật lần cuối"
            value={formatDate(plot.lastModifiedAt)}
          />
        </div>

        {/* Owner */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Chủ sở hữu
          </h2>
          <InfoRow
            icon={<Hash className="w-4 h-4" />}
            label="Profile ID"
            value={
              <span className="font-mono text-xs text-slate-500">
                {plot.ownerProfileId}
              </span>
            }
          />
        </div>
      </div>

      {/* Zones section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
          Khu vực canh tác ({zones?.length ?? 0})
        </h2>

        {zonesLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải khu vực...
          </div>
        )}

        {!zonesLoading && (!zones || zones.length === 0) && (
          <p className="text-sm text-slate-400 italic py-2">
            Nông trại này chưa có khu vực nào
          </p>
        )}

        {!zonesLoading && zones && zones.length > 0 && (
          <div className="space-y-3">
            {zones.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
