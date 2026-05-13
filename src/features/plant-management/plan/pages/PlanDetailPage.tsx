import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Cpu,
  DollarSign,
  Edit2,
  FlaskConical,
  Globe,
  Leaf,
  Lock,
  MapPin,
  Pencil,
  Play,
  RefreshCw,
  ShieldAlert,
  Sprout,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import { PlanPreviewCalendar } from "../../../consulting/components/PlanPreviewCalendar";
import { ConfirmDeleteDialog } from "../../../farm-management/components/ConfirmDeleteDialog";
import { useFarmPlots, useFarmZones } from "../../../farm-management/queries";
import { ROUTES } from "../../../../lib/routes";
import { PlantEventEditDialog } from "../../calendarview/components/PlantEventEditDialog";
import {
  useApplyPlanMutation,
  useDeletePlantEventMutation,
  useDeletePlanMutation,
  usePlant,
  usePlantEventsByPlan,
  useTreatmentPlanDetail,  useToggleTaskMutation,  useUpdatePlantEventMutation,
  useUpdateApplyStatusMutation,
  useUpdatePlanVisibilityMutation,
} from "../..";
import { useUpdatePlanMutation } from "../queries/plan.queries";
import { useMyProfile } from "../../../settings/queries";
import type { PlantEventResponse, PlanApplyResponse, TreatmentStatus } from "../../shared/types";
import {
  EVENT_TYPE_LABELS,
  formatDate,
  TREATMENT_STATUS_LABELS,
} from "../../shared/components/displayUtils";
import { Select } from "../../../../components/ui/Select";
import { ApplyPlanDialog } from "../components/ApplyPlanDialog";
import { EditPlanDialog } from "../components/EditPlanDialog";

const STATUS_OPTIONS: TreatmentStatus[] = [
  "PENDING",
  "APPLYING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_STYLE: Record<TreatmentStatus, string> = {
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  APPLYING:  "bg-purple-50 text-purple-700 border-purple-200",
  ACTIVE:    "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const SEVERITY_COLOR: Record<string, string> = {
  LOW:      "text-green-600 bg-green-50",
  MEDIUM:   "text-amber-600 bg-amber-50",
  HIGH:     "text-orange-600 bg-orange-50",
  CRITICAL: "text-red-600 bg-red-50",
};

