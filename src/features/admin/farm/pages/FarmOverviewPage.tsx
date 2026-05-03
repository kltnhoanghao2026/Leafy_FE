import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  Search,
  MapPin,
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  Ruler,
  Filter,
  Grid3X3,
} from "lucide-react";
import { AdminDetailButton } from "../../../../components/admin/AdminDetailButton";
import { AdminTable } from "../../../../components/admin/AdminTable";
import { AdminPagination } from "../../../../components/admin/AdminPagination";
import {
  useAdminFarmPlots,
  useAdminFarmZones,
  useDeleteFarmPlot,
  useDeleteFarmZone,
  usePlotZones,
} from "../api/";
import { useProvinces } from "../hooks/useProvinces";
import { ROUTES } from "../../../../lib/routes";
import type {
  FarmPlotDto,
  FarmZoneDto,
  FarmPlotStatus,
  FarmZoneStatus,
} from "../../types";

type Tab = "plots" | "zones";
const PAGE_SIZE = 20;

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "plots", label: "Nông trại", icon: <Sprout className="w-4 h-4" /> },
  { id: "zones", label: "Khu vực", icon: <Grid3X3 className="w-4 h-4" /> },
];

// ---- Helpers --------------------------------------------------------------

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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${c.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function formatDate(iso: string) {
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

function formatArea(val: number | null) {
  if (val == null) return "—";
  return `${val.toLocaleString("vi-VN")} m²`;
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_120px_110px_100px_80px] gap-4 items-center px-4 py-3 animate-pulse border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-200 rounded w-44" />
          <div className="h-2.5 bg-slate-100 rounded w-28" />
        </div>
      </div>
      <div className="h-5 bg-slate-100 rounded-full w-20" />
      <div className="h-5 bg-slate-100 rounded-full w-20" />
      <div className="h-5 bg-slate-100 rounded w-16" />
      <div className="h-7 bg-slate-100 rounded-lg w-8" />
    </div>
  );
}

function useDebounce(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value.trim()), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);
  return debounced;
}



// ---- Zone rows (lazy-loaded per plot) ------------------------------------

function PlotZones({ plotId }: { plotId: string }) {
  const { data: zones, isLoading } = usePlotZones(plotId);

  if (isLoading) {
    return (
      <div className="px-6 pl-14 py-3 text-xs text-slate-400 bg-slate-50/40 border-b border-slate-50 animate-pulse">
        Đang tải zones...
      </div>
    );
  }

  if (!zones || zones.length === 0) {
    return (
      <div className="px-6 pl-14 py-3 text-xs text-slate-400 bg-slate-50/40 border-b border-slate-50">
        Nông trại này chưa có zone nào
      </div>
    );
  }

  return (
    <div>
      {zones.map((zone) => (
        <InlineZoneRow key={zone.id} zone={zone} />
      ))}
    </div>
  );
}

function InlineZoneRow({ zone }: { zone: FarmZoneDto }) {
  const deleteMutation = useDeleteFarmZone();
  const isPending =
    deleteMutation.isPending && deleteMutation.variables === zone.id;

  return (
    <div className="grid grid-cols-[1fr_120px_110px_100px_80px] gap-4 items-center px-6 pl-14 py-3 border-b border-slate-50 last:border-0 bg-slate-50/40">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {zone.zoneName}
          {zone.zoneCode && (
            <span className="ml-2 text-xs text-slate-400 font-mono">
              {zone.zoneCode}
            </span>
          )}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {zone.cropType ?? "—"} · {zone.soilType ?? "—"}
        </p>
      </div>
      <div>
        <StatusBadge status={zone.status} />
      </div>
      <div className="text-xs text-slate-500">{formatArea(zone.areaM2)}</div>
      <div className="text-xs text-slate-400">{formatDate(zone.createdAt)}</div>
      <div className="flex justify-end">
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

// ---- Plot row -------------------------------------------------------------

function PlotRow({
  plot,
  provinceName,
}: {
  plot: FarmPlotDto;
  provinceName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const deleteMutation = useDeleteFarmPlot();
  const isPending =
    deleteMutation.isPending && deleteMutation.variables === plot.id;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="grid grid-cols-[1fr_120px_110px_100px_110px] gap-4 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-9 h-9 rounded-lg bg-emerald-50 shrink-0 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
            )}
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {plot.name}
              <span className="ml-2 text-xs text-slate-400 font-mono">
                {plot.code}
              </span>
            </p>
            <p className="text-xs text-slate-400 truncate">
              <MapPin className="w-3 h-3 inline mr-0.5" />
              {plot.addressLine ?? "Chưa có địa chỉ"}
              {provinceName && (
                <span className="ml-1.5 text-slate-400">· {provinceName}</span>
              )}
            </p>
          </div>
        </div>
        <div>
          <StatusBadge status={plot.status} />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Ruler className="w-3 h-3" />
          {formatArea(plot.areaM2)}
        </div>
        <div className="text-xs text-slate-400">
          {formatDate(plot.createdAt)}
        </div>
        <div className="flex justify-end gap-1">
          <AdminDetailButton
            onClick={() => navigate(ROUTES.ADMIN.FARM_DETAIL(plot.id))}
            label={null}
          />
          <button
            onClick={() => deleteMutation.mutate(plot.id)}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Xóa nông trại"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
            ) : (
              <Trash2 className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
      {expanded && <PlotZones plotId={plot.id} />}
    </div>
  );
}

