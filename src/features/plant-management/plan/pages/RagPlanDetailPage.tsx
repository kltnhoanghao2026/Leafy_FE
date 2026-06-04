import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";
import { PlanPreviewCalendar } from "../../../consulting/components/PlanPreviewCalendar";
import { ROUTES } from "../../../../lib/routes";
import { useRagPlan } from "../queries/rag-plan.queries";
import { useCreatePlan } from "../..";
import type {
  EmbeddedPlanEventResponse,
  PlantEventCreateRequest,
  PlanCreateRequest,
  RagPlanResponse,
  RagPlanSourceDocument,
  SourceDocument,
} from "../../shared/types";
import { formatDate } from "../../shared/components/displayUtils";
import { EmbeddedEventList } from "../components/EmbeddedEventList";
import { SourceDocumentModal } from "../components/SourceDocumentModal";
import { PageErrorState } from "../../../../components/ui/PageErrorState";
import { getTodayDateOnly } from "../../shared/utils/dateOnly";

const SEVERITY_COLOR: Record<string, string> = {
  LOW: "text-green-600 bg-green-50",
  MEDIUM: "text-amber-600 bg-amber-50",
  HIGH: "text-orange-600 bg-orange-50",
  CRITICAL: "text-red-600 bg-red-50",
};

interface RagPlanDetailViewModel {
  planId: string;
  plantManagementPlanId: string | null;
  planName: string | null;
  diseaseName: string | null;
  confidenceScore: number | null;
  severityLevel: string | null;
  estimatedCost: string | null;
  requiredInputs: string[];
  safetyWarnings: string[];
  successIndicators: string | null;
  schedule: NonNullable<RagPlanResponse["plan"]>["schedule"] extends infer T
    ? T extends Array<infer Item>
      ? Item[]
      : []
    : [];
  sourceDocuments: RagPlanSourceDocument[];
  webSearchResults: NonNullable<RagPlanResponse["webSearchResults"]>;
  source: string | null;
  createdAt: string | null;
  lastModifiedAt: string | null;
}

function toViewModel(data: RagPlanResponse): RagPlanDetailViewModel {
  const nestedPlan = data.plan;
  return {
    planId: data.planId,
    plantManagementPlanId: data.plantManagementPlanId,
    planName: nestedPlan?.planName ?? null,
    diseaseName: nestedPlan?.diseaseName ?? data.diseaseName ?? null,
    confidenceScore: nestedPlan?.confidenceScore ?? null,
    severityLevel: nestedPlan?.severityLevel ?? data.severityLevel ?? null,
    estimatedCost: nestedPlan?.estimatedCost ?? null,
    requiredInputs: nestedPlan?.requiredInputs ?? [],
    safetyWarnings: nestedPlan?.safetyWarnings ?? [],
    successIndicators: nestedPlan?.successIndicators ?? null,
    schedule: nestedPlan?.schedule ?? [],
    sourceDocuments: data.sourceDocuments ?? [],
    webSearchResults: data.webSearchResults ?? [],
    source: nestedPlan?.source ?? data.source ?? null,
    createdAt: data.createdAt,
    lastModifiedAt: data.lastModifiedAt,
  };
}

function mapScheduleToPreviewEvents(
  schedule: RagPlanDetailViewModel["schedule"],
): PlantEventCreateRequest[] {
  return schedule.map((event) => ({
    eventType: event.eventType as PlantEventCreateRequest["eventType"],
    note: event.note ?? "",
    description: event.description ?? undefined,
    daysFromStart: event.daysFromStart ?? 0,
    durationDays: event.durationDays ?? undefined,
    phiDays: event.phiDays ?? undefined,
    ppeRequired: event.ppeRequired ?? undefined,
    mrlNote: event.mrlNote ?? undefined,
    estimatedCost: event.estimatedCost ?? undefined,
  }));
}

function mapScheduleToEmbeddedEvents(
  schedule: RagPlanDetailViewModel["schedule"],
): EmbeddedPlanEventResponse[] {
  return schedule.map((event) => {
    const tasks: EmbeddedPlanEventResponse["tasks"] = event.tasks
      ? event.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          order: task.order,
          estimatedCost: task.estimatedCost,
          completed: Boolean(task.completed),
        }))
      : null;

    return {
      eventType: event.eventType as EmbeddedPlanEventResponse["eventType"],
      targetType: (event.targetType as EmbeddedPlanEventResponse["targetType"]) ?? null,
      note: event.note,
      description: event.description,
      daysFromStart: event.daysFromStart,
      durationDays: event.durationDays,
      phiDays: event.phiDays,
      ppeRequired: event.ppeRequired,
      mrlNote: event.mrlNote,
      estimatedCost: event.estimatedCost,
      tasks,
    };
  });
}

