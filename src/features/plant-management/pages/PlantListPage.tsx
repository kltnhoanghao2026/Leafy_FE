import { useMemo, useState } from "react";
import { RefreshCw, Search, Sprout } from "lucide-react";
import { ConfirmDeleteDialog } from "../../farm-management/components/ConfirmDeleteDialog";
import { useFarmPlots } from "../../farm-management/queries";
import { useMyProfile } from "../../settings/queries";
import { PlantCard } from "../components/PlantCard";
import { PlantFormDialog } from "../components/PlantFormDialog";
import {
  useCreatePlant,
  useDeletePlant,
  usePlants,
  usePlantsByFarmPlot,
  useSpecies,
  useUpdatePlant,
} from "../queries";
import type {
  PlantCreateRequest,
  PlantResponse,
  PlantUpdateRequest,
} from "../types";

export function PlantListPage() {
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const farmPlotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const farmPlots = useMemo(
    () => farmPlotsQuery.data ?? [],
    [farmPlotsQuery.data],
  );

  const [search, setSearch] = useState("");
  const [farmPlotFilter, setFarmPlotFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [formTarget, setFormTarget] = useState<
    { mode: "create"; plant?: null } | { mode: "edit"; plant: PlantResponse } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<PlantResponse | null>(null);

  const plantsQuery = usePlants();
  const plantsByFarmPlotQuery = usePlantsByFarmPlot(
    farmPlotFilter,
    Boolean(farmPlotFilter),
  );
  const speciesQuery = useSpecies();
  const species = useMemo(() => speciesQuery.data ?? [], [speciesQuery.data]);

  const sourcePlants = useMemo(
    () =>
      farmPlotFilter
        ? plantsByFarmPlotQuery.data ?? []
        : plantsQuery.data ?? [],
    [farmPlotFilter, plantsByFarmPlotQuery.data, plantsQuery.data],
  );
  const isPlantsLoading = farmPlotFilter
    ? plantsByFarmPlotQuery.isLoading
    : plantsQuery.isLoading;
  const isPlantsError = farmPlotFilter
    ? plantsByFarmPlotQuery.isError
    : plantsQuery.isError;
  const refetchPlants = farmPlotFilter
    ? plantsByFarmPlotQuery.refetch
    : plantsQuery.refetch;

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

  const filteredPlants = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return sourcePlants.filter((plant) => {
      const matchesSearch =
        !normalizedSearch ||
        [plant.nickName, plant.plantNumber, plant.tagCode, plant.batchNumber]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesSpecies = !speciesFilter || plant.speciesId === speciesFilter;

      return matchesSearch && matchesSpecies;
    });
  }, [search, sourcePlants, speciesFilter]);

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

          <label htmlFor="farm-plot-filter" className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Vườn
            </span>
            <select
              id="farm-plot-filter"
              value={farmPlotFilter}
              onChange={(event) => setFarmPlotFilter(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
            >
              <option value="">Tất cả vườn</option>
              {farmPlots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="species-filter" className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Giống/Loài cây
            </span>
            <select
              id="species-filter"
              value={speciesFilter}
              onChange={(event) => setSpeciesFilter(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
            >
              <option value="">Tất cả giống cây</option>
              {species.map((item) => (
                <option key={item.id} value={item.id}>
                  {[item.commonName, item.cultivarName].filter(Boolean).join(" - ")}
                </option>
              ))}
            </select>
          </label>
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