// ---- Standalone Zone row (for Zones tab) ----------------------------------

function ZoneRow({ zone }: { zone: FarmZoneDto }) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteFarmZone();
  const isPending =
    deleteMutation.isPending && deleteMutation.variables === zone.id;

  return (
    <div className="grid grid-cols-[1fr_100px_100px_120px_110px_100px_110px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {zone.zoneName}
          {zone.zoneCode && (
            <span className="ml-2 text-xs text-slate-400 font-mono">
              {zone.zoneCode}
            </span>
          )}
        </p>
        {zone.description && (
          <p className="text-xs text-slate-400 truncate">{zone.description}</p>
        )}
      </div>
      <div className="text-xs text-slate-500 truncate">
        {zone.cropType ?? "—"}
      </div>
      <div className="text-xs text-slate-500 truncate">
        {zone.soilType ?? "—"}
      </div>
      <div>
        <StatusBadge status={zone.status} />
      </div>
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <Ruler className="w-3 h-3" />
        {formatArea(zone.areaM2)}
      </div>
      <div className="text-xs text-slate-400">{formatDate(zone.createdAt)}</div>
      <div className="flex justify-end gap-1">
        <AdminDetailButton
          onClick={() => navigate(ROUTES.ADMIN.FARM_ZONE_DETAIL(zone.id))}
          label={null}
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

// ---- Plots Tab ------------------------------------------------------------

function PlotsTab() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);
  const [statusFilter, setStatusFilter] = useState<FarmPlotStatus | "">("");
  const [provinceCode, setProvinceCode] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const debouncedMinArea = useDebounce(minArea);
  const debouncedMaxArea = useDebounce(maxArea);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const { provinces, provinceMap } = useProvinces();
  useEffect(() => {
    setPage(0);
  }, [statusFilter, provinceCode]);
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, debouncedMinArea, debouncedMaxArea]);

  const { data, isLoading, isError, error } = useAdminFarmPlots({
    page,
    size: pageSize,
    searchTerm: debouncedSearch || undefined,
    status: statusFilter || undefined,
    provinceCode: provinceCode || undefined,
    minAreaM2: debouncedMinArea ? Number(debouncedMinArea) : undefined,
    maxAreaM2: debouncedMaxArea ? Number(debouncedMaxArea) : undefined,
  });

  const plots = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <>
      {/* Search + Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              strokeWidth={2.5}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm theo tên, mã hoặc địa chỉ..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2}
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as FarmPlotStatus | "")
              }
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow appearance-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
          </div>

          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2}
            />
            <select
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow appearance-none cursor-pointer max-w-52"
            >
              <option value="">Tất cả tỉnh/thành</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Ruler
              className="w-4 h-4 text-slate-400 shrink-0"
              strokeWidth={2}
            />
            <input
              type="number"
              min={0}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              placeholder="Min m²"
              className="w-24 px-2.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="number"
              min={0}
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              placeholder="Max m²"
              className="w-24 px-2.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
          </div>

          {!isLoading && (
            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {totalElements} nông trại
            </span>
          )}
        </div>
      </div>

      {/* Pagination — top */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="nông trại"
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />

      {/* Table */}
      <AdminTable
        gridCols="grid-cols-[1fr_120px_110px_100px_110px]"
        columns={[
          { label: "Nông trại" },
          { label: "Trạng thái" },
          { label: "Diện tích" },
          { label: "Ngày tạo" },
          { label: "Thao tác", align: "right" },
        ]}
        isLoading={isLoading}
        isError={isError}
        errorMessage={`Không thể tải danh sách nông trại${
          (error as Error)?.message ? `: ${(error as Error).message}` : ""
        }`}
        isEmpty={plots.length === 0}
        emptyMessage={
          debouncedSearch || statusFilter || provinceCode || minArea || maxArea
            ? "Không tìm thấy nông trại phù hợp với bộ lọc"
            : "Chưa có dữ liệu nông trại"
        }
        emptyIcon={<Sprout className="w-8 h-8" strokeWidth={1.5} />}
        renderSkeleton={() => <SkeletonRow />}
      >
        {plots.map((plot) => (
          <PlotRow
            key={plot.id}
            plot={plot}
            provinceName={provinceMap.get(plot.provinceCode ?? "")}
          />
        ))}
      </AdminTable>
    </>
  );
}

