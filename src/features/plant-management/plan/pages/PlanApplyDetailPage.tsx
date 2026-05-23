import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Leaf,
  List,
  MapPin,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { ROUTES } from "../../../../lib/routes";
import { ConfirmDeleteDialog } from "../../../farm-management/components/ConfirmDeleteDialog";
import { PlantEventEditDialog } from "../../calendarview/components/PlantEventEditDialog";
import { CalendarWorkspace } from "../../calendarview/components/CalendarWorkspace";
import { PlantEventProgressModal } from "../../overview/components/PlantEventProgressModal";
import {
  useCancelApplyMutation,
  useDeletePlantEventMutation,
  usePlanApplyDetail,
  usePlantEventsByPlanApply,
  useToggleTaskMutation,
  useUpdatePlantEventMutation,
} from "../..";
import { CancelApplyDialog } from "../components/CancelApplyDialog";
import type { PlantEventResponse } from "../../shared/types";
import {
  EVENT_TYPE_LABELS,
  formatDate,
  TREATMENT_STATUS_LABELS,
} from "../../shared/components/displayUtils";
import { useMyProfile } from "../../../settings/queries";

type ViewMode = "list" | "calendar";

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  APPLYING:  "bg-purple-50 text-purple-700 border-purple-200",
  ACTIVE:    "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