function SourceDocRow({ doc, onClick }: { doc: RagPlanSourceDocument; onClick: () => void }) {
  const previewContent = doc.content ?? doc.pageContent;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition-all hover:border-[#245A34]/40 hover:bg-green-50/40"
    >
      <p className="mb-1 text-sm font-bold text-slate-800">{doc.title || "Tài liệu"}</p>
      {previewContent ? (
        <p className="line-clamp-2 text-xs text-slate-500">{previewContent}</p>
      ) : (
        <p className="line-clamp-2 text-xs italic text-slate-400">Bấm để xem chi tiết nội dung</p>
      )}
      {doc.url && <p className="mt-2 truncate font-mono text-[10px] text-slate-400">{doc.url}</p>}
    </button>
  );
}

export function RagPlanDetailPage() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();

  const planQuery = useRagPlan(planId);
  const ragPlan = planQuery.data;

  const [selectedDoc, setSelectedDoc] = useState<RagPlanSourceDocument | null>(null);
  const [startDate, setStartDate] = useState<string>(getTodayDateOnly());
  const { mutateAsync: savePlan, isPending: isSaving } = useCreatePlan();

  const detail = useMemo(() => (ragPlan ? toViewModel(ragPlan) : null), [ragPlan]);

  const previewDraftEvents = useMemo(
    () => (detail ? mapScheduleToPreviewEvents(detail.schedule) : []),
    [detail],
  );

  const embeddedEvents = useMemo(
    () => (detail ? mapScheduleToEmbeddedEvents(detail.schedule) : []),
    [detail],
  );

  const handleSaveToMyPlans = async () => {
    if (!detail) return;
    const payload: PlanCreateRequest = {
      diseaseName: detail.diseaseName ?? "",
      planName: detail.planName ?? undefined,
      source: detail.source === "websearch" ? "websearch" : "documents",
      sourceType: "RAG_GEN",
      confidenceScore: detail.confidenceScore ?? undefined,
      severityLevel: detail.severityLevel ?? undefined,
      requiredInputs: detail.requiredInputs.length > 0 ? detail.requiredInputs : undefined,
      safetyWarnings: detail.safetyWarnings.length > 0 ? detail.safetyWarnings : undefined,
      successIndicators: detail.successIndicators ?? undefined,
      estimatedCost: detail.estimatedCost ?? undefined,
      isPublic: false,
      sourceDocuments: detail.sourceDocuments.map((doc): SourceDocument => ({
        title: doc.title,
        pageContent: doc.pageContent ?? doc.content ?? "",
        url: doc.url,
        pointId: doc.pointId,
        metadata: doc.metadata,
      })),
      webSearchResults: detail.webSearchResults.map((result) => ({
        title: result.title ?? "",
        url: result.url ?? "",
        content: result.content ?? "",
        score: result.score ?? 0,
      })),
      schedule: previewDraftEvents,
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
      <div className="rounded-4xl border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">
        Đang tải chi tiết kế hoạch AI...
      </div>
    );
  }

  if (planQuery.isError || !detail) {
    return (
      <PageErrorState
        title="Không tải được chi tiết kế hoạch AI."
        onRetry={() => void planQuery.refetch()}
      />
    );
  }

  const severityStyle = detail.severityLevel
    ? SEVERITY_COLOR[detail.severityLevel.toUpperCase()] ?? "text-slate-600 bg-slate-50"
    : "";
  const confidencePct = detail.confidenceScore != null ? Math.round(detail.confidenceScore * 100) : null;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <Link to={ROUTES.DASHBOARD.PLANS} className="inline-flex items-center text-sm font-bold text-[#245A34] hover:underline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại danh sách
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
              <Bot className="h-5 w-5 text-purple-700" />
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-slate-900">
              {detail.planName || detail.diseaseName || "Kế hoạch AI"}
            </h1>
          </div>
          {detail.diseaseName && detail.planName && detail.diseaseName !== detail.planName && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <FlaskConical className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
              Bệnh: {detail.diseaseName}
            </p>
          )}
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Tạo lúc {formatDate(detail.createdAt)}
            {detail.lastModifiedAt && detail.lastModifiedAt !== detail.createdAt && (
              <> · Cập nhật {formatDate(detail.lastModifiedAt)}</>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-700">
            <Bot className="mr-2 h-4 w-4" />
            Kế hoạch AI
          </span>
          {detail.plantManagementPlanId && (
            <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600">
              PM ID: {detail.plantManagementPlanId.slice(0, 8)}...
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <span className="text-sm font-bold text-slate-500">Bắt đầu từ:</span>
        <div className="w-48">
          <input
            type="date"
            value={startDate}
            min={getTodayDateOnly()}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-[#245A34] focus:outline-none focus:ring-2 focus:ring-[#245A34]/20"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSaveToMyPlans()}
          disabled={isSaving || detail.schedule.length === 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#245A34] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu vào kế hoạch của tôi
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-black text-slate-900">Thông tin chính</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {confidencePct != null && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Độ tin cậy</p>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-800">{confidencePct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${confidencePct}%` }} />
                    </div>
                  </div>
                </div>
              )}
              {detail.severityLevel && (
                <div className={`rounded-2xl p-4 ${severityStyle}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mức độ nghiêm trọng</p>
                  <p className="mt-1 text-sm font-black">{detail.severityLevel}</p>
                </div>
              )}
              {detail.estimatedCost && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <DollarSign className="h-3 w-3" strokeWidth={2.5} />Chi phí
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{detail.estimatedCost}</p>
                </div>
              )}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số sự kiện</p>
                <p className="mt-1 text-sm font-black text-slate-800">{detail.schedule.length}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-black text-slate-900">Vật tư & An toàn</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vật tư cần có</p>
                </div>
                {detail.requiredInputs.length > 0 ? (
                  <ul className="space-y-1">
                    {detail.requiredInputs.map((input, index) => (
                      <li key={`${input}-${index}`} className="flex items-start gap-1.5 text-sm font-semibold text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#245A34]" />
                        {input}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic font-semibold text-slate-400">Chưa cập nhật</p>
                )}
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Cảnh báo an toàn</p>
                </div>
                {detail.safetyWarnings.length > 0 ? (
                  <ul className="space-y-1">
                    {detail.safetyWarnings.map((warning, index) => (
                      <li key={`${warning}-${index}`} className="flex items-start gap-1.5 text-sm font-semibold text-red-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                        {warning}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic font-semibold text-red-400">Kiểm tra thực tế trước khi áp dụng.</p>
                )}
              </div>

              <div className="rounded-2xl bg-green-50 p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Dấu hiệu thành công</p>
                </div>
                <p className="text-sm font-semibold text-green-800">
                  {detail.successIndicators || <span className="italic text-green-400">Chưa cập nhật</span>}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-black text-slate-900">
              <Bot className="h-4 w-4 text-slate-400" strokeWidth={2} />
              Tài liệu & Nguồn tham khảo AI
            </h2>
            <div className="space-y-4 text-sm">
              {detail.sourceDocuments.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Tài liệu chuyên môn ({detail.sourceDocuments.length})
                  </h3>
                  <div className="space-y-2">
                    {detail.sourceDocuments.map((doc, idx) => (
                      <SourceDocRow key={doc.pointId ?? `${doc.title}-${idx}`} doc={doc} onClick={() => setSelectedDoc(doc)} />
                    ))}
                  </div>
                </div>
              )}

              {detail.webSearchResults.length > 0 && (
                <div>
                  <h3 className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    Tìm kiếm Web ({detail.webSearchResults.length})
                  </h3>
                  <div className="space-y-2">
                    {detail.webSearchResults.map((result, idx) => (
                      <a
                        key={`${result.url ?? result.title ?? "web"}-${idx}`}
                        href={result.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:border-indigo-100 hover:bg-indigo-50"
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-indigo-900 group-hover:underline">{result.title || "Kết quả tìm kiếm"}</p>
                          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        </div>
                        {result.content && <p className="line-clamp-2 text-xs text-slate-500">{result.content}</p>}
                        {result.url && <p className="mt-2 truncate font-mono text-[10px] text-slate-400">{result.url}</p>}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detail.sourceDocuments.length === 0 && detail.webSearchResults.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Nguồn nội bộ</p>
                  <p className="font-bold text-slate-700">{detail.source || <span className="italic text-slate-400">Không rõ</span>}</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-black text-slate-900">
              <Clock className="h-4 w-4 text-slate-400" strokeWidth={2} />
              Thông tin hệ thống
            </h2>
            <div className="space-y-2 text-sm">
              {[
                { label: "RAG Plan ID", value: detail.planId },
                { label: "Plant Mgmt ID", value: detail.plantManagementPlanId },
                { label: "Ngày tạo", value: formatDate(detail.createdAt) },
                { label: "Cập nhật lần cuối", value: formatDate(detail.lastModifiedAt) },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="shrink-0 font-semibold text-slate-400">{label}</span>
                    <span className="truncate text-right text-xs font-bold text-slate-700">{value}</span>
                  </div>
                ) : null,
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-base font-black text-slate-900">Lịch trình (Bản mẫu) ({detail.schedule.length})</h2>
        <p className="mb-5 text-sm font-semibold text-slate-400">Các sự kiện mẫu được định nghĩa sẵn trong kế hoạch này</p>
        <EmbeddedEventList events={embeddedEvents} />
      </section>

      {previewDraftEvents.length > 0 && (
        <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                <CalendarDays className="h-4 w-4 text-slate-400" strokeWidth={2} />
                Xem lịch kế hoạch
              </h2>
              <p className="mt-0.5 text-sm font-semibold text-slate-400">
                Hiển thị các sự kiện của kế hoạch với ngày khởi điểm là ngày bạn chọn
              </p>
            </div>
          </div>
          <div className="h-[540px]">
            <PlanPreviewCalendar draftEvents={previewDraftEvents} baseDate={new Date(startDate)} />
          </div>
        </section>
      )}

      {selectedDoc && (
        <SourceDocumentModal
          sourceDocument={{
            title: selectedDoc.title,
            pageContent: selectedDoc.pageContent ?? selectedDoc.content ?? "",
            url: selectedDoc.url,
            pointId: selectedDoc.pointId,
            metadata: selectedDoc.metadata,
          }}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
