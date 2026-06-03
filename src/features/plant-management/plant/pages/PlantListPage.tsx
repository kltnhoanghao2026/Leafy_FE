import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Minus, Search, Sprout, Trash2, X } from "lucide-react";
import { ConfirmDeleteDialog } from '../../../farm-management/components/ConfirmDeleteDialog';
import { useFarmPlots, useFarmZones } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import { PlantCard } from "../components/PlantCard";
import { PlantFormDialog } from "../components/PlantFormDialog";
import { ROUTES } from '../../../../lib/routes';
import { PagedGrid } from '../../../../components/ui/PagedGrid';
import { FilterCard } from '../../../../components/ui/FilterCard';
import {
  useBulkDeletePlants,
  useBulkUpdatePlantStatus,
  useCreatePlant,
  useDeletePlant,
  useMyPlants,
  useSpecies,
  useUpdatePlant,
} from '../..';
import type {
  PlantCreateRequest,
  PlantResponse,
  PlantStatus,
  PlantUpdateRequest,
} from '../../shared/types';
import { PLANT_STATUS_LABELS } from '../../shared/components/displayUtils';
import { Select } from '../../../../components/ui/Select';
import { PageErrorState } from '../../../../components/ui/PageErrorState';

export function PlantListPage() {
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const farmPlotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const farmPlots = useMemo(
    () => farmPlotsQuery.data ?? [],
    [farmPlotsQuery.data],
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [farmPlotFilter, setFarmPlotFilter] = useState("");
  const [farmZoneFilter, setFarmZoneFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlantStatus | "">("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<PlantStatus | "">("");
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [formTarget, setFormTarget] = useState<
    { mode: "create"; plant?: null } | { mode: "edit"; plant: PlantResponse } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<PlantResponse | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Clear selections and reset page when filters change to avoid invisible selections
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedIds(new Set());
      setPage(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [debouncedSearch, farmPlotFilter, farmZoneFilter, speciesFilter, statusFilter]);

  // Server-side filtering via the fixed /plants/me endpoint
  const plantsQuery = useMyPlants({
    search: debouncedSearch || undefined,
    farmPlotId: farmPlotFilter || undefined,
    farmZoneId: farmZoneFilter || undefined,
    speciesId: speciesFilter || undefined,
    status: statusFilter || undefined,
    page,
    size: pageSize,
  });

  const speciesQuery = useSpecies();
  const species = useMemo(() => speciesQuery.data ?? [], [speciesQuery.data]);

  const filteredPlants = useMemo(() => plantsQuery.data?.content ?? [], [plantsQuery.data]);
  const isPlantsLoading = plantsQuery.isLoading;
  const isPlantsError = plantsQuery.isError;
  const refetchPlants = plantsQuery.refetch;
  const totalPages = plantsQuery.data?.totalPages ?? 0;
  const totalElements = plantsQuery.data?.totalElements;

  const createPlant = useCreatePlant();
  const updatePlant = useUpdatePlant();
  const deletePlant = useDeletePlant();
  const bulkUpdateStatus = useBulkUpdatePlantStatus();
  const bulkDeletePlants = useBulkDeletePlants();

  const speciesById = useMemo(
    () => new Map(species.map((item) => [item.id, item])),
    [species],
  );
  const farmPlotById = useMemo(
    () => new Map(farmPlots.map((plot) => [plot.id, plot])),
    [farmPlots],
  );

  // Select options
  const farmPlotOptions = useMemo(() => [
    { value: "", label: "Tất cả vườn" },
    ...farmPlots.map((plot) => ({ value: plot.id, label: plot.name })),
  ], [farmPlots]);

  const statusOptions = useMemo(() => [
    { value: "", label: "Tất cả trạng thái" },
    ...Object.entries(PLANT_STATUS_LABELS).map(([status, label]) => ({
      value: status,
      label,
    })),
  ], []);

  const speciesOptions = useMemo(() => [
    { value: "", label: "Tất cả giống cây" },
    ...species.map((item) => ({
      value: item.id,
      label: [item.commonName, item.cultivarName].filter(Boolean).join(" - "),
    })),
  ], [species]);

  const handleCreatePlant = async (
    payload: PlantCreateRequest | PlantUpdateRequest,
  ) => {
    await createPlant.mutateAsync(payload as PlantCreateRequest);
    setFormTarget(null);
  };

  const handleUpdatePlant = async (
    payload: PlantCreateRequest | PlantUpdateRequest,
  ) => {
    if (!formTarget || formTarget.mode !== "edit") {
      return;
    }

    await updatePlant.mutateAsync({
      plantId: formTarget.plant.id,
      payload: payload as PlantUpdateRequest,
    });
    setFormTarget(null);
  };

  const handleDeletePlant = async () => {
    if (!deleteTarget) {
      return;
    }

    await deletePlant.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ── Bulk helpers ──────────────────────────────────────────────────────────

  const toggleSelect = (plant: PlantResponse) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(plant.id)) {
        next.delete(plant.id);
      } else {
        next.add(plant.id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredPlants.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    await bulkUpdateStatus.mutateAsync({
      plantIds: Array.from(selectedIds),
      status: bulkStatus as PlantStatus,
    });
    clearSelection();
    setBulkStatus("");
  };

  const handleBulkDelete = async () => {
    await bulkDeletePlants.mutateAsync({ plantIds: Array.from(selectedIds) });
    clearSelection();
    setShowBulkDeleteConfirm(false);
  };

  const allSelected = filteredPlants.length > 0 && selectedIds.size === filteredPlants.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            Plant management
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            Quản lý cây trồng
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Theo dõi danh sách cây, giống cây, vườn trồng và mở nhanh lịch chăm
            sóc hoặc kế hoạch điều trị của từng cây.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormTarget({ mode: "create" })}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1b432a]"
        >
          <Sprout className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Thêm cây
        </button>
      </header>

      <FilterCard viewMode={viewMode} onViewModeChange={setViewMode}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex h-9 min-w-45 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
            <input
              id="plant-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên cây, mã cây, tag..."
              className="flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none"
            />
          </div>

          {/* Farm plot */}
          <div className="h-9 min-w-35 flex-1">
            <Select
              value={farmPlotFilter}
              onChange={(val) => {
                setFarmPlotFilter(val as string);
                setFarmZoneFilter("");
              }}
              options={farmPlotOptions}
              placeholder="Tất cả vườn"
            />
          </div>

          {/* Zone – only when plot selected */}
          {farmPlotFilter && (
            <div className="h-9 min-w-35 flex-1">
              <ZoneFilterSelect
                farmPlotId={farmPlotFilter}
                value={farmZoneFilter}
                onChange={setFarmZoneFilter}
              />
            </div>
          )}

          {/* Status */}
          <div className="h-9 min-w-35 flex-1">
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as PlantStatus | "")}
              options={statusOptions}
              placeholder="Tất cả trạng thái"
            />
          </div>

          {/* Species */}
          <div className="h-9 min-w-40 flex-1">
            <Select
              value={speciesFilter}
              onChange={(val) => setSpeciesFilter(val as string)}
              options={speciesOptions}
              placeholder="Tất cả giống cây"
            />
          </div>
        </div>
      </FilterCard>

      {/* Selection info bar */}
      {!isPlantsLoading && filteredPlants.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <span
              role="checkbox"
              aria-checked={allSelected ? true : someSelected ? 'mixed' : false}
              onClick={allSelected ? clearSelection : selectAll}
              className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all
                ${allSelected || someSelected
                  ? 'border-[#245A34] bg-[#245A34]'
                  : 'border-slate-300 bg-white hover:border-[#245A34]'
                }`}
            >
              {allSelected
                ? <Check className="h-3 w-3 text-white" strokeWidth={3} />
                : someSelected
                  ? <Minus className="h-3 w-3 text-white" strokeWidth={3} />
                  : null
              }
            </span>
            <span className="text-sm font-semibold text-slate-600">
              {someSelected
                ? `${selectedIds.size} / ${filteredPlants.length} cây đã chọn`
                : `${filteredPlants.length} cây trồng`
              }
            </span>
            {someSelected && !allSelected && (
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold text-[#245A34] hover:underline"
              >
                Chọn tất cả
              </button>
            )}
          </div>
          {someSelected && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Bỏ chọn
            </button>
          )}
        </div>
      )}

      {/* Bulk action toolbar — slides in when items are selected */}
      {someSelected && (
        <div className="sticky top-4 z-10 rounded-2xl bg-[#245A34] px-4 py-3 shadow-xl shadow-[#245A34]/20">
          <div className="flex flex-wrap items-center gap-3">
            {/* Count */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
              <span className="text-sm font-bold text-white">{selectedIds.size} cây đã chọn</span>
            </div>

            <div className="h-5 w-px bg-white/20" />

            {/* Status chips */}
            <span className="text-xs font-semibold text-white/60">Đổi trạng thái:</span>
            <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
              {(Object.entries(PLANT_STATUS_LABELS) as [PlantStatus, string][]).map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setBulkStatus(bulkStatus === status ? "" : status)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all
                    ${bulkStatus === status
                      ? 'bg-white text-[#245A34] shadow-sm'
                      : 'text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!bulkStatus || bulkUpdateStatus.isPending}
              onClick={() => void handleBulkStatusUpdate()}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#245A34] hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkUpdateStatus.isPending
                ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
                : <Check className="h-3 w-3" strokeWidth={3} />
              }
              Áp dụng
            </button>

            <div className="h-5 w-px bg-white/20" />

            {/* Delete */}
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={bulkDeletePlants.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/25 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500/40 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              Xóa đã chọn
            </button>

            <div className="flex-1" />

            {/* Dismiss */}
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
              title="Bỏ chọn tất cả"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {isPlantsError ? (
        <PageErrorState onRetry={() => void refetchPlants()} />
      ) : null}

      {isPlantsLoading ? (
        <div
          className="grid grid-cols-1 gap-5 lg:grid-cols-2"
          aria-label="Đang tải danh sách cây"
        >
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-[1.75rem] bg-slate-100"
            />
          ))}
        </div>
      ) : null}

      {!isPlantsLoading && !isPlantsError && filteredPlants.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <Sprout className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-xl font-black text-slate-900">
            Chưa có cây trồng nào
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Tạo cây đầu tiên để bắt đầu theo dõi lịch chăm sóc và treatment plan.
          </p>
          <button
            type="button"
            onClick={() => setFormTarget({ mode: "create" })}
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1b432a]"
          >
            Thêm cây đầu tiên
          </button>
        </div>
      ) : null}

      <PagedGrid
        viewMode={viewMode}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="cây trồng"
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
      >
        {filteredPlants.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            species={speciesById.get(plant.speciesId)}
            farmPlot={farmPlotById.get(plant.farmPlotId)}
            detailUrl={ROUTES.DASHBOARD.PLANT_DETAIL(plant.id)}
            onEdit={(item) => setFormTarget({ mode: "edit", plant: item })}
            onDelete={setDeleteTarget}
            variant={viewMode}
            selected={selectedIds.has(plant.id)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </PagedGrid>

      {formTarget ? (
        <PlantFormDialog
          key={
            formTarget.mode === "edit"
              ? `edit-${formTarget.plant.id}`
              : "create"
          }
          mode={formTarget.mode}
          plant={formTarget.mode === "edit" ? formTarget.plant : null}
          farmPlots={farmPlots}
          isSubmitting={
            formTarget.mode === "create"
              ? createPlant.isPending
              : updatePlant.isPending
          }
          onClose={() => setFormTarget(null)}
          onSubmit={
            formTarget.mode === "create" ? handleCreatePlant : handleUpdatePlant
          }
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDeleteDialog
          title="Xóa cây trồng"
          description={`Bạn có chắc muốn xóa cây "${deleteTarget.nickName || deleteTarget.plantNumber || deleteTarget.id}"?`}
          isDeleting={deletePlant.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDeletePlant()}
        />
      ) : null}

      {showBulkDeleteConfirm ? (
        <ConfirmDeleteDialog
          title="Xóa nhiều cây trồng"
          description={`Bạn có chắc muốn xóa ${selectedIds.size} cây trồng đã chọn? Hành động này không thể hoàn tác.`}
          isDeleting={bulkDeletePlants.isPending}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          onConfirm={() => void handleBulkDelete()}
        />
      ) : null}
    </div>
  );
}

export default PlantListPage;

function ZoneFilterSelect({
  farmPlotId,
  value,
  onChange,
}: {
  farmPlotId: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const zonesQuery = useFarmZones(farmPlotId, Boolean(farmPlotId));
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);

  const zoneOptions = useMemo(() => [
    { value: "", label: "Tất cả khu vực" },
    ...zones.map((zone) => ({ value: zone.id, label: zone.zoneName })),
  ], [zones]);

  return (
    <Select
      value={value}
      onChange={(val) => onChange(val as string)}
      options={zoneOptions}
      placeholder="Tất cả khu vực"
    />
  );
}
