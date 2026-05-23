import type { FormEvent, KeyboardEvent, RefObject } from "react";
import {
  ArrowUp,
  Bot,
  ChevronDown,
  ClipboardList,
  Info,
  LoaderCircle,
  MessageCircle,
  RefreshCcw,
  Search,
  Sparkles,
  Square,
  Zap,
} from "lucide-react";
import type { FarmPlotResponse, FarmZoneResponse } from "../../farm-management/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RagRoute } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  ragState?: string;
  currentNode?: string;
  step?: number;
  pathType?: string;
  isStreaming?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

const formatTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12 bg-linear-to-b from-slate-50/60 to-white">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 shadow-sm">
        <Bot className="w-7 h-7 text-emerald-500" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">Trợ lý AI Nông nghiệp</h3>
      <p className="text-xs text-slate-500 max-w-55 leading-relaxed">
        Đặt câu hỏi về bệnh cây, chăm sóc hoặc quy trình điều trị.
      </p>
    </div>
  );
}

// ── Streaming indicator ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RagChatAreaProps {
  messages: ChatMessage[];
  isLoadingConversation: boolean;
  isSubmitting: boolean;
  question: string;
  language: string;
  threadId: string | null;
  formRef: RefObject<HTMLFormElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  bottomRef: RefObject<HTMLDivElement | null>;
  isInfoOpen: boolean;
  // Farm context
  plots: FarmPlotResponse[];
  zones: FarmZoneResponse[];
  selectedPlotId: string | null;
  selectedZoneId: string | null;
  isLoadingPlots: boolean;
  isLoadingZones: boolean;
  onPlotChange: (plotId: string | null) => void;
  onZoneChange: (zoneId: string | null) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onQuestionChange: (val: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onStopStreaming: () => void;
  onLanguageChange: (lang: string) => void;
  onResetConversation: () => void;
  onToggleInfo: () => void;
  selectedRoute: RagRoute;
  onRouteChange: (route: RagRoute) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RagChatArea({
  messages,
  isLoadingConversation,
  isSubmitting,
  question,
  language,
  threadId,
  formRef,
  textareaRef,
  bottomRef,
  isInfoOpen,
  onSubmit,
  onQuestionChange,
  onKeyDown,
  onStopStreaming,
  onLanguageChange,
  onResetConversation,
  onToggleInfo,
  selectedRoute,
  onRouteChange,
}: RagChatAreaProps) {
  const hasRealMessages =
    messages.length > 1 ||
    (messages.length === 1 && messages[0].role === "user");

  const canSend = !isSubmitting && question.trim().length > 0;

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-gray-200/60 bg-white/95 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-slate-800 truncate">
            Tư vấn Nông nghiệp thông minh
          </span>
          {isSubmitting && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Đang xử lý
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-2.5 pr-6 py-1.5 text-[11px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="Vietnamese">VI</option>
              <option value="English">EN</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          </div>

          {/* Thread badge */}
          {threadId && (
            <span className="hidden sm:inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-mono font-semibold text-slate-500">
              #{threadId.slice(0, 6)}
            </span>
          )}

          {/* Stop streaming */}
          {isSubmitting && (
            <button
              type="button"
              onClick={onStopStreaming}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <Square className="w-3 h-3 fill-red-500" />
              Dừng
            </button>
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={onResetConversation}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="Phiên mới"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle info panel */}
          <button
            type="button"
            onClick={onToggleInfo}
            className={`p-1.5 rounded-lg transition-colors ${
              isInfoOpen
                ? "bg-emerald-100 text-emerald-700"
                : "text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
            }`}
            title="Thông tin pipeline & tài liệu"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      {hasRealMessages ? (
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-linear-to-b from-slate-50/40 to-white">
          {isLoadingConversation && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">
                <LoaderCircle className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                Đang tải hội thoại…
              </div>
            </div>
          )}

          {messages.map((message) =>
            message.role === "user" ? (
              /* User bubble */
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[80%]">
                  <div className="rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2.5 text-sm text-white shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  </div>
                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              /* Assistant bubble */
              <div key={message.id} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`rounded-2xl rounded-tl-sm border px-4 py-3 text-sm shadow-sm ${
                      message.isStreaming && !message.text
                        ? "bg-white border-slate-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {message.isStreaming && !message.text ? (
                      <TypingDots />
                    ) : (
                      <div className="prose prose-sm prose-emerald max-w-none wrap-break-word">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] text-slate-400">
                      {formatTime(message.createdAt)}
                    </p>
                    {message.pathType && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        message.pathType === 'fast' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                        message.pathType === 'deep' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                        message.pathType === 'planning' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                        'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        {message.pathType === 'fast' && <><Zap className="w-3 h-3" /> Nhanh</>}
                        {message.pathType === 'deep' && <><Search className="w-3 h-3" /> Chuyên sâu</>}
                        {message.pathType === 'planning' && <><ClipboardList className="w-3 h-3" /> Kế hoạch</>}
                      </span>
                    )}
                    {message.ragState && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {message.isStreaming && (message.ragState === "running" || message.ragState === "streaming_response") && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        {getReadableStateName(message.ragState)}
                        {message.currentNode && message.currentNode !== "END" && message.currentNode !== "START"
                          ? ` · ${getReadableNodeName(message.currentNode)}`
                          : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          <div ref={bottomRef} />
        </div>
      ) : (
        <EmptyState />
      )}

      {/* ── Input footer ── */}
      <div className="shrink-0 border-t border-gray-200/60 bg-white px-3 py-3">
        {/* Farm context selector row */}
        {/* <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <select
              value={selectedPlotId ?? ""}
              onChange={(e) => onPlotChange(e.target.value || null)}
              disabled={isLoadingPlots}
              className="bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none disabled:opacity-60 cursor-pointer min-w-0 max-w-35"
            >
              <option value="">{isLoadingPlots ? "Đang tải…" : "Tất cả vườn"}</option>
              {plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.code ? ` · ${p.code}` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedPlotId && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <select
                value={selectedZoneId ?? ""}
                onChange={(e) => onZoneChange(e.target.value || null)}
                disabled={isLoadingZones}
                className="bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none disabled:opacity-60 cursor-pointer min-w-0 max-w-35"
              >
                <option value="">{isLoadingZones ? "Đang tải…" : "Tất cả khu"}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zoneName}{z.zoneCode ? ` · ${z.zoneCode}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(selectedPlotId || selectedZoneId) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Ngữ cảnh đã chọn
            </span>
          )}
        </div> */}

        {/* Route selector row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap text-[11px] font-medium">
          <span className="text-slate-500 px-1">Chế độ:</span>
          
          <button
            type="button"
            onClick={() => onRouteChange("auto")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors border ${
              selectedRoute === "auto"
                ? "bg-slate-100 border-slate-300 text-slate-700"
                : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-3 h-3" /> Tự động
          </button>
          
          <button
            type="button"
            onClick={() => onRouteChange("fast")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors border ${
              selectedRoute === "fast"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-transparent text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
            title="Sử dụng mô hình Flash nhanh"
          >
            <Zap className="w-3 h-3" /> Nhanh
          </button>
          
          <button
            type="button"
            onClick={() => onRouteChange("deep")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors border ${
              selectedRoute === "deep"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-transparent text-slate-500 hover:bg-blue-50 hover:text-blue-700"
            }`}
            title="Tìm kiếm Web + Mô hình Pro"
          >
            <Search className="w-3 h-3" /> Chuyên sâu
          </button>
          
          <button
            type="button"
            onClick={() => onRouteChange("planner")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors border ${
              selectedRoute === "planner"
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : "bg-white border-transparent text-slate-500 hover:bg-purple-50 hover:text-purple-700"
            }`}
            title="Tạo phác đồ điều trị"
          >
            <ClipboardList className="w-3 h-3" /> Kế hoạch
          </button>
        </div>

        {/* Unified input card */}
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:shadow-md focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-200"
        >
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            placeholder="Nhập câu hỏi về bệnh cây, chăm sóc, hoặc quy trình điều trị…"
            className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            <span className="text-[10px] text-slate-400 select-none">
              Enter ↵ gửi &nbsp;·&nbsp; Shift+Enter xuống dòng
            </span>
            <button
              type="submit"
              disabled={!canSend}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                canSend
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title="Gửi (Enter)"
            >
              {isSubmitting ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
