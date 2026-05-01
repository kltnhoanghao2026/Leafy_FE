import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Sprout } from "lucide-react";
import { ConfirmDeleteDialog } from '../../../farm-management/components/ConfirmDeleteDialog';
import { useFarmPlots, useFarmZones } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import { PlantCard } from "../components/PlantCard";
import { PlantFormDialog } from "../components/PlantFormDialog";
import {
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
  const [formTarget, setFormTarget] = useState<
    { mode: "create"; plant?: null } | { mode: "edit"; plant: PlantResponse } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<PlantResponse | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Server-side filtering via the fixed /plants/me endpoint
  const plantsQuery = useMyPlants({
    search: debouncedSearch || undefined,
    farmPlotId: farmPlotFilter || undefined,
    farmZoneId: farmZoneFilter || undefined,
    speciesId: speciesFilter || undefined,
    status: statusFilter || undefined,
  });

  const speciesQuery = useSpecies();
  const species = useMemo(() => speciesQuery.data ?? [], [speciesQuery.data]);

  const filteredPlants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const isPlantsLoading = plantsQuery.isLoading;
  const isPlantsError = plantsQuery.isError;
  const refetchPlants = plantsQuery.refetch;

  const createPlant = useCreatePlant();
  const updatePlant = useUpdatePlant();
  const deletePlant = useDeletePlant();

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

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
          {/* Search input */}
          <label htmlFor="plant-search" className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Tìm kiếm
            </span>
            <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input
                id="plant-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tên cây, mã cây, tag..."
                className="h-12 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              />
            </div>
          </label>

          {/* Farm plot filter */}
          <div className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Vườn
            </span>
            <Select
              className="mt-2"
              value={farmPlotFilter}
              onChange={(val) => {
                setFarmPlotFilter(val as string);
                setFarmZoneFilter(""); // Reset zone when plot changes
              }}
              options={farmPlotOptions}
              placeholder="Tất cả vườn"
            />
          </div>

          {/* Zone filter – only visible when a plot is selected */}
          {farmPlotFilter && (
            <div className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Khu vực
              </span>
              <ZoneFilterSelect
                farmPlotId={farmPlotFilter}
                value={farmZoneFilter}
                onChange={setFarmZoneFilter}
              />
            </div>
          )}

          {/* Status filter */}
          <div className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Trạng thái
            </span>
            <Select
              className="mt-2"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as PlantStatus | "")}
              options={statusOptions}
              placeholder="Tất cả trạng thái"
            />
          </div>

          {/* Species filter */}
          <div className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Giống/Loài cây
            </span>
            <Select
              className="mt-2"
              value={speciesFilter}
              onChange={(val) => setSpeciesFilter(val as string)}
              options={speciesOptions}
              placeholder="Tất cả giống cây"
            />
          </div>
        </div>
      </section>

      {isPlantsError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-red-700">
                Không tải được danh sách cây trồng
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                Kiểm tra plant-management-service hoặc quyền truy cập hiện tại.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetchPlants()}
              className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Tải lại
            </button>
          </div>
        </div>
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
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredPlants.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            species={speciesById.get(plant.speciesId)}
            farmPlot={farmPlotById.get(plant.farmPlotId)}
            onEdit={(item) => setFormTarget({ mode: "edit", plant: item })}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

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
      className="mt-2"
      value={value}
      onChange={(val) => onChange(val as string)}
      options={zoneOptions}
      placeholder="Tất cả khu vực"
    />
  );
}
