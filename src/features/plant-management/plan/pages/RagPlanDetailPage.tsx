import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  LoaderCircle,
  Save,
  ShieldAlert,
  Webhook,
} from "lucide-react";
import { ROUTES } from "../../../../lib/routes";
import { useRagPlan } from "../queries/rag-plan.queries";
import { useCreatePlan } from "../queries/plan.queries";
import type {
  PlantEventCreateRequest,
  PlanCreateRequest,
  RagPlanScheduleEvent,
  RagPlanSourceDocument,
  RagPlanWebSearchResult,
} from "../../shared/types";
import { formatDate } from "../shared/utils/planUtils";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { PageErrorState } from "../../../../components/ui/PageErrorState";
import { getTodayDateOnly } from "../../shared/utils/dateOnly";
import { PlanPreviewCalendar } from "../../../consulting/components/PlanPreviewCalendar";

const SEVERITY_STYLES: Record<string, string> = {
  LOW:      "text-green-600 bg-green-50 border-green-200",
  MEDIUM:   "text-amber-600 bg-amber-50 border-amber-200",
  HIGH:     "text-orange-600 bg-orange-50 border-orange-200",
  CRITICAL: "text-red-600 bg-red-50 border-red-200",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  IRRIGATION: "bg-blue-100 text-blue-700",
  NUTRITION: "bg-lime-100 text-lime-700",
  WEED_CONTROL: "bg-yellow-100 text-yellow-700",
  PRUNING: "bg-orange-100 text-orange-700",
  SCOUTING: "bg-teal-100 text-teal-700",
  DISEASE_DETECTED: "bg-red-100 text-red-700",
  TREATMENT_APPLICATION: "bg-purple-100 text-purple-700",
  QUARANTINE: "bg-rose-100 text-rose-700",
  HEALTH_RECOVERY: "bg-emerald-100 text-emerald-700",
  PHENOLOGY: "bg-indigo-100 text-indigo-700",
  REPOT: "bg-cyan-100 text-cyan-700",
  HARVEST: "bg-amber-100 text-amber-700",
};

function getSeverityStyle(level: string | null) {
  const key = (level ?? "").toUpperCase();
  return SEVERITY_STYLES[key] ?? "text-slate-600 bg-slate-50 border-slate-200";
}

function getEventColor(type: string) {
  return EVENT_TYPE_COLORS[type] ?? "bg-slate-100 text-slate-600";
}

