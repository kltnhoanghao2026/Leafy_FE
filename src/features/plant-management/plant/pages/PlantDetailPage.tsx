import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Microscope,
  Pencil,
  RefreshCw,
  Sprout,
  Trash2,
} from "lucide-react";
import { ROUTES } from '../../../../lib/routes';
import { ConfirmDeleteDialog } from '../../../farm-management/components/ConfirmDeleteDialog';
import { useFarmPlots } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import { CalendarWorkspace } from '../../calendarview/components/CalendarWorkspace';
import { PlantEventEditDialog } from '../../calendarview/components/PlantEventEditDialog';
import { PlantFormDialog } from "../components/PlantFormDialog";
import {
  formatDate,
  PLANT_STATUS_LABELS,
} from '../../shared/components/displayUtils';
import {
  useDeletePlant,
  usePlant,
  usePlantEvents,
  useSpecies,
  useUpdatePlant,
  useToggleTaskMutation,
  useUpdatePlantEventMutation,
} from '../..';
import { useDiagnoseRequests, useDiagnoseResults } from '../../../disease-diagnosis/queries';
import {
  formatConfidence,
  getDiseaseLabel,
  isHealthyDisease,
} from '../../../disease-diagnosis/utils/diseaseLabels';
import { useFilePreviewUrl } from '../../../settings/queries';
import type { PlantCreateRequest, PlantUpdateRequest } from '../../shared/types';
import type { PlantEventResponse } from "../../shared/types";

