import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  Layers,
  Sprout,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ROUTES } from "../../../../lib/routes";
import { useMyProfile } from "../../../settings/queries";
import {
  useFarmPlots,
  useFarmZones,
} from "../../../farm-management/queries";
import { usePlants } from "../..";

function formatArea(val: number | null) {
  if (val == null) return "—";
  return `${val.toLocaleString("vi-VN")} m²`;
}

export function FarmPlotDetailPage() {
  const { farmPlotId = "" } = useParams<{ farmPlotId: string }>();

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";

  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const plot = plotsQuery.data?.find((p) => p.id === farmPlotId);

  const zonesQuery = useFarmZones(farmPlotId, Boolean(farmPlotId));
  const plantsQuery = usePlants({ farmPlotId, size: 100 });
  const plants = plantsQuery.data?.content ?? [];

  if (plotsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!plot) {
    return (
      <div className="space-y-6">
        <Link
          to={ROUTES.DASHBOARD.PLANTS}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <AlertCircle className="w-10 h-10" />
          <p className="text-base font-medium">Không tìm thấy vườn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to={ROUTES.DASHBOARD.PLANTS}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách cây
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 shrink-0 flex items-center justify-center text-emerald-600 ring-4 ring-emerald-100/50">
            <Sprout className="w-8 h-8" strokeWidth={1.5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800">{plot.name}</h1>
              {plot.code && (
                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  {plot.code}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-3">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              {plot.addressLine ?? "Chưa có địa chỉ"}
            </p>
            <div className="flex flex-wrap gap-2">
              {plot.areaM2 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                  <Ruler className="w-3 h-3" />
                  {formatArea(plot.areaM2)}
                </span>
              )}
              {zonesQuery.data && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <Layers className="w-3 h-3" />
                  {zonesQuery.data.length} khu vực
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                <Sprout className="w-3 h-3" />
                {plants.length} cây
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Zones section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
          Khu vực canh tác ({zonesQuery.data?.length ?? 0})
        </h2>

        {zonesQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải khu vực...
          </div>
        )}

        {!zonesQuery.isLoading && (!zonesQuery.data || zonesQuery.data.length === 0) && (
          <p className="text-sm text-slate-400 italic py-2">
            Vườn này chưa có khu vực nào
          </p>
        )}

        {!zonesQuery.isLoading && zonesQuery.data && zonesQuery.data.length > 0 && (
          <div className="space-y-3">
            {zonesQuery.data.map((zone) => (
              <Link
                key={zone.id}
                to={ROUTES.DASHBOARD.FARM_ZONE_DETAIL(farmPlotId, zone.id)}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
              >
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
                <span className="text-slate-400 text-sm">Xem chi tiết →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Plants section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
          Cây trồng ({plants.length})
        </h2>

        {plantsQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải cây trồng...
          </div>
        )}

        {!plantsQuery.isLoading && plants.length === 0 && (
          <p className="text-sm text-slate-400 italic py-2">
            Vườn này chưa có cây trồng nào
          </p>
        )}

        {!plantsQuery.isLoading && plants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plants.slice(0, 12).map((plant) => (
              <Link
                key={plant.id}
                to={ROUTES.DASHBOARD.PLANT_DETAIL(plant.id)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 shrink-0 flex items-center justify-center text-emerald-600">
                  <Sprout className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {plant.nickName || plant.plantNumber || plant.tagCode || plant.id.slice(0, 8)}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {plant.plantStatus}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {plants.length > 12 && (
          <div className="mt-4 text-center">
            <Link
              to={ROUTES.DASHBOARD.PLANTS}
              className="text-sm font-semibold text-[#245A34] hover:underline"
            >
              Xem tất cả {plants.length} cây →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
