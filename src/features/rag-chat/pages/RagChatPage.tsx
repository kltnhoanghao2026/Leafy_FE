import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  ArrowRight,
  Bot,
  BookOpenText,
  Clock3,
  FlaskConical,
  Globe,
  Link2,
  LoaderCircle,
  MessageCircle,
  RefreshCcw,
  SendHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  deleteRagConversation,
  getRagConversation,
  listRagConversations,
  streamRagChat,
} from "../api/ragChat.api";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../lib/routes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  RagChatResponse,
  RagConversationMessage,
  RagConversationSummary,
  RagDocument,
  RagWebResult,
} from "../types";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  response?: RagChatResponse;
  ragState?: string;
  currentNode?: string;
  step?: number;
  isStreaming?: boolean;
}

const INITIAL_ASSISTANT_MESSAGE =
  "Xin chào. Tôi là trợ lý RAG của Leafy. Hãy đặt câu hỏi về bệnh cây, chăm sóc và quy trình trị liệu.";

const QUICK_PROMPTS = [
  "Dấu hiệu nhận biết bệnh rỉ sắt trên lá cà phê?",
  "Lịch tưới và bón phân phù hợp cho cà phê mùa khô",
  "Các bước xử lý khi phát hiện nấm hồng",
  "Tổng hợp quy trình phòng bệnh theo tuần",
];

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