// ---- Zones Tab ------------------------------------------------------------

function ZonesTab() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);
  const [statusFilter, setStatusFilter] = useState<FarmZoneStatus | "">("");
  const [cropType, setCropType] = useState("");
  const [soilType, setSoilType] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const debouncedMinArea = useDebounce(minArea);
  const debouncedMaxArea = useDebounce(maxArea);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, cropType, soilType]);
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, debouncedMinArea, debouncedMaxArea]);

  const { data, isLoading, isError, error } = useAdminFarmZones({
    page,
    size: pageSize,
    searchTerm: debouncedSearch || undefined,
    status: statusFilter || undefined,
    cropType: cropType || undefined,
    soilType: soilType || undefined,
    minAreaM2: debouncedMinArea ? Number(debouncedMinArea) : undefined,
    maxAreaM2: debouncedMaxArea ? Number(debouncedMaxArea) : undefined,
  });

  const zones = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <>
      {/* Search + Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              strokeWidth={2.5}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc mã zone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2}
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as FarmZoneStatus | "")
              }
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow appearance-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
          </div>

          <div className="relative">
            <Sprout
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2}
            />
            <input
              type="text"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              placeholder="Loại cây trồng..."
              className="pl-9 pr-4 py-2.5 w-40 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
          </div>

          <div className="relative">
            <Layers
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              strokeWidth={2}
            />
            <input
              type="text"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              placeholder="Loại đất..."
              className="pl-9 pr-4 py-2.5 w-36 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Ruler
              className="w-4 h-4 text-slate-400 shrink-0"
              strokeWidth={2}
            />
            <input
              type="number"
              min={0}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              placeholder="Min m²"
              className="w-24 px-2.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="number"
              min={0}
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              placeholder="Max m²"
              className="w-24 px-2.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
          </div>

          {!isLoading && (
            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {totalElements} khu vực
            </span>
          )}
        </div>
      </div>

      {/* Pagination — top */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="khu vực"
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />

      {/* Table */}
      <AdminTable
        gridCols="grid-cols-[1fr_100px_100px_120px_110px_100px_110px]"
        columns={[
          { label: "Khu vực" },
          { label: "Cây trồng" },
          { label: "Loại đất" },
          { label: "Trạng thái" },
          { label: "Diện tích" },
          { label: "Ngày tạo" },
          { label: "Thao tác", align: "right" },
        ]}
        isLoading={isLoading}
        isError={isError}
        errorMessage={`Không thể tải danh sách khu vực${
          (error as Error)?.message ? `: ${(error as Error).message}` : ""
        }`}
        isEmpty={zones.length === 0}
        emptyMessage={
          debouncedSearch ||
          statusFilter ||
          cropType ||
          soilType ||
          minArea ||
          maxArea
            ? "Không tìm thấy khu vực phù hợp với bộ lọc"
            : "Chưa có dữ liệu khu vực"
        }
        emptyIcon={<Grid3X3 className="w-8 h-8" strokeWidth={1.5} />}
        renderSkeleton={() => <SkeletonRow />}
      >
        {zones.map((zone) => (
          <ZoneRow key={zone.id} zone={zone} />
        ))}
      </AdminTable>
    </>
  );
}

// ---- Main page ------------------------------------------------------------

export function FarmOverviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>("plots");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Tổng quan nông trại
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý nông trại và khu vực canh tác
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors rounded-t-lg border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/60"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "plots" ? <PlotsTab /> : <ZonesTab />}
    </div>
  );
}
