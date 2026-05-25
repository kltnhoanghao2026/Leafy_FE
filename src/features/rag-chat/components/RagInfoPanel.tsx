import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Clock3,
  FlaskConical,
  Globe,
  Link2,
  X,
} from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import type { RagDocument, RagWebResult } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

type JsonRecord = Record<string, unknown>;

const safeStr = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
};

const asPlanRecord = (v: unknown): JsonRecord =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as JsonRecord) : {};

const asPlanString = (v: unknown): string =>
  typeof v === "string" ? v.trim() : "";

const asPlanNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const NODE_NAMES: Record<string, string> = {
  START: "Khởi tạo",
  END: "Hoàn tất",
  ERROR: "Lỗi xử lý",
  maybe_summarize: "Tóm tắt lịch sử",
  classify_intent: "Phân tích yêu cầu",
  direct: "Phản hồi trực tiếp",
  env_state: "Đọc dữ liệu môi trường",
  hybrid_search: "Tìm kiếm tài liệu",
  reranker: "Chọn lọc kết quả",
  router: "Định tuyến luồng",
  fast_gen: "Tạo phản hồi nhanh",
  web_search: "Tìm kiếm Web",
  web_search_plan: "Tìm kiếm Web",
  deep_gen: "Tạo phản hồi chuyên sâu",
  safety_audit: "Kiểm duyệt an toàn",
  refine: "Tinh chỉnh kết quả",
  planner: "Lập phác đồ điều trị",
};

const STATE_NAMES: Record<string, string> = {
  idle: "Sẵn sàng",
  started: "Đã bắt đầu",
  running: "Đang xử lý",
  streaming_response: "Đang phản hồi",
  completed: "Hoàn thành",
  error: "Lỗi",
  aborted: "Đã huỷ",
};

const getReadableNodeName = (node?: string) => {
  if (!node || node === "-") return "-";
  return NODE_NAMES[node] || node;
};

const getReadableStateName = (state?: string) => {
  if (!state) return STATE_NAMES.idle;
  return STATE_NAMES[state] || state;
};

const readDocumentLabel = (doc: RagDocument, index: number): string =>
  safeStr(doc.title) ??
  safeStr(doc.source) ??
  safeStr(doc.file_name) ??
  safeStr(doc.fileName) ??
  safeStr(doc.url) ??
  `Nguồn ${index + 1}`;

const readDocumentSnippet = (doc: RagDocument): string =>
  safeStr(doc.content) ??
  safeStr(doc.page_content) ??
  safeStr(doc.pageContent) ??
  safeStr(doc.text) ??
  "Không có nội dung xem trước.";

const readWebLabel = (result: RagWebResult, index: number): string =>
  safeStr(result.title) ??
  safeStr(result.source) ??
  safeStr(result.url) ??
  `Web ${index + 1}`;

const readWebUrl = (result: RagWebResult): string | undefined =>
  safeStr(result.url) ?? safeStr(result.link);

const SEVERITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const URGENCY_STYLES: Record<string, string> = {
  IMMEDIATE: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-white",
  NORMAL: "bg-slate-200 text-slate-700",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface PipelineState {
  ragState?: string;
  currentNode?: string;
  step?: number;
}

interface RagInfoPanelProps {
  pipelineState: PipelineState | null;
  documents: RagDocument[];
  webResults: RagWebResult[];
  treatmentPlans: Array<{ 
    plan: unknown; 
    savedPlanId?: string;
    documents?: RagDocument[];
    webResults?: RagWebResult[];
  }>;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RagInfoPanel({
  pipelineState,
  documents,
  webResults,
  treatmentPlans,
  onClose,
}: RagInfoPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="w-96 shrink-0 h-full border-l border-gray-200/60 bg-white flex flex-col z-10">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <span className="text-sm font-bold text-slate-800">Chi tiết & Tài liệu</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Đóng panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Pipeline state */}
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-2 mb-3">
            <Clock3 className="h-3.5 w-3.5" />
            Trạng thái pipeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-800 w-24 shrink-0">RAG State:</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                {(pipelineState?.ragState === "running" ||
                  pipelineState?.ragState === "streaming_response") && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
                {getReadableStateName(pipelineState?.ragState)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-800 w-24 shrink-0">Node hiện tại:</span>
              <span className="bg-white/70 px-2 py-0.5 rounded text-xs font-medium text-emerald-900">
                {getReadableNodeName(pipelineState?.currentNode)}
              </span>
            </div>
          </div>
        </section>

        {/* Reference docs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
            <BookOpenText className="h-3.5 w-3.5 text-emerald-600" />
            Tài liệu tham khảo
          </h3>
          {documents.length === 0 ? (
            <p className="text-xs text-slate-400">
              Chưa có tài liệu cho câu trả lời gần nhất.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {documents.map((doc, index) => (
                <article
                  key={`doc-${index}`}
                  className="rounded-xl border border-slate-100 p-3 bg-slate-50"
                >
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {readDocumentLabel(doc, index)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-3">
                    {readDocumentSnippet(doc)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Web results */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Globe className="h-3.5 w-3.5 text-emerald-600" />
            Nguồn web
          </h3>
          {webResults.length === 0 ? (
            <p className="text-xs text-slate-400">
              Không có kết quả web bổ sung.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {webResults.map((result, index) => {
                const url = readWebUrl(result);
                const label = readWebLabel(result, index);
                return (
                  <div
                    key={`web-${index}`}
                    className="rounded-xl border border-slate-100 p-3 bg-slate-50"
                  >
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        <Link2 className="w-3 h-3" />
                        {label}
                      </a>
                    ) : (
                      <p className="text-xs font-semibold text-slate-700">
                        {label}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Treatment plan cards */}
        {treatmentPlans && treatmentPlans.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
              <FlaskConical className="h-3.5 w-3.5 text-violet-600" />
              Kế hoạch trong hội thoại
            </h3>
            {treatmentPlans.map(({ plan, savedPlanId, documents: pDocs, webResults: pWebs }, index) => {
              const p = asPlanRecord(plan);
              const diseaseName = asPlanString(p.diseaseName) || "Treatment Plan";
              const severity = asPlanString(p.severityLevel).toUpperCase();
              const urgency = asPlanString(p.urgency).toUpperCase();
              const confidence = asPlanNumber(p.confidenceScore);
              const planDocs = pDocs || [];
              const planWebs = pWebs || [];

              return (
                <div
                  key={`plan-${index}`}
                  onClick={() => {
                    if (savedPlanId) {
                      navigate(ROUTES.DASHBOARD.RAG_PLAN(savedPlanId));
                    }
                  }}
                  className={`rounded-2xl border border-violet-200 bg-violet-50 p-4 transition-all ${
                    savedPlanId
                      ? "cursor-pointer hover:bg-violet-100 hover:shadow-md"
                      : "opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-violet-100 rounded-lg shrink-0">
                      <FlaskConical className="h-4 w-4 text-violet-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-violet-900 leading-tight mb-1">
                        {diseaseName}
                      </h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {severity && (
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                              SEVERITY_STYLES[severity] ||
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {severity}
                          </span>
                        )}
                        {urgency && (
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              URGENCY_STYLES[urgency] || "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {urgency}
                          </span>
                        )}
                      </div>
                      {typeof confidence === "number" && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-[10px] text-violet-700 mb-0.5">
                            <span>Tin cậy</span>
                            <span className="font-bold">
                              {Math.round(confidence * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-violet-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-500 transition-all duration-500"
                              style={{ width: `${Math.round(confidence * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <span className="text-[11px] font-semibold text-violet-600 flex items-center gap-1">
                        Xem chi tiết phác đồ{" "}
                        <ArrowRight className="h-3 w-3 inline" />
                      </span>
                    </div>
                  </div>
                  
                  {/* Plan specific sources */}
                  {(planDocs.length > 0 || planWebs.length > 0) && (
                    <div className="mt-4 pt-3 border-t border-violet-200/60 space-y-3">
                      {planDocs.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-violet-800 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                            <BookOpenText className="h-3 w-3" />
                            Tài liệu RAG
                          </h4>
                          <div className="space-y-1.5">
                            {planDocs.slice(0, 3).map((doc, dIdx) => (
                              <div key={dIdx} className="bg-white/60 rounded px-2 py-1.5 border border-violet-100">
                                <p className="text-[10px] font-bold text-violet-900 truncate">
                                  {readDocumentLabel(doc, dIdx)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {planWebs.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-violet-800 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                            <Globe className="h-3 w-3" />
                            Nguồn Web
                          </h4>
                          <div className="space-y-1.5">
                            {planWebs.slice(0, 3).map((result, wIdx) => {
                              const url = readWebUrl(result);
                              const label = readWebLabel(result, wIdx);
                              return (
                                <div key={wIdx} className="bg-white/60 rounded px-2 py-1.5 border border-violet-100">
                                  {url ? (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 hover:text-violet-900"
                                    >
                                      <Link2 className="w-2.5 h-2.5" />
                                      <span className="truncate">{label}</span>
                                    </a>
                                  ) : (
                                    <p className="text-[10px] font-semibold text-violet-700 truncate">
                                      {label}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