const getReadableNodeName = (node?: string) => {
  if (!node || node === "-") return "-";
  return NODE_NAMES[node] || node;
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

const getReadableStateName = (state?: string) => {
  if (!state) return STATE_NAMES.idle;
  return STATE_NAMES[state] || state;
};


const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createAssistantMessage = (text: string): ChatMessage => ({
  id: createId(),
  role: "assistant",
  text,
  createdAt: Date.now(),
});

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const safeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const formatConversationTime = (iso: string): string => {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return "";
  }

  return new Date(parsed).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toTimestamp = (iso: string): number => {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const mapConversationMessageToChatMessage = (
  message: RagConversationMessage,
): ChatMessage => {
  const isAssistant = message.role === "assistant";
  return {
    id: message.messageId,
    role: message.role,
    text: message.text,
    createdAt: toTimestamp(message.createdAt),
    ragState: message.pipeline?.ragState,
    currentNode: message.pipeline?.currentNode,
    step: message.pipeline?.step,
    isStreaming: false,
    // Reconstruct a minimal response so the sidebar widgets (treatmentPlan,
    // savedPlanId) re-hydrate when a historical conversation is loaded.
    response: isAssistant
      ? {
          answer: message.text,
          threadId: "",
          documents: [],
          webSearchResults: [],
          plan: message.responseMeta?.plan ?? null,
          savedPlanId: message.responseMeta?.savedPlanId,
        }
      : undefined,
  };
};

const readDocumentLabel = (doc: RagDocument, index: number): string => {
  return (
    safeString(doc.title) ??
    safeString(doc.source) ??
    safeString(doc.file_name) ??
    safeString(doc.fileName) ??
    safeString(doc.url) ??
    `Nguồn ${index + 1}`
  );
};

const readDocumentSnippet = (doc: RagDocument): string => {
  return (
    safeString(doc.content) ??
    safeString(doc.page_content) ??
    safeString(doc.pageContent) ??
    safeString(doc.text) ??
    "Không có nội dung xem trước."
  );
};

const readWebLabel = (result: RagWebResult, index: number): string => {
  return (
    safeString(result.title) ??
    safeString(result.source) ??
    safeString(result.url) ??
    `Web ${index + 1}`
  );
};

const readWebUrl = (result: RagWebResult): string | undefined => {
  return safeString(result.url) ?? safeString(result.link);
};

// ── Treatment Plan helpers ──────────────────────────────────────────────────

type JsonRecord = Record<string, unknown>;

const asPlanRecord = (v: unknown): JsonRecord =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as JsonRecord) : {};

const asPlanString = (v: unknown): string =>
  typeof v === "string" ? v.trim() : "";

const asPlanNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

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



export function RagChatPage() {
  const navigate = useNavigate();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [conversationList, setConversationList] = useState<
    RagConversationSummary[]
  >([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(
    null,
  );

  const [threadId, setThreadId] = useState<string | null>(null);
  const [language, setLanguage] = useState("Vietnamese");
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createAssistantMessage(INITIAL_ASSISTANT_MESSAGE),
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const lastAssistantResponse = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant" && messages[i].response) {
        return messages[i].response;
      }
    }

    return undefined;
  }, [messages]);

  const latestDocuments = lastAssistantResponse?.documents ?? [];
  const latestWebResults = lastAssistantResponse?.webSearchResults ?? [];
  const latestTreatmentPlan = lastAssistantResponse?.plan ?? null;
  const latestSavedPlanId = lastAssistantResponse?.savedPlanId;

  const streamingAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role === "assistant" && message.isStreaming) {
        return message;
      }
    }
    return null;
  }, [messages]);

  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  const updateMessageById = useCallback(
    (messageId: string, updater: (message: ChatMessage) => ChatMessage) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? updater(message) : message,
        ),
      );
    },
    [],
  );

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setConversationError(null);
    try {
      const data = await listRagConversations();
      setConversationList(data);
      return data;
    } catch (error) {
      const fallback = "Không thể tải danh sách hội thoại.";
      const message =
        error instanceof Error ? error.message || fallback : fallback;
      setConversationError(message);
      return [] as RagConversationSummary[];
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [question]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isSubmitting) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      text: trimmedQuestion,
      createdAt: Date.now(),
    };

    const assistantMessageId = createId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      createdAt: Date.now(),
      ragState: "started",
      currentNode: "START",
      step: 0,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setQuestion("");
    setIsSubmitting(true);

    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    let completedResponse: RagChatResponse | null = null;
    let resolvedThreadId = threadId;
    let resolvedConversationId: string | null = null;

    try {
      const response = await streamRagChat(
        {
          question: trimmedQuestion,
          threadId,
          language,
        },
        {
          onState: (state) => {
            updateMessageById(assistantMessageId, (message) => ({
              ...message,
              ragState: state.ragState ?? message.ragState,
              currentNode: state.currentNode ?? message.currentNode,
              step: state.step ?? message.step,
              isStreaming: true,
            }));
          },
          onChunk: (chunk, payload) => {
            updateMessageById(assistantMessageId, (message) => ({
              ...message,
              text: `${message.text}${chunk}`,
              ragState: payload.ragState ?? message.ragState,
              currentNode: payload.currentNode ?? message.currentNode,
              step: payload.step ?? message.step,
              isStreaming: true,
            }));
          },
          onCompleted: (result, conversationId) => {
            completedResponse = result;
            resolvedThreadId = result.threadId || resolvedThreadId;
            updateMessageById(assistantMessageId, (message) => ({
              ...message,
              text:
                result.answer ||
                message.text ||
                "Tôi chưa có đủ thông tin để trả lời câu hỏi này.",
              response: result,
              ragState: "completed",
              currentNode: "END",
              isStreaming: false,
            }));
            // Set activeConversationId immediately from completed event
            if (conversationId) {
              resolvedConversationId = conversationId;
              setActiveConversationId(conversationId);
            }
          },
        },
        {
          signal: abortController.signal,
        },
      );

      completedResponse = completedResponse ?? response;
      resolvedThreadId = response.threadId || resolvedThreadId;

      if (resolvedThreadId) {
        setThreadId(resolvedThreadId);
      }

      // Background refresh — update conversation list; fallback to matching by threadId
      void loadConversations().then((conversations) => {
        if (resolvedThreadId && !resolvedConversationId) {
          const matched = conversations.find(
            (conversation) => conversation.threadId === resolvedThreadId,
          );
          if (matched) {
            setActiveConversationId(matched.conversationId);
          }
        }
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        updateMessageById(assistantMessageId, (message) => ({
          ...message,
          text: message.text || "Đã dừng phản hồi.",
          ragState: "aborted",
          currentNode: message.currentNode ?? "ABORT",
          isStreaming: false,
        }));
      } else {
        const fallback = "Đã xảy ra lỗi khi gọi rag-service. Vui lòng thử lại.";
        const text =
          error instanceof Error ? error.message || fallback : fallback;

        updateMessageById(assistantMessageId, (message) => ({
          ...message,
          text: text || message.text,
          ragState: "error",
          currentNode: "ERROR",
          isStreaming: false,
        }));
      }
    } finally {
      if (completedResponse && completedResponse.threadId) {
        setThreadId(completedResponse.threadId);
      }
      streamAbortRef.current = null;
      setIsSubmitting(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (isSubmitting) {
      return;
    }

    setIsLoadingConversation(true);
    setConversationError(null);

    try {
      const detail = await getRagConversation(conversationId);
      setActiveConversationId(detail.conversationId);
      setThreadId(detail.threadId);
      setMessages(
        detail.messages.length > 0
          ? detail.messages.map(mapConversationMessageToChatMessage)
          : [createAssistantMessage(INITIAL_ASSISTANT_MESSAGE)],
      );
    } catch (error) {
      const fallback = "Không thể tải hội thoại đã chọn.";
      const message =
        error instanceof Error ? error.message || fallback : fallback;
      setConversationError(message);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xoá hội thoại này?");
    if (!confirmed) {
      return;
    }

    // Optimistic remove from list
    const previousList = conversationList;
    setConversationList((prev) =>
      prev.filter((c) => c.conversationId !== conversationId),
    );

    let wasActive = false;
    if (activeConversationId === conversationId) {
      wasActive = true;
      setActiveConversationId(null);
      setThreadId(null);
      setMessages([createAssistantMessage(INITIAL_ASSISTANT_MESSAGE)]);
    }

    try {
      await deleteRagConversation(conversationId);
      // Silently sync list in background after confirmed delete
      void loadConversations();
    } catch (error) {
      // Rollback on error
      setConversationList(previousList);
      if (wasActive) {
        setActiveConversationId(conversationId);
      }
      const fallback = "Không thể xoá hội thoại.";
      const message =
        error instanceof Error ? error.message || fallback : fallback;
      setConversationError(message);
    }
  };

  const handleStopStreaming = () => {
    streamAbortRef.current?.abort();
  };

  const handleQuickPrompt = (prompt: string) => {
    setQuestion(prompt);
    textareaRef.current?.focus();
  };

  const handleResetConversation = () => {
    streamAbortRef.current?.abort();
    setActiveConversationId(null);
    setThreadId(null);
    setQuestion("");
    setMessages([createAssistantMessage(INITIAL_ASSISTANT_MESSAGE)]);
  };

  const handleQuestionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const pipelineStateForUi = streamingAssistantMessage ?? lastAssistantMessage;

  return (
    <div className="w-full max-w-368 mx-auto space-y-6 animate-in fade-in duration-500">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-r from-emerald-50 via-lime-50 to-emerald-100 px-5 py-5 lg:px-6 lg:py-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-emerald-200/40 blur-xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[11px] font-extrabold tracking-[0.12em] text-emerald-700 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Trợ lý ảo AI
            </p>
            <h2 className="text-xl lg:text-2xl font-extrabold text-emerald-950 tracking-tight">
              Tư vấn Nông nghiệp thông minh
            </h2>
            <p className="max-w-2xl text-sm text-emerald-900/80">
              Nhận kết quả chẩn đoán bệnh, quy trình điều trị và hướng dẫn chăm sóc cây trồng từ chuyên gia AI.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs font-semibold text-emerald-800">
              Ngôn ngữ:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="Vietnamese">Vietnamese</option>
              <option value="English">English</option>
            </select>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
              Thread: {threadId ?? "new-session"}
            </span>
            <button
              type="button"
              onClick={handleResetConversation}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Phiên mới
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-3 rounded-3xl border border-slate-200 bg-white shadow-sm p-4 lg:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Hội thoại đã lưu
            </h3>
            <button
              type="button"
              onClick={() => void loadConversations()}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Làm mới
            </button>
          </div>

          {isLoadingConversations && (
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Đang tải danh sách...
            </div>
          )}

          {conversationError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {conversationError}
            </p>
          )}

          <div className="space-y-2 max-h-120 overflow-y-auto pr-1">
            {conversationList.length === 0 && !isLoadingConversations && (
              <p className="text-sm text-slate-500">
                Chưa có hội thoại nào được lưu.
              </p>
            )}

            {conversationList.map((conversation) => {
              const isActive =
                activeConversationId === conversation.conversationId;
              return (
                <article
                  key={conversation.conversationId}
                  className={`rounded-2xl border p-3 cursor-pointer transition-colors ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  onClick={() =>
                    void handleSelectConversation(conversation.conversationId)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 line-clamp-2">
                      {conversation.title}
                    </p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteConversation(
                          conversation.conversationId,
                        );
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                    {conversation.preview}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{conversation.messageCount} tin nhắn</span>
                    <span>
                      {formatConversationTime(conversation.updatedAt)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="xl:col-span-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-140 overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 lg:px-5 flex items-center justify-between gap-2 bg-white">
            <p className="text-sm font-bold text-slate-700 inline-flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              Hỏi đáp với rag-service
            </p>
            <div className="flex items-center gap-2">
              {isSubmitting && streamAbortRef.current && (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Dừng stream
                </button>
              )}
              <p className="text-xs text-slate-500">
                Enter để gửi, Shift + Enter để xuống dòng
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-5 space-y-4 bg-linear-to-b from-slate-50 to-white">
            {isLoadingConversation && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <LoaderCircle className="w-4 h-4 animate-spin" />
                Đang tải hội thoại...
              </div>
            )}

            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${
                  message.role === "user"
                    ? "ml-auto bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-800 border-slate-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === "assistant" && (
                    <Bot className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm prose-emerald max-w-none break-words">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.text || (message.isStreaming ? "..." : "")}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {message.text || (message.isStreaming ? "..." : "")}
                      </p>
                    )}
                    <div
                      className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${
                        message.role === "user"
                          ? "text-emerald-100"
                          : "text-slate-500"
                      }`}
                    >
                      <span>
                        {message.role === "user" ? "Bạn" : "Trợ lý AI"} •{" "}
                        {formatTime(message.createdAt)}
                      </span>
                      {message.role === "assistant" && message.ragState && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {getReadableStateName(message.ragState)}
                          {message.currentNode && message.currentNode !== "END"
                            ? ` · ${getReadableNodeName(message.currentNode)}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <div ref={bottomRef} />
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="border-t border-slate-100 p-4 lg:p-5 space-y-3 bg-white"
          >
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleQuestionKeyDown}
                rows={3}
                placeholder="Nhập câu hỏi, ví dụ: Các bước xử lý bệnh rỉ sắt trên lá cà phê là gì?"
                className="flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                disabled={isSubmitting || question.trim().length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
              >
                {isSubmitting ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
                Gửi
              </button>
            </div>
          </form>
        </section>

        <aside className="xl:col-span-3 space-y-4">
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 lg:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-900 inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Trạng thái pipeline
            </h3>
            <div className="mt-3 space-y-2 text-sm text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold w-24">RAG State:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {pipelineStateForUi?.ragState === "running" || pipelineStateForUi?.ragState === "streaming_response" ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  ) : null}
                  {getReadableStateName(pipelineStateForUi?.ragState)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-24">Current node:</span>
                <span className="text-emerald-900 bg-white/60 px-2 py-0.5 rounded text-xs font-medium">
                  {getReadableNodeName(pipelineStateForUi?.currentNode)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 lg:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 inline-flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-emerald-700" />
              Tài liệu tham khảo
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {latestDocuments.length === 0 && (
                <p className="text-sm text-slate-500">
                  Chưa có tài liệu cho câu trả lời gần nhất.
                </p>
              )}

              {latestDocuments.map((doc, index) => (
                <article
                  key={`doc-${index}`}
                  className="rounded-2xl border border-slate-100 p-3 bg-slate-50"
                >
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {readDocumentLabel(doc, index)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-4">
                    {readDocumentSnippet(doc)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 lg:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 inline-flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-700" />
              Nguồn web
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {latestWebResults.length === 0 && (
                <p className="text-sm text-slate-500">
                  Không có kết quả web bổ sung.
                </p>
              )}

              {latestWebResults.map((result, index) => {
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
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        {label}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-slate-700">
                        {label}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          {latestTreatmentPlan && (() => {
            const plan = asPlanRecord(latestTreatmentPlan);
            const diseaseName = asPlanString(plan.diseaseName) || "Treatment Plan";
            const severity = asPlanString(plan.severityLevel).toUpperCase();
            const urgency = asPlanString(plan.urgency).toUpperCase();
            const confidence = asPlanNumber(plan.confidenceScore);

            return (
              <div
                onClick={() => {
                  if (latestSavedPlanId) {
                    navigate(ROUTES.DASHBOARD.RAG_PLAN(latestSavedPlanId));
                  }
                }}
                className={`rounded-3xl border border-violet-200 bg-violet-50 p-4 lg:p-5 shadow-sm transition-all ${
                  latestSavedPlanId ? "cursor-pointer hover:bg-violet-100 hover:shadow-md" : "opacity-80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg shrink-0">
                    <FlaskConical className="h-5 w-5 text-violet-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-violet-900 leading-tight mb-1">
                      {diseaseName}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-2">
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
                            URGENCY_STYLES[urgency] ||
                            "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {urgency}
                        </span>
                      )}
                    </div>
                    {typeof confidence === "number" && (
                      <div className="mb-2 max-w-[150px]">
                        <div className="flex items-center justify-between text-[10px] text-violet-700 mb-0.5">
                          <span>Tin cậy ban đầu</span>
                          <span className="font-bold">{Math.round(confidence * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-violet-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500 transition-all duration-500"
                            style={{ width: `${Math.round(confidence * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <span className="text-xs font-semibold text-violet-600 flex items-center gap-1 group-hover:text-violet-800">
                      Xem chi tiết phác đồ <ArrowRight className="h-3 w-3 inline" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}

export default RagChatPage;