function ScheduleEventRow({ event }: { event: RagPlanScheduleEvent }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getEventColor(event.eventType)}`}>
          {event.eventType.replace(/_/g, " ")}
        </span>
        <h4 className="font-bold text-slate-800">{event.note || event.eventType}</h4>
        {event.daysFromStart != null && (
          <span className="ml-auto text-sm font-medium text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
            Ngày {event.daysFromStart}
          </span>
        )}
      </div>
      {event.description && <p className="text-sm text-slate-600 mb-3">{event.description}</p>}
      {(event.phiDays != null || event.ppeRequired || event.estimatedCost) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {event.phiDays != null && (
            <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-amber-700 font-semibold">
              PHI: {event.phiDays} ngày
            </span>
          )}
          {event.ppeRequired && (
            <span className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-slate-600">
              Bảo hộ: {event.ppeRequired}
            </span>
          )}
          {event.estimatedCost && (
            <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-emerald-700 font-semibold">
              Chi phí: {event.estimatedCost}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SourceDocRow({ doc }: { doc: RagPlanSourceDocument }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-[#245A34]/40 hover:bg-green-50/40 transition-all">
      <p className="font-bold text-slate-800 text-sm mb-1">{doc.title || "Tài liệu"}</p>
      {doc.content && (
        <p className="text-xs text-slate-500 line-clamp-2">{doc.content}</p>
      )}
      {doc.url && (
        <p className="text-[10px] text-slate-400 mt-2 truncate font-mono">{doc.url}</p>
      )}
    </div>
  );
}

function WebSearchRow({ result }: { result: RagPlanWebSearchResult }) {
  return (
    <a
      href={result.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-indigo-50 hover:border-indigo-100 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-bold text-indigo-900 text-sm group-hover:underline">{result.title || "Kết quả tìm kiếm"}</p>
        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
      </div>
      {result.content && (
        <p className="text-xs text-slate-500 line-clamp-2">{result.content}</p>
      )}
      {result.url && (
        <p className="text-[10px] text-slate-400 mt-2 truncate font-mono">{result.url}</p>
      )}
    </a>
  );
}

export function RagPlanDetailPage() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();
  const planQuery = useRagPlan(planId);
  const plan = planQuery.data;

  const [startDate, setStartDate] = useState<string>(getTodayDateOnly());
  const { mutateAsync: savePlan, isPending: isSaving } = useCreatePlan();

  const previewEvents = useMemo((): PlantEventCreateRequest[] => {
    if (!plan?.schedule) return [];
    return plan.schedule.map((ev) => ({
      eventType: ev.eventType,
      note: ev.note ?? "",
      description: ev.description ?? undefined,
      daysFromStart: ev.daysFromStart ?? 0,
      durationDays: ev.durationDays ?? undefined,
      phiDays: ev.phiDays ?? undefined,
      ppeRequired: ev.ppeRequired ?? undefined,
      mrlNote: ev.mrlNote ?? undefined,
      estimatedCost: ev.estimatedCost ?? undefined,
    }));
  }, [plan?.schedule]);

  const handleSaveToMyPlans = async () => {
    if (!plan) return;
    const payload: PlanCreateRequest = {
      diseaseName: plan.diseaseName ?? "",
      planName: plan.planName ?? undefined,
      source: "documents",
      sourceType: "RAG_GEN",
      confidenceScore: plan.confidenceScore ?? undefined,
      severityLevel: plan.severityLevel ?? undefined,
      requiredInputs: plan.requiredInputs ?? undefined,
      safetyWarnings: plan.safetyWarnings ?? undefined,
      successIndicators: plan.successIndicators ?? undefined,
      estimatedCost: plan.estimatedCost ?? undefined,
      isPublic: false,
      sourceDocuments: plan.sourceDocuments?.map((d) => ({
        title: d.title,
        pageContent: d.content ?? "",
        url: d.url,
        score: d.score,
      })),
      webSearchResults: plan.webSearchResults?.map((w) => ({
        title: w.title ?? "",
        url: w.url ?? "",
        content: w.content ?? "",
        score: w.score ?? 0,
      })),
      schedule: previewEvents,
    };
    try {
      const created = await savePlan(payload);
      if (created?.id) {
        navigate(ROUTES.DASHBOARD.PLAN_DETAIL(created.id));
      }
    } catch (err) {
      console.error("[RagPlanDetailPage] handleSaveToMyPlans error:", err);
    }
  };

  if (planQuery.isLoading) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
        <header className="flex items-center gap-4">
          <Link to={ROUTES.DASHBOARD.PLANS} className="inline-flex items-center text-sm font-bold text-[#245A34] hover:underline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </header>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8">
          <p className="text-sm font-bold text-slate-500">Đang tải chi tiết kế hoạch AI...</p>
        </div>
      </div>
    );
  }

  if (planQuery.isError || !plan) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
        <header className="flex items-center gap-4">
          <Link to={ROUTES.DASHBOARD.PLANS} className="inline-flex items-center text-sm font-bold text-[#245A34] hover:underline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </header>
        <PageErrorState
          title="Không tải được chi tiết kế hoạch AI."
          onRetry={() => void planQuery.refetch()}
        />
      </div>
    );
  }

  const confidence = plan.confidenceScore != null ? Math.round(plan.confidenceScore * 100) : null;

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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
              <Bot className="h-5 w-5 text-purple-700" />
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-slate-900">
              {plan.planName || plan.diseaseName || "Kế hoạch AI"}
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
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-700">
            <Bot className="mr-2 h-4 w-4" />
            Kế hoạch AI
          </span>
          {plan.plantManagementPlanId && (
            <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600">
              PM ID: {plan.plantManagementPlanId.slice(0, 8)}...
            </span>
          )}
        </div>
      </header>

      {/* ── Start date + Save toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <span className="text-sm font-bold text-slate-500">Bat dau tu:</span>
        <div className="w-48">
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            minDate={getTodayDateOnly()}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSaveToMyPlans()}
          disabled={isSaving || !plan.schedule || plan.schedule.length === 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#245A34] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1b432a] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Luu vao ke hoach cua toi
        </button>
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left col (2/3) */}
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* Key metrics */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4">Thông tin chính</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {confidence != null && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Độ tin cậy AI</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black text-slate-800">{confidence}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${confidence}%` }} />
                    </div>
                  </div>
                </div>
              )}
              {plan.severityLevel && (
                <div className={`rounded-2xl p-4 border ${getSeverityStyle(plan.severityLevel)}`}>
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
                <p className="mt-1 text-sm font-black text-slate-800">{plan.schedule?.length ?? 0}</p>
              </div>
            </div>
          </section>

          {/* Schedule */}
          {plan.schedule && plan.schedule.length > 0 && (
            <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" strokeWidth={2} />
                Lịch trình ({plan.schedule.length})
              </h2>
              <div className="space-y-3">
                {plan.schedule.map((event, idx) => (
                  <ScheduleEventRow key={idx} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Calendar preview */}
          {plan.schedule && plan.schedule.length > 0 && (
            <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-1">
                Xem trước lịch (từ ngày {startDate})
              </h2>
              <p className="mb-4 text-sm font-semibold text-slate-400">
                Lịch trình được tính từ ngày bạn chọn bên trên
              </p>
              <PlanPreviewCalendar draftEvents={previewEvents} baseDate={new Date(startDate)} />
            </section>
          )}

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
                  <p className="text-sm font-semibold text-red-400 italic">Không có cảnh báo</p>
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

          {/* AI source */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-slate-400" strokeWidth={2} />
              Tài liệu & Nguồn tham khảo
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
                      <SourceDocRow key={idx} doc={doc} />
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
                    {plan.webSearchResults.map((result, idx) => (
                      <WebSearchRow key={idx} result={result} />
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

          {/* Audit */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" strokeWidth={2} />
              Thông tin hệ thống
            </h2>
            <div className="space-y-2 text-sm">
              {[
                { label: "RAG Plan ID", value: plan.planId },
                { label: "Plant Mgmt ID", value: plan.plantManagementPlanId },
                { label: "Ngày tạo", value: formatDate(plan.createdAt) },
                { label: "Cập nhật lần cuối", value: formatDate(plan.lastModifiedAt) },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-400 font-semibold shrink-0">{label}</span>
                    <span className="font-bold text-slate-700 text-right truncate text-xs">{value}</span>
                  </div>
                ) : null,
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default RagPlanDetailPage;