// Image component for diagnosis requests
function DiagnosisImage({ fileId, alt }: { fileId: string; alt: string }) {
  const { data: presignedUrl, isError, isLoading } = useFilePreviewUrl(fileId);

  if (isLoading) {
    return <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />;
  }

  if (isError || !presignedUrl) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        <ImageIcon className="h-5 w-5 text-slate-400" strokeWidth={2} />
      </div>
    );
  }

  return (
    <img
      src={presignedUrl}
      alt={alt}
      className="h-12 w-12 rounded-xl object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

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
  const updatePlant = useUpdatePlant();
  const deletePlant = useDeletePlant();
  const updateEvent = useUpdatePlantEventMutation();
  const toggleTask = useToggleTaskMutation();

  // State for event editing
  const [editEventTarget, setEditEventTarget] = useState<PlantEventResponse | null>(null);

  // Combine events and planned events for the calendar
  const allEvents = useMemo(() => {
    const completed = eventsQuery.data ?? [];
    return completed;
  }, [eventsQuery.data]);

  // Diagnosis queries - filter requests/results for this plant
  const allRequestsQuery = useDiagnoseRequests({ page: 0, size: 100 });
  const allResultsQuery = useDiagnoseResults({ page: 0, size: 100 });

  const plant = plantQuery.data;
  const species = useMemo(
    () => speciesQuery.data?.find((item) => item.id === plant?.speciesId),
    [plant?.speciesId, speciesQuery.data],
  );
  const farmPlot = useMemo(
    () => farmPlots.find((item) => item.id === plant?.farmPlotId),
    [farmPlots, plant?.farmPlotId],
  );

  // Filter diagnosis history for this specific plant
  const diagnosisHistory = useMemo(() => {
    const requests = allRequestsQuery.data?.content ?? [];
    const results = new Map(
      (allResultsQuery.data?.content ?? []).map((r) => [r.diagnoseRequestId, r]),
    );

    // Filter requests for this plant and combine with results
    return requests
      .filter((req) => req.plantId === plantId)
      .map((req) => ({
        request: req,
        result: results.get(req.diagnoseRequestId),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.request.timeStamp).getTime();
        const dateB = new Date(b.request.timeStamp).getTime();
        return dateB - dateA; // newest first
      });
  }, [allRequestsQuery.data, allResultsQuery.data, plantId]);

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

      {/* Calendar View Section */}
      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-2xl bg-[#EAF3EA] p-3 text-[#245A34]">
            <Sprout className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Lịch chăm sóc
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              Xem lịch chăm sóc cây theo tháng, tuần hoặc danh sách.
            </p>
          </div>
        </div>

        <div className="h-[600px] overflow-hidden">
          <CalendarWorkspace
            events={allEvents}
            calendarQuery={eventsQuery}
            onEditEvent={setEditEventTarget}
            onToggleComplete={(event) =>
              void updateEvent.mutateAsync({ eventId: event.id, payload: { completed: !event.completed } })
            }
            onToggleTask={(event, idx) =>
              void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
            }
          />
        </div>
      </section>

      {/* Diagnosis History Section */}
      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-[#EAF3EA] p-3 text-[#245A34]">
              <Microscope className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Lịch sử chẩn đoán
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                Các lượt chẩn đoán bệnh cho cây này.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              allRequestsQuery.refetch();
              allResultsQuery.refetch();
            }}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
            Tải lại
          </button>
        </div>

        {allRequestsQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : allRequestsQuery.isError || allResultsQuery.isError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-700">
              Không tải được lịch sử chẩn đoán.
            </p>
          </div>
        ) : diagnosisHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Chưa có lượt chẩn đoán nào cho cây này.
            </p>
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
              className="mt-3 inline-flex items-center rounded-xl bg-[#245A34] px-4 py-2 text-sm font-bold text-white hover:bg-[#1b432a]"
            >
              <Microscope className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Chẩn đoán ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {diagnosisHistory.map(({ request, result }) => {
              const topPrediction = result?.result?.[0];
              const isHealthy = !topPrediction || isHealthyDisease(topPrediction.diseaseName);
              const Icon = isHealthy ? CheckCircle2 : AlertTriangle;

              return (
                <div
                  key={request.diagnoseRequestId}
                  className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      {request.fileId ? (
                        <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:block">
                          <DiagnosisImage
                            fileId={request.fileId}
                            alt={request.imageFileName}
                          />
                        </div>
                      ) : null}
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                          {formatDate(request.timeStamp)}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className={`rounded-2xl p-2 ${
                              isHealthy
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={2.5} />
                          </span>
                          <div>
                            <h4 className="text-lg font-black text-slate-900">
                              {topPrediction
                                ? getDiseaseLabel(topPrediction.diseaseName)
                                : isHealthy
                                ? "Khỏe mạnh"
                                : "Chưa tải kết quả"}
                            </h4>
                            {topPrediction && (
                              <p className="text-sm font-semibold text-slate-500">
                                Độ tin cậy: {formatConfidence(topPrediction.confidenceScore)}
                              </p>
                            )}
                          </div>
                        </div>
                        <p
                          className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${
                            isHealthy
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {isHealthy
                            ? "Lá cây có dấu hiệu khỏe mạnh."
                            : "Phát hiện dấu hiệu bệnh. Kết quả chỉ mang tính hỗ trợ."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {result && result.result.length > 0 && (
                    <div className="mt-5 space-y-2">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Các dự đoán
                      </p>
                      {result.result.map((item) => {
                        const percent = Math.max(
                          0,
                          Math.min(100, Math.round(item.confidenceScore * 100)),
                        );
                        return (
                          <div key={item.diseaseName}>
                            <div className="flex items-center justify-between gap-3 text-sm font-bold">
                              <span className="text-slate-700">
                                {getDiseaseLabel(item.diseaseName)}
                              </span>
                              <span className="text-slate-500">{percent}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#245A34]"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

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

      {editEventTarget && (
        <PlantEventEditDialog
          event={editEventTarget}
          isSubmitting={updateEvent.isPending}
          onClose={() => setEditEventTarget(null)}
          onSubmit={(payload) =>
            void updateEvent
              .mutateAsync({ eventId: editEventTarget.id, payload })
              .then(() => setEditEventTarget(null))
          }
        />
      )}
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