function InfoChip({ label, value, icon: Icon, color = "slate" }: { label: string; value: string; icon?: React.ElementType; color?: string }) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl bg-${color}-50 p-4`}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={`w-3.5 h-3.5 text-${color}-400`} strokeWidth={2.5} />}
        <p className={`text-[10px] font-black uppercase tracking-widest text-${color}-400`}>{label}</p>
      </div>
      <p className={`text-sm font-bold text-${color}-800`}>{value}</p>
    </div>
  );
}

export function PlanDetailPage() {
  const { planId = "" } = useParams();
  const location = useLocation();
  const fallbackPlanId = location.pathname.split("/").filter(Boolean).at(-1) ?? "";
  const activePlanId = planId || fallbackPlanId;
  const navigate = useNavigate();
  const [deletePlanOpen, setDeletePlanOpen] = useState(false);
  const [applyPlanOpen, setApplyPlanOpen] = useState(false);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [deleteEventTarget, setDeleteEventTarget] = useState<PlantEventResponse | null>(null);
  const [editEventTarget, setEditEventTarget] = useState<PlantEventResponse | null>(null);

  const planQuery = useTreatmentPlanDetail(activePlanId);
  const plan = planQuery.data;
  const sourcePlanId = plan?.id || "";
  const eventsQuery = usePlantEventsByPlan(sourcePlanId, Boolean(sourcePlanId));
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  // Derive latest apply for status/scope display
  const latestApply: PlanApplyResponse | null = useMemo(() => {
    const applies = plan?.applies;
    if (!applies || applies.length === 0) return null;
    // Return the most recent apply (last in list, or sort by createdAt)
    return [...applies].sort((a, b) => {
      const da = a.createdAt ?? "";
      const db = b.createdAt ?? "";
      return db.localeCompare(da);
    })[0];
  }, [plan?.applies]);

  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZones(latestApply?.farmPlotId ?? "", Boolean(latestApply?.farmPlotId));
  const plantQuery = usePlant(latestApply?.plantId ?? "", Boolean(latestApply?.plantId));
  const updateApplyStatus = useUpdateApplyStatusMutation();
  const updateVisibility = useUpdatePlanVisibilityMutation();
  const updatePlan = useUpdatePlanMutation();
  const deletePlan = useDeletePlanMutation();
  const applyPlan = useApplyPlanMutation();
  const updateEvent = useUpdatePlantEventMutation();
  const toggleTask  = useToggleTaskMutation();
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

  const events = eventsQuery.data ?? [];

  const previewDraftEvents = useMemo(() => {
    if (plan?.events && plan.events.length > 0) {
      return plan.events.map((e) => ({
        eventType: e.eventType,
        note: e.note ?? "",
        description: e.description ?? undefined,
        daysFromNow: e.daysFromNow ?? 0,
        durationDays: e.durationDays ?? undefined,
        phiDays: e.phiDays ?? undefined,
        ppeRequired: e.ppeRequired ?? undefined,
        mrlNote: e.mrlNote ?? undefined,
        estimatedCost: e.estimatedCost ?? undefined,
      }));
    }
    return [];
  }, [plan?.events]);

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

  const plantName = plantQuery.data?.nickName || plantQuery.data?.plantNumber || latestApply?.plantId || null;
  const plotName = latestApply?.farmPlotId ? plotById.get(latestApply.farmPlotId)?.name || latestApply.farmPlotId : null;
  const zoneName = latestApply?.farmZoneId
    ? (zonesQuery.data ?? []).find((z) => z.id === latestApply.farmZoneId)?.zoneName || latestApply.farmZoneId
    : null;
  const applyStatus: TreatmentStatus | null = latestApply?.status ?? null;
  const statusLabel = applyStatus ? ((TREATMENT_STATUS_LABELS as Record<string, string>)[applyStatus] ?? applyStatus) : "Chưa áp dụng";
  const statusStyle = applyStatus ? (STATUS_STYLE[applyStatus] ?? "bg-slate-50 text-slate-600 border-slate-200") : "bg-slate-50 text-slate-600 border-slate-200";
  const severityStyle = plan.severityLevel ? (SEVERITY_COLOR[plan.severityLevel.toUpperCase()] ?? "text-slate-600 bg-slate-50") : "";
  const confidencePct = plan.confidenceScore != null ? Math.round(plan.confidenceScore * 100) : null;

  // Only the plan owner or creator may edit/delete
  const isOwner = !!ownerProfileId && (ownerProfileId === plan.ownerId || ownerProfileId === plan.creatorId);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <Link to={ROUTES.DASHBOARD.PLANS} className="inline-flex items-center text-sm font-bold text-[#245A34] hover:underline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại danh sách
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-black tracking-tight text-slate-900">
              {plan.planName || plan.diseaseName || "Kế hoạch điều trị"}
            </h1>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${statusStyle}`}>
              {statusLabel}
            </span>
            {plan.urgency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-black text-orange-700">
                <Clock className="w-3 h-3" strokeWidth={2.5} />
                {plan.urgency}
              </span>
            )}
          </div>
          {plan.diseaseName && plan.planName && plan.diseaseName !== plan.planName && (
            <p className="mt-1 text-sm font-semibold text-slate-500 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              Bệnh: {plan.diseaseName}
            </p>
          )}
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Tạo lúc {formatDate(plan.createdAt)}
            {plan.lastModifiedAt && plan.lastModifiedAt !== plan.createdAt && (
              <> · Cập nhật {formatDate(plan.lastModifiedAt)}</>
            )}
            {plan.createdBy && <> · bởi {plan.createdBy}</>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isOwner && (
            <button
              type="button"
              onClick={() => setEditPlanOpen(true)}
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Sửa
            </button>
          )}
          {isOwner && latestApply && (
            <Select
              value={latestApply.status}
              onChange={(v) => void updateApplyStatus.mutateAsync({ applyId: latestApply.id, status: v as TreatmentStatus })}
              options={STATUS_OPTIONS.map((s) => ({
                value: s,
                label: (TREATMENT_STATUS_LABELS as Record<string, string>)[s] ?? s,
              }))}
            />
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => void updateVisibility.mutateAsync({ planId: plan.id })}
              className={`inline-flex items-center rounded-2xl border px-4 py-2.5 text-sm font-bold ${
                plan.isPublic
                  ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
              title={plan.isPublic ? "Công khai — bấm để đặt riêng tư" : "Riêng tư — bấm để công khai"}
            >
              {plan.isPublic ? (
                <><Globe className="mr-2 h-4 w-4" />Công khai</>
              ) : (
                <><Lock className="mr-2 h-4 w-4" />Riêng tư</>
              )}
            </button>
          )}
          {!isOwner && plan.isPublic && (
            <span className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700">
              <Globe className="h-4 w-4" />
              Kế hoạch cộng đồng
            </span>
          )}
          <button
            type="button"
            onClick={() => setApplyPlanOpen(true)}
            className="inline-flex items-center rounded-2xl border border-[#245A34] bg-green-50 px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-100"
          >
            <Play className="mr-2 h-4 w-4" />
            Áp dụng
          </button>
          {latestApply?.status === "APPLYING" && (
            <span className="inline-flex items-center rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-700">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-700" />
              Đang xử lý...
            </span>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setDeletePlanOpen(true)}
              className="inline-flex items-center rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </button>
          )}
        </div>
      </header>

      {/* ── Question / original prompt ── */}
      {plan.question && (
        <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50 px-6 py-4 flex gap-3">
          <Bot className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-1">Câu hỏi gốc</p>
            <p className="text-sm font-semibold leading-relaxed text-amber-900">{plan.question}</p>
          </div>
        </div>
      )}

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left col (2/3) */}
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* Key metrics */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4">Thông tin chính</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</p>
                <span className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${statusStyle}`}>{statusLabel}</span>
              </div>
              {confidencePct != null && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Độ tin cậy</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black text-slate-800">{confidencePct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-1.5 rounded-full bg-[#245A34]"
                        style={{ width: `${confidencePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {plan.severityLevel && (
                <div className={`rounded-2xl p-4 ${severityStyle}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mức độ nghiêm trọng</p>
                  <p className="mt-1 text-sm font-black">{plan.severityLevel}</p>
                </div>
              )}
              {plan.urgency && (
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Khẩn cấp</p>
                  <p className="mt-1 text-sm font-bold text-orange-800">{plan.urgency}</p>
                </div>
              )}
              {plan.estimatedCost && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><DollarSign className="w-3 h-3" strokeWidth={2.5} />Chi phí</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{plan.estimatedCost}</p>
                </div>
              )}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số sự kiện</p>
                <p className="mt-1 text-sm font-black text-slate-800">{plan.events?.length ?? 0}</p>
              </div>
            </div>
          </section>

          {/* Safety / inputs / success */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4">Vật tư & An toàn</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <FlaskConical className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vật tư cần có</p>
                </div>
                {plan.requiredInputs?.length ? (
                  <ul className="space-y-1">
                    {plan.requiredInputs.map((inp, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm font-semibold text-slate-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#245A34] shrink-0" />
                        {inp}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-semibold text-slate-400 italic">Chưa cập nhật</p>
                )}
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Cảnh báo an toàn</p>
                </div>
                {plan.safetyWarnings?.length ? (
                  <ul className="space-y-1">
                    {plan.safetyWarnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm font-semibold text-red-700">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2.5} />
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-semibold text-red-400 italic">Kiểm tra thực tế trước khi áp dụng.</p>
                )}
              </div>

              <div className="rounded-2xl bg-green-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Dấu hiệu thành công</p>
                </div>
                <p className="text-sm font-semibold text-green-800">
                  {plan.successIndicators || <span className="italic text-green-400">Chưa cập nhật</span>}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right col (1/3) */}
        <div className="flex flex-col gap-6">

          {/* Scope */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4">Phạm vi áp dụng</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <Sprout className="w-4 h-4 text-[#245A34] shrink-0" strokeWidth={2.5} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cây trồng</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{plantName || <span className="text-slate-400 italic">Chưa gắn</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <MapPin className="w-4 h-4 text-[#245A34] shrink-0" strokeWidth={2.5} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vườn</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{plotName || <span className="text-slate-400 italic">Chưa gắn</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <Cpu className="w-4 h-4 text-[#245A34] shrink-0" strokeWidth={2.5} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khu vực</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{zoneName || <span className="text-slate-400 italic">Chưa gắn</span>}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Author info */}
          {(plan.ownerInfo || plan.creatorInfo) && (
            <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-400" strokeWidth={2} />
                Người liên quan
              </h2>
              <div className="space-y-3">
                {plan.ownerInfo && (
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    {plan.ownerInfo.avatar ? (
                      <img src={plan.ownerInfo.avatar} alt={plan.ownerInfo.fullName ?? ""} className="h-9 w-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <User className="w-4 h-4" strokeWidth={2.5} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-slate-800">{plan.ownerInfo.fullName ?? "Nông dân"}</p>
                        {plan.ownerInfo.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chủ kế hoạch</p>
                    </div>
                  </div>
                )}
                {plan.creatorInfo && (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                    {plan.creatorInfo.avatar ? (
                      <img src={plan.creatorInfo.avatar} alt={plan.creatorInfo.fullName ?? ""} className="h-9 w-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
                        <UserCheck className="w-4 h-4" strokeWidth={2.5} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-emerald-900">{plan.creatorInfo.fullName ?? "Chuyên gia"}</p>
                        {plan.creatorInfo.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Chuyên gia tư vấn</p>
                      {plan.creatorInfo.specialty && (
                        <p className="text-xs font-semibold text-emerald-700 truncate">{plan.creatorInfo.specialty}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AI source */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-slate-400" strokeWidth={2} />
              Nguồn AI
            </h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nguồn</p>
                <p className="font-bold text-slate-700">{plan.source || <span className="italic text-slate-400">Không rõ</span>}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">RAG Plan ID</p>
                <p className="font-mono text-xs text-slate-600 break-all">{plan.ragPlanId || <span className="italic text-slate-400">Không có</span>}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Plan ID</p>
                <p className="font-mono text-xs text-slate-600 break-all">{plan.id}</p>
              </div>
            </div>
          </section>

          {/* Audit */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" strokeWidth={2} />
              Lịch sử thay đổi
            </h2>
            <div className="space-y-2 text-sm">
              {[
                { label: "Ngày tạo", value: formatDate(plan.createdAt) },
                { label: "Người tạo", value: plan.createdBy },
                { label: "Cập nhật lần cuối", value: formatDate(plan.lastModifiedAt) },
                { label: "Người cập nhật", value: plan.lastModifiedBy },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-400 font-semibold shrink-0">{label}</span>
                    <span className="font-bold text-slate-700 text-right truncate">{value}</span>
                  </div>
                ) : null,
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Calendar Preview ── */}
      {!eventsQuery.isLoading && previewDraftEvents.length > 0 && (
        <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" strokeWidth={2} />
                Xem lịch kế hoạch
              </h2>
              <p className="mt-0.5 text-sm font-semibold text-slate-400">
                Hiển thị các sự kiện của kế hoạch với ngày khởi điệm là hôm nay
              </p>
            </div>
            <Link
              to={ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR}
              state={{ filters: { plantId: latestApply?.plantId, farmPlotId: latestApply?.farmPlotId, farmZoneId: latestApply?.farmZoneId } }}
              className="shrink-0 inline-flex items-center rounded-2xl border border-[#245A34] px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-50"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Lịch đầy đủ
            </Link>
          </div>
          <div className="h-[540px]">
            <PlanPreviewCalendar draftEvents={previewDraftEvents} />
          </div>
        </section>
      )}

      {/* ── Plant Events ── */}
      <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Lịch chăm sóc đã áp dụng ({events.length})
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-slate-400">
              Các sự kiện thực tế được sinh ra khi áp dụng kế hoạch này
            </p>
          </div>
        </div>

        {eventsQuery.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        )}
        {eventsQuery.isError && (
          <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
            Không tải được sự kiện của kế hoạch.
          </p>
        )}
        {!eventsQuery.isLoading && !eventsQuery.isError && !events.length && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
            Chưa có sự kiện nào cho kế hoạch này.
          </p>
        )}

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
      </section>

      {/* ── Dialogs ── */}
      {deletePlanOpen && (
        <ConfirmDeleteDialog
          title="Xóa kế hoạch điều trị"
          description={`Bạn có chắc muốn xóa kế hoạch "${plan.planName || plan.diseaseName || plan.id}"?`}
          isDeleting={deletePlan.isPending}
          onCancel={() => setDeletePlanOpen(false)}
          onConfirm={() => void handleDeletePlan()}
        />
      )}
      {applyPlanOpen && (
        <ApplyPlanDialog
          plan={plan}
          isSubmitting={applyPlan.isPending}
          onClose={() => setApplyPlanOpen(false)}
          onSubmit={(payload) =>
            void applyPlan.mutateAsync({ planId: plan.id, payload }).then(() => setApplyPlanOpen(false))
          }
        />
      )}
      {deleteEventTarget && (
        <ConfirmDeleteDialog
          title="Xóa lịch chăm sóc"
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
          onSubmit={(payload) =>
            void updateEvent
              .mutateAsync({ eventId: editEventTarget.id, payload })
              .then(() => setEditEventTarget(null))
          }
        />
      )}
      {editPlanOpen && (
        <EditPlanDialog
          plan={plan}
          isSubmitting={updatePlan.isPending}
          onClose={() => setEditPlanOpen(false)}
          onSubmit={(payload) =>
            void updatePlan
              .mutateAsync({ planId: plan.id, payload })
              .then(() => setEditPlanOpen(false))
          }
        />
      )}
    </div>
  );
}

export default PlanDetailPage;