export function PlanApplyDetailPage() {
  const { applyId = "" } = useParams();
  const [deleteEventTarget, setDeleteEventTarget] = useState<PlantEventResponse | null>(null);
  const [editEventTarget, setEditEventTarget] = useState<PlantEventResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<import("../shared/types").PlanApplyResponse | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlantEventResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";

  const applyQuery = usePlanApplyDetail(applyId);
  const eventsQuery = usePlantEventsByPlanApply(applyId);

  const updateEvent = useUpdatePlantEventMutation();
  const toggleTask = useToggleTaskMutation();
  const deleteEvent = useDeletePlantEventMutation();
  const cancelApply = useCancelApplyMutation();

  const apply = applyQuery.data;
  const events = eventsQuery.data ?? [];

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    await deleteEvent.mutateAsync(deleteEventTarget.id);
    setDeleteEventTarget(null);
  };

  if (applyQuery.isLoading) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">
        Đang tải chi tiết áp dụng...
      </div>
    );
  }

  if (applyQuery.isError || !apply) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6">
        <p className="text-sm font-bold text-red-700">
          Không tải được chi tiết lần áp dụng.
        </p>
        <button
          type="button"
          onClick={() => void applyQuery.refetch()}
          className="mt-4 inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Tải lại
        </button>
      </div>
    );
  }

  // To check owner, we can check if appliedById matches, or just let users who see the apply edit events
  // Assuming appliedById gives us the person who applied it, or we rely on backend permissions.
  const isOwner = !apply.appliedById || ownerProfileId === apply.appliedById;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <Link to={ROUTES.DASHBOARD.PLAN_DETAIL(apply.planId)} className="inline-flex items-center text-sm font-bold text-[#245A34] hover:underline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại kế hoạch
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-black tracking-tight text-slate-900">
              Lần áp dụng: {apply.planName || "Kế hoạch"}
            </h1>
            <span className={`rounded-full px-3 py-1 text-xs font-black border ${STATUS_STYLE[apply.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
              {TREATMENT_STATUS_LABELS[apply.status] ?? apply.status}
            </span>
            {apply.trackingGranularity && apply.trackingGranularity !== "NONE" && (
              <span className="rounded-full bg-slate-200/50 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-600">
                Theo dõi: {apply.trackingGranularity}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              Bắt đầu: {formatDate(apply.startDate)}
            </span>
            {apply.targetName && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                Phạm vi: {apply.targetName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              Tạo lúc: {formatDate(apply.createdAt)}
            </span>
            {apply.appliedByName && (
              <span className="flex items-center gap-1.5">
                <Leaf className="h-4 w-4 text-slate-400" />
                Người áp dụng: {apply.appliedByName}
              </span>
            )}
          </div>

          {/* Detailed entity info */}
          {(apply.farmPlot || apply.farmZone || apply.plant) && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {apply.farmPlot && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vườn</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {apply.farmPlot.name || "—"}
                  </p>
                  {apply.farmPlot.code && (
                    <p className="mt-0.5 text-xs text-slate-500">Mã: {apply.farmPlot.code}</p>
                  )}
                  {apply.farmPlot.addressLine && (
                    <p className="mt-0.5 text-xs text-slate-500">{apply.farmPlot.addressLine}</p>
                  )}
                </div>
              )}
              {apply.farmZone && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khu vực</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {apply.farmZone.zoneName || "—"}
                  </p>
                  {apply.farmZone.zoneCode && (
                    <p className="mt-0.5 text-xs text-slate-500">Mã: {apply.farmZone.zoneCode}</p>
                  )}
                </div>
              )}
              {apply.plant && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cây</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {apply.plant.nickName || apply.plant.plantNumber || "—"}
                  </p>
                  {apply.plant.plantNumber && (
                    <p className="mt-0.5 text-xs text-slate-500">Số: {apply.plant.plantNumber}</p>
                  )}
                  {apply.plant.tagCode && (
                    <p className="mt-0.5 text-xs text-slate-500">Tag: {apply.plant.tagCode}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Link to original plan */}
          <div className="mt-4">
            <Link
              to={ROUTES.DASHBOARD.PLAN_DETAIL(apply.planId)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#245A34]/20 bg-[#245A34]/5 px-4 py-2.5 text-sm font-bold text-[#245A34] transition-all hover:bg-[#245A34]/10 hover:border-[#245A34]/30"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Xem kế hoạch gốc
              <svg className="h-3.5 w-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {apply.status === "ACTIVE" && apply.canCancel !== false && (
            <button
              type="button"
              onClick={() => setCancelTarget(apply)}
              className="inline-flex items-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Hủy áp dụng
            </button>
          )}
        </div>
      </header>

      <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Sự kiện sinh ra ({events.length})
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-slate-400">
              Các sự kiện thực tế được tạo ra trong lần áp dụng này
            </p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 self-start">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-[#2F7F34] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-bold transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-[#2F7F34] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Lịch
            </button>
          </div>
        </div>

        {eventsQuery.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        )}
        {eventsQuery.isError && (
          <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
            Không tải được sự kiện của lần áp dụng.
          </p>
        )}
        {!eventsQuery.isLoading && !eventsQuery.isError && !events.length && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
            Chưa có sự kiện nào được tạo ra.
          </p>
        )}

        {viewMode === "calendar" && !eventsQuery.isLoading && !eventsQuery.isError && events.length > 0 && (
          <div className="mb-4 h-[500px] overflow-hidden rounded-2xl border border-slate-100">
            <CalendarWorkspace
              events={events}
              calendarQuery={eventsQuery}
              onEditEvent={setEditEventTarget}
              onSelectEvent={setSelectedEvent}
              onDelete={setDeleteEventTarget}
              onToggleComplete={(event) =>
                void updateEvent.mutateAsync({ eventId: event.id, payload: { completed: !event.completed } })
              }
              onToggleTask={(event, idx) =>
                void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
              }
            />
          </div>
        )}

        {viewMode === "list" && (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <article key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#245A34]/10 text-[#245A34] text-xs font-black">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-black ${event.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${event.planned ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                          {event.planned ? "Đã lên lịch" : "Ghi nhận"}
                        </span>
                        {event.completed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                            Hoàn thành
                          </span>
                        )}
                      </div>
                      {(event.note || event.description) && (
                        <p className="mt-1 text-sm font-semibold text-slate-600 leading-relaxed">
                          {event.note || event.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      title={event.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                      onClick={() => void updateEvent.mutateAsync({ eventId: event.id, payload: { completed: !event.completed } })}
                      className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                        event.completed
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {event.completed
                        ? <><CheckCircle2 className="mr-1.5 w-3 h-3" strokeWidth={2.5} />Hoàn thành</>
                        : <><Circle className="mr-1.5 w-3 h-3" strokeWidth={2} />Đánh dấu</>}
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setEditEventTarget(event)}
                        className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        <Pencil className="mr-1.5 w-3 h-3" strokeWidth={2.5} />
                        Sửa
                      </button>
                    )}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setDeleteEventTarget(event)}
                        className="inline-flex items-center rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="mr-1.5 w-3 h-3" strokeWidth={2.5} />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-white px-3 py-2 border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bắt đầu</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{formatDate(event.calculatedStartDate) || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Kết thúc</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{formatDate(event.calculatedEndDate) || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Thời gian (ngày)</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{event.durationDays ?? "—"}</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">PHI (ngày)</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{event.phiDays ?? "—"}</p>
                  </div>
                </div>

                {(event.ppeRequired || event.mrlNote || event.estimatedCost) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.ppeRequired && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <ShieldAlert className="w-3 h-3" strokeWidth={2.5} />
                        PPE: {event.ppeRequired}
                      </span>
                    )}
                    {event.mrlNote && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <Leaf className="w-3 h-3" strokeWidth={2.5} />
                        MRL: {event.mrlNote}
                      </span>
                    )}
                    {event.estimatedCost && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        <DollarSign className="w-3 h-3" strokeWidth={2.5} />
                        {event.estimatedCost}
                      </span>
                    )}
                  </div>
                )}

                {/* Task checklist */}
                {event.tasks != null && event.tasks.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Công việc</p>
                    <div className="space-y-1">
                      {event.tasks.map((task, taskIdx) => (
                        <div
                          key={taskIdx}
                          className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
                        >
                          <button
                            type="button"
                            title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                            onClick={() => void toggleTask.mutateAsync({ eventId: event.id, taskIndex: taskIdx })}
                            className="mt-0.5 shrink-0 transition-colors hover:opacity-70"
                          >
                            {task.completed
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
                              : <Circle className="h-4 w-4 text-slate-300" strokeWidth={2} />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-0.5 text-[11px] text-slate-400">{task.description}</p>
                            )}
                          </div>
                          {task.estimatedCost && (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                              {task.estimatedCost}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {deleteEventTarget && (
        <ConfirmDeleteDialog
          title="Xóa sự kiện"
          description={`Bạn có chắc muốn xóa sự kiện "${deleteEventTarget.note || deleteEventTarget.id}"?`}
          isDeleting={deleteEvent.isPending}
          onCancel={() => setDeleteEventTarget(null)}
          onConfirm={() => void handleDeleteEvent()}
        />
      )}
      {editEventTarget && (
        <PlantEventEditDialog
          event={editEventTarget}
          isSubmitting={updateEvent.isPending}
          onClose={() => setEditEventTarget(null)}
          zIndex="z-[60]"
          onSubmit={(payload) =>
            void updateEvent
              .mutateAsync({ eventId: editEventTarget.id, payload })
              .then(() => setEditEventTarget(null))
          }
        />
      )}
      {selectedEvent && (
        <PlantEventProgressModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(event) => { setSelectedEvent(null); setEditEventTarget(event); }}
          onDelete={(event) => { setSelectedEvent(null); setDeleteEventTarget(event); }}
          onToggleTask={(event, idx) =>
            void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
          }
        />
      )}
      {cancelTarget && (
        <CancelApplyDialog
          apply={cancelTarget}
          isCancelling={cancelApply.isPending}
          onClose={() => setCancelTarget(null)}
          onConfirm={() =>
            void cancelApply.mutateAsync(cancelTarget.id).then(() => setCancelTarget(null))
          }
        />
      )}
    </div>
  );
}

export default PlanApplyDetailPage;
