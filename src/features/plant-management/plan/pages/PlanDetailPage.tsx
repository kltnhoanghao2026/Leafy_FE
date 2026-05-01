import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, RefreshCw, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "../../../farm-management/components/ConfirmDeleteDialog";
import { useFarmPlots, useFarmZones } from "../../../farm-management/queries";
import { ROUTES } from "../../../../lib/routes";
import { PlantEventEditDialog } from "../../calendarview/components/PlantEventEditDialog";
import {
  useDeletePlantEventMutation,
  useDeletePlanMutation,
  usePlant,
  usePlantEventsByPlan,
  useTreatmentPlanDetail,
  useUpdatePlantEventMutation,
  useUpdatePlanStatusMutation,
} from "../..";
import { useMyProfile } from "../../../settings/queries";
import type { PlantEventResponse, TreatmentStatus } from "../../shared/types";
import {
  EVENT_TYPE_LABELS,
  formatDate,
  TREATMENT_STATUS_LABELS,
} from "../../shared/components/displayUtils";

const STATUS_OPTIONS: TreatmentStatus[] = [
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

export function PlanDetailPage() {
  const { planId = "" } = useParams();
  const location = useLocation();
  const fallbackPlanId = location.pathname.split("/").filter(Boolean).at(-1) ?? "";
  const activePlanId = planId || fallbackPlanId;
  const navigate = useNavigate();
  const [deletePlanOpen, setDeletePlanOpen] = useState(false);
  const [deleteEventTarget, setDeleteEventTarget] =
    useState<PlantEventResponse | null>(null);
  const [editEventTarget, setEditEventTarget] =
    useState<PlantEventResponse | null>(null);

  const planQuery = useTreatmentPlanDetail(activePlanId);
  const plan = planQuery.data;
  const sourcePlanId = plan?.ragPlanId || plan?.id || "";
  const eventsQuery = usePlantEventsByPlan(sourcePlanId, Boolean(sourcePlanId));
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZones(plan?.farmPlotId ?? "", Boolean(plan?.farmPlotId));
  const plantQuery = usePlant(plan?.plantId ?? "", Boolean(plan?.plantId));
  const updateStatus = useUpdatePlanStatusMutation();
  const deletePlan = useDeletePlanMutation();
  const updateEvent = useUpdatePlantEventMutation();
  const deleteEvent = useDeletePlantEventMutation();

  const plotById = useMemo(
    () => new Map((plotsQuery.data ?? []).map((plot) => [plot.id, plot])),
    [plotsQuery.data],
  );

  const handleDeletePlan = async () => {
    if (!plan) return;
    await deletePlan.mutateAsync(plan.id);
    navigate(ROUTES.DASHBOARD.PLANS);
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    await deleteEvent.mutateAsync(deleteEventTarget.id);
    setDeleteEventTarget(null);
  };

  if (planQuery.isLoading) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">
        Đang tải chi tiết kế hoạch điều trị...
      </div>
    );
  }

  if (planQuery.isError || !plan) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6">
        <p className="text-sm font-bold text-red-700">
          Không tải được chi tiết kế hoạch điều trị.
        </p>
        <button
          type="button"
          onClick={() => void planQuery.refetch()}
          className="mt-4 inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Tải lại
        </button>
      </div>
    );
  }

  const plantName =
    plantQuery.data?.nickName || plantQuery.data?.plantNumber || plan.plantId;
  const plotName = plan.farmPlotId
    ? plotById.get(plan.farmPlotId)?.name || plan.farmPlotId
    : "Chưa gắn vườn";
  const zoneName = plan.farmZoneId
    ? (zonesQuery.data ?? []).find((zone) => zone.id === plan.farmZoneId)
        ?.zoneName || plan.farmZoneId
    : "Chưa gắn khu vực";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to={ROUTES.DASHBOARD.PLANS}
            className="inline-flex items-center text-sm font-bold text-[#245A34]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Link>
          <h2 className="mt-3 text-[32px] font-black tracking-tight text-slate-900">
            {plan.diseaseName || "Kế hoạch điều trị"}
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Kế hoạch AI chỉ mang tính hỗ trợ, cần kiểm tra thực tế trước khi áp dụng.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Đổi trạng thái kế hoạch"
            value={plan.status}
            onChange={(event) =>
              void updateStatus.mutateAsync({
                planId: plan.id,
                status: event.target.value as TreatmentStatus,
              })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {(TREATMENT_STATUS_LABELS as any)[status]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setDeletePlanOpen(true)}
            className="inline-flex items-center rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-black text-slate-900">Thông tin chính</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["Trạng thái", (TREATMENT_STATUS_LABELS as any)[plan.status] ?? plan.status],
              ["Độ tin cậy", plan.confidenceScore != null ? `${Math.round(plan.confidenceScore * 100)}%` : "Chưa rõ"],
              ["Mức độ", plan.severityLevel || "Chưa rõ"],
              ["Khẩn cấp", plan.urgency || "Chưa rõ"],
              ["Chi phí", plan.estimatedCost || "Chưa cập nhật"],
              ["Ngày tạo", formatDate(plan.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
          {plan.question ? (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-amber-700">Câu hỏi gốc</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">{plan.question}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-slate-900">Scope</h3>
          <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
            <p><span className="font-black text-slate-900">Cây:</span> {plantName || "Chưa gắn cây"}</p>
            <p><span className="font-black text-slate-900">Vườn:</span> {plotName}</p>
            <p><span className="font-black text-slate-900">Khu vực:</span> {zoneName}</p>
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            <p className="font-black text-slate-900">Thông tin nguồn AI</p>
            <p className="mt-2">RAG plan: {plan.ragPlanId || "Không có"}</p>
            <p>Source: {plan.source || "Không rõ"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-black text-slate-900">Ghi chú an toàn và đầu vào</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Vật tư cần có</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{plan.requiredInputs?.join(", ") || "Chưa cập nhật"}</p>
          </div>
          <div className="rounded-2xl bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-red-500">Cảnh báo an toàn</p>
            <p className="mt-2 text-sm font-semibold text-red-700">{plan.safetyWarnings?.join(", ") || "Kiểm tra thực tế trước khi áp dụng."}</p>
          </div>
          <div className="rounded-2xl bg-green-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-green-700">Dấu hiệu thành công</p>
            <p className="mt-2 text-sm font-semibold text-green-800">{plan.successIndicators || "Chưa cập nhật"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">Plant events đã sinh</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Đọc từ `GET /plant-events/plan/{plan.ragPlanId || plan.id}`.
            </p>
          </div>
          <Link
            to={ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR}
            state={{
              filters: {
                plantId: plan.plantId,
                farmPlotId: plan.farmPlotId,
                farmZoneId: plan.farmZoneId,
              },
            }}
            className="inline-flex items-center rounded-2xl border border-[#245A34] px-4 py-3 text-sm font-bold text-[#245A34]"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Xem calendar
          </Link>
        </div>

        {eventsQuery.isLoading ? (
          <div className="space-y-3" aria-label="Đang tải plant events">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : null}
        {eventsQuery.isError ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
            Không tải được plant events của kế hoạch.
          </p>
        ) : null}
        {!eventsQuery.isLoading && !eventsQuery.isError && !(eventsQuery.data ?? []).length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
            Chưa có event nào được tìm thấy cho plan này.
          </p>
        ) : null}

        <div className="space-y-3">
          {(eventsQuery.data ?? []).map((event) => (
            <article key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {event.note || event.description || "Không có mô tả"}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                  {event.planned ? "Đã lên lịch" : "Đã ghi nhận"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                <p><span className="font-black text-slate-400">Bắt đầu:</span> {formatDate(event.calculatedStartDate)}</p>
                <p><span className="font-black text-slate-400">Kết thúc:</span> {formatDate(event.calculatedEndDate)}</p>
                <p><span className="font-black text-slate-400">PHI:</span> {event.phiDays ?? "N/A"}</p>
                <p><span className="font-black text-slate-400">PPE:</span> {event.ppeRequired || "N/A"}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  aria-label="Chỉnh sửa event"
                  onClick={() => setEditEventTarget(event)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
                >
                  Chỉnh sửa event
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteEventTarget(event)}
                  className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700"
                >
                  Xóa event
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {deletePlanOpen ? (
        <ConfirmDeleteDialog
          title="Xóa kế hoạch điều trị"
          description={`Bạn có chắc muốn xóa kế hoạch "${plan.diseaseName || plan.id}"?`}
          isDeleting={deletePlan.isPending}
          onCancel={() => setDeletePlanOpen(false)}
          onConfirm={() => void handleDeletePlan()}
        />
      ) : null}
      {deleteEventTarget ? (
        <ConfirmDeleteDialog
          title="Xóa lịch chăm sóc"
          description={`Bạn có chắc muốn xóa event "${deleteEventTarget.note || deleteEventTarget.id}"?`}
          isDeleting={deleteEvent.isPending}
          onCancel={() => setDeleteEventTarget(null)}
          onConfirm={() => void handleDeleteEvent()}
        />
      ) : null}
      {editEventTarget ? (
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
      ) : null}
    </div>
  );
}

export default PlanDetailPage;
