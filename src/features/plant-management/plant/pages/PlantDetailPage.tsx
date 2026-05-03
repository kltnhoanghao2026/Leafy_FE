import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Microscope, Pencil, RefreshCw, Sprout, Trash2 } from "lucide-react";
import { ROUTES } from '../../../../lib/routes';
import { ConfirmDeleteDialog } from '../../../farm-management/components/ConfirmDeleteDialog';
import { useFarmPlots } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import { PlantEventList } from '../../calendarview/components/PlantEventList';
import { PlantFormDialog } from "../components/PlantFormDialog";
import { PlanList } from '../../plan/components/PlanList';
import {
  formatDate,
  PLANT_STATUS_LABELS,
} from '../../shared/components/displayUtils';
import {
  useDeletePlant,
  usePlant,
  usePlantEvents,
  usePlannedPlantEvents,
  useSpecies,
  usePlansByPlant,
  useUpdatePlant,
} from '../..';
import type { PlantCreateRequest, PlantUpdateRequest } from '../../shared/types';

export function PlantDetailPage() {
  const { plantId = "" } = useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const farmPlotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const farmPlots = useMemo(
    () => farmPlotsQuery.data ?? [],
    [farmPlotsQuery.data],
  );
  const speciesQuery = useSpecies();
  const plantQuery = usePlant(plantId, Boolean(plantId));
  const eventsQuery = usePlantEvents(plantId, Boolean(plantId));
  const plannedEventsQuery = usePlannedPlantEvents(plantId, Boolean(plantId));
  const treatmentPlansQuery = usePlansByPlant(plantId, Boolean(plantId));
  const updatePlant = useUpdatePlant();
  const deletePlant = useDeletePlant();

  const plant = plantQuery.data;
  const species = useMemo(
    () => speciesQuery.data?.find((item) => item.id === plant?.speciesId),
    [plant?.speciesId, speciesQuery.data],
  );
  const farmPlot = useMemo(
    () => farmPlots.find((item) => item.id === plant?.farmPlotId),
    [farmPlots, plant?.farmPlotId],
  );

  const handleUpdatePlant = async (
    payload: PlantCreateRequest | PlantUpdateRequest,
  ) => {
    if (!plant) {
      return;
    }

    await updatePlant.mutateAsync({
      plantId: plant.id,
      payload: payload as PlantUpdateRequest,
    });
    setIsEditOpen(false);
  };

  const handleDeletePlant = async () => {
    if (!plant) {
      return;
    }

    await deletePlant.mutateAsync(plant.id);
    navigate(ROUTES.DASHBOARD.PLANTS);
  };

  if (plantQuery.isLoading) {
    return (
      <div className="space-y-4" aria-label="Đang tải chi tiết cây">
        <div className="h-40 animate-pulse rounded-[2rem] bg-slate-100" />
        <div className="h-72 animate-pulse rounded-[2rem] bg-slate-100" />
      </div>
    );
  }

  if (plantQuery.isError || !plant) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
        <h3 className="text-lg font-black text-red-700">
          Không tải được chi tiết cây trồng
        </h3>
        <p className="mt-1 text-sm font-semibold text-red-600">
          Cây không tồn tại hoặc plant-management-service chưa phản hồi.
        </p>
        <button
          type="button"
          onClick={() => void plantQuery.refetch()}
          className="mt-4 inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Tải lại
        </button>
      </div>
    );
  }

  const displayName = plant.nickName || plant.plantNumber || "Cây trồng";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <Link
          to={ROUTES.DASHBOARD.PLANTS}
          className="inline-flex items-center text-sm font-black text-[#245A34] hover:text-[#1b432a]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Quay lại danh sách cây
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
              {plant.plantNumber || plant.tagCode || "Chưa có mã cây"}
            </p>
            <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
              {displayName}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {species?.commonName || species?.cultivarName || plant.speciesId}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700">
              {PLANT_STATUS_LABELS[plant.plantStatus]}
            </span>
            <button
              type="button"
              onClick={() =>
                navigate(ROUTES.DASHBOARD.DISEASE_DIAGNOSIS, {
                  state: {
                    plantContext: {
                      plantId: plant.id,
                      plantName: displayName,
                      farmPlotId: plant.farmPlotId,
                      farmPlotName: farmPlot?.name,
                    },
                  },
                })
              }
              className="inline-flex items-center rounded-2xl bg-[#245A34] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b432a]"
            >
              <Microscope className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Chẩn đoán bệnh cho cây này
            </button>
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
            >
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Xóa
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-2xl bg-[#EAF3EA] p-3 text-[#245A34]">
            <Sprout className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Thông tin cơ bản
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              Thông tin quản lý cây từ plant-management-service.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Giống/Loài cây" value={species?.commonName || plant.speciesId} />
          <InfoTile label="Vườn" value={farmPlot?.name || plant.farmPlotId} />
          <InfoTile label="Ngày trồng" value={formatDate(plant.plantingDate)} />
          <InfoTile label="Tag" value={plant.tagCode || "Chưa cập nhật"} />
          <InfoTile label="Lô giống" value={plant.batchNumber || "Chưa cập nhật"} />
          <InfoTile label="Nguồn cây" value={plant.sourceType || "Chưa cập nhật"} />
          <InfoTile label="Nảy mầm" value={formatDate(plant.germinationDate)} />
          <InfoTile
            label="Năng suất"
            value={
              plant.totalYieldKg != null
                ? `${plant.totalYieldKg.toLocaleString("vi-VN")} kg`
                : "Chưa cập nhật"
            }
          />
        </div>
      </section>

      <PlantEventList
        title="Lịch chăm sóc"
        events={eventsQuery.data ?? []}
        isLoading={eventsQuery.isLoading}
        isError={eventsQuery.isError}
      />

      <PlantEventList
        title="Lịch sắp tới"
        events={plannedEventsQuery.data ?? []}
        isLoading={plannedEventsQuery.isLoading}
        isError={plannedEventsQuery.isError}
        emptyText="Chưa có lịch chăm sóc sắp tới."
      />

      <PlanList
        plans={treatmentPlansQuery.data ?? []}
        isLoading={treatmentPlansQuery.isLoading}
        isError={treatmentPlansQuery.isError}
      />

      {isEditOpen ? (
        <PlantFormDialog
          mode="edit"
          plant={plant}
          farmPlots={farmPlots}
          isSubmitting={updatePlant.isPending}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdatePlant}
        />
      ) : null}

      {isDeleteOpen ? (
        <ConfirmDeleteDialog
          title="Xóa cây trồng"
          description={`Bạn có chắc muốn xóa cây "${displayName}"?`}
          isDeleting={deletePlant.isPending}
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={() => void handleDeletePlant()}
        />
      ) : null}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default PlantDetailPage;
