import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  Edit2,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  Leaf,
  Lock,
  MapPin,
  Play,
  RefreshCw,
  ShieldAlert,
  Sprout,
  Trash2,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { PlanPreviewCalendar } from "../../../consulting/components/PlanPreviewCalendar";
import { ConfirmDeleteDialog } from "../../../farm-management/components/ConfirmDeleteDialog";
import { useFarmPlots, useFarmZones } from "../../../farm-management/queries";
import { ROUTES } from "../../../../lib/routes";
import {
  useApplyPlanMutation,
  useDeletePlanMutation,
  usePlant,
  useTreatmentPlanDetail,
  useUpdatePlanVisibilityMutation,
} from "../..";
import { useMyProfile } from "../../../settings/queries";
import type { PlanApplyResponse, SourceDocument, TreatmentStatus } from "../../shared/types";
import {
  formatDate,
  TREATMENT_STATUS_LABELS,
} from "../../shared/components/displayUtils";
import { ApplyPlanDialog } from "../components/ApplyPlanDialog";
import { EmbeddedEventList } from "../components/EmbeddedEventList";
import { SourceDocumentModal } from "../components/SourceDocumentModal";

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

export function PlanDetailPage() {
  const { planId = "" } = useParams();
  const location = useLocation();
  const fallbackPlanId = location.pathname.split("/").filter(Boolean).at(-1) ?? "";
  const activePlanId = planId || fallbackPlanId;
  const navigate = useNavigate();
  const [deletePlanOpen, setDeletePlanOpen] = useState(false);
  const [applyPlanOpen, setApplyPlanOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(null);

  const planQuery = useTreatmentPlanDetail(activePlanId);
  const plan = planQuery.data;
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

  // Ensure latestApply is captured


  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZones(latestApply?.farmPlotId ?? "", Boolean(latestApply?.farmPlotId));
  const plantQuery = usePlant(latestApply?.plantId ?? "", Boolean(latestApply?.plantId));
  const updateVisibility = useUpdatePlanVisibilityMutation();
  const applyPlan = useApplyPlanMutation();
  const deletePlan = useDeletePlanMutation();

  const plotById = useMemo(
    () => new Map((plotsQuery.data ?? []).map((plot) => [plot.id, plot])),
    [plotsQuery.data],
  );

  const handleDeletePlan = async () => {
    if (!plan) return;
    await deletePlan.mutateAsync(plan.id);
    navigate(ROUTES.DASHBOARD.PLANS);
  };
  const previewDraftEvents = useMemo(() => {
    const pEvents = plan?.events;
    if (pEvents && pEvents.length > 0) {
      return pEvents.map((e) => ({
        eventType: e.eventType,
        note: e.note ?? "",
        description: e.description ?? undefined,
        daysFromStart: e.daysFromStart ?? 0,
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
  const severityStyle = plan.severityLevel ? (SEVERITY_COLOR[plan.severityLevel.toUpperCase()] ?? "text-slate-600 bg-slate-50") : "";
  const confidencePct = plan.confidenceScore != null ? Math.round(plan.confidenceScore * 100) : null;

  // Only the plan owner or creator may edit/delete
  const isOwner = !!ownerProfileId && (ownerProfileId === plan.ownerId || ownerProfileId === plan.creatorId);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
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
            <Link
              to={ROUTES.DASHBOARD.PLAN_EDIT(plan.id)}
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Sửa
            </Link>
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



      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left col (2/3) */}
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* Key metrics */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4">Thông tin chính</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

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

              {/* Success stats */}
              {(plan.successApplyCount ?? 0) > 0 && (
                <div className="rounded-2xl bg-green-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                    Thành công
                  </p>
                  <p className="mt-1 text-sm font-black text-green-700">{plan.successApplyCount}</p>
                </div>
              )}

              {(plan.failedApplyCount ?? 0) > 0 && (
                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" strokeWidth={2.5} />
                    Thất bại
                  </p>
                  <p className="mt-1 text-sm font-black text-red-600">{plan.failedApplyCount}</p>
                </div>
              )}

              {/* Total applies (when no success/failed yet) */}
              {(plan.applyCount ?? 0) > 0 && (plan.successApplyCount ?? 0) === 0 && (plan.failedApplyCount ?? 0) === 0 && (
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1">
                    <Play className="w-3 h-3" strokeWidth={2.5} />
                    Tổng áp dụng
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-700">{plan.applyCount}</p>
                </div>
              )}
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
          {isOwner && (
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
          )}

          {/* Author info */}
          {(plan.ownerInfo || plan.creatorInfo || plan.sourceType === 'RAG_GEN') && (
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
                {plan.sourceType === 'RAG_GEN' ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-indigo-800">
                      <Bot className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-indigo-900">Leafy AI</p>
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-indigo-600" strokeWidth={2.5} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Trợ lý AI</p>
                    </div>
                  </div>
                ) : plan.creatorInfo && plan.creatorInfo.id !== plan.ownerInfo?.id && (
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
          {plan.sourceType === 'RAG_GEN' && (
            <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-slate-400" strokeWidth={2} />
                Tài liệu & Nguồn tham khảo AI
              </h2>
              <div className="space-y-4 text-sm">
                {plan.sourceDocuments && plan.sourceDocuments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Tài liệu chuyên môn ({plan.sourceDocuments.length})
                    </h3>
                    <div className="space-y-2">
                      {plan.sourceDocuments.map((doc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedDoc(doc)}
                          className="w-full text-left rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100 hover:border-[#245A34]/40 hover:bg-green-50/40 transition-all cursor-pointer"
                        >
                          <p className="font-bold text-slate-800 text-sm mb-1">{doc.title || (doc.metadata as Record<string, unknown>)?.source_file || "Tài liệu"}</p>
                          {doc.contentSnippet ? (
                            <p className="text-xs text-slate-500 line-clamp-2">{doc.contentSnippet}</p>
                          ) : (
                            <p className="text-xs text-slate-400 italic line-clamp-2">Bấm để xem chi tiết nội dung</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {plan.webSearchResults && plan.webSearchResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 mt-4">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      Tìm kiếm Web ({plan.webSearchResults.length})
                    </h3>
                    <div className="space-y-2">
                      {plan.webSearchResults.map((res, idx) => (
                        <a 
                          key={idx} 
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-bold text-indigo-900 text-sm group-hover:underline">{res.title}</p>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          </div>
                          {res.snippet && (
                            <p className="text-xs text-slate-500 line-clamp-2">{res.snippet}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-2 truncate font-mono">{res.url}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(!plan.sourceDocuments || plan.sourceDocuments.length === 0) && (!plan.webSearchResults || plan.webSearchResults.length === 0) && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nguồn nội bộ</p>
                    <p className="font-bold text-slate-700">{plan.source || <span className="italic text-slate-400">Không rõ</span>}</p>
                  </div>
                )}
              </div>
            </section>
          )}

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

      {/* ── Template Events ── */}
      <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-slate-900 mb-1">
          Lịch trình (Bản mẫu) ({plan.events?.length ?? 0})
        </h2>
        <p className="mb-5 text-sm font-semibold text-slate-400">
          Các sự kiện mẫu được định nghĩa sẵn trong kế hoạch này
        </p>
        <EmbeddedEventList events={plan.events ?? []} />
      </section>

      {/* ── Calendar Preview ── */}
      {previewDraftEvents.length > 0 && (
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

      {/* ── Applied Plans ── */}
      <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Lịch chăm sóc đã áp dụng ({plan.applies?.length ?? 0})
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-slate-400">
              Thông tin các lần kế hoạch này được áp dụng
            </p>
          </div>
          {(plan.successApplyCount ?? 0) > 0 || (plan.failedApplyCount ?? 0) > 0 ? (
            <div className="flex items-center gap-3">
              {(plan.successApplyCount ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-200">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {plan.successApplyCount} thành công
                </span>
              )}
              {(plan.failedApplyCount ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-200">
                  <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {plan.failedApplyCount} thất bại
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {!plan.applies || plan.applies.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
              Chưa có lần áp dụng nào cho kế hoạch này.
            </p>
          ) : (
            [...plan.applies].reverse().map((app, idx) => (
              <Link 
                key={app.id} 
                to={ROUTES.DASHBOARD.PLAN_APPLY_DETAIL(app.id)}
                className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:shadow-md hover:border-[#245A34]/30 transition-all cursor-pointer"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#245A34]/10 text-[#245A34] text-xs font-black">
                      {plan.applies!.length - idx}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900">
                          Áp dụng vào ngày {formatDate(app.startDate)}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black border ${STATUS_STYLE[app.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {TREATMENT_STATUS_LABELS[app.status] ?? app.status}
                        </span>
                        {app.trackingGranularity && app.trackingGranularity !== "NONE" && (
                          <span className="rounded-full bg-slate-200/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
                            Theo dõi: {app.trackingGranularity}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          Bắt đầu: {formatDate(app.startDate)}
                        </span>
                        {app.targetName && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            Phạm vi: {app.targetName}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Leaf className="h-3.5 w-3.5 text-slate-400" />
                          Sinh ra {app.plantEventIds?.length ?? 0} sự kiện
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Tạo lúc: {formatDate(app.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
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

      {selectedDoc && (
        <SourceDocumentModal
          sourceDocument={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

export default PlanDetailPage;
