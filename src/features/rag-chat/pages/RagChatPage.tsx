import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  deleteRagConversation,
  getRagConversation,
  listRagConversations,
  streamRagChat,
} from "../api/ragChat.api";
import type {
  RagChatResponse,
  RagConversationMessage,
  RagConversationSummary,
  RagRoute,
} from "../types";
import { useSidebarCollapsed } from "../../../layouts/SidebarContext";
import { useAuthStore } from "../../../store/authStore";
import { useFarmPlots, useFarmZones } from "../../farm-management/queries";
import { RagConversationList } from "../components/RagConversationList";
import { RagChatArea } from "../components/RagChatArea";
import type { ChatMessage } from "../components/RagChatArea";
import { RagInfoPanel } from "../components/RagInfoPanel";
import { PageErrorState } from "../../../components/ui/PageErrorState";

// ── Local types ───────────────────────────────────────────────────────────────

// ChatMessage with response payload — extends base type from RagChatArea
interface RagPageMessage extends ChatMessage {
  response?: RagChatResponse;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_ASSISTANT_MESSAGE =
  "Xin chào. Tôi là trợ lý RAG của Leafy. Hãy đặt câu hỏi về bệnh cây, chăm sóc và quy trình trị liệu.";

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createAssistantMessage = (text: string): RagPageMessage => ({
  id: createId(),
  role: "assistant",
  text,
  createdAt: Date.now(),
});

const toTimestamp = (iso: string): number => {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const mapConversationMessageToChatMessage = (
  message: RagConversationMessage,
): RagPageMessage => {
  const isAssistant = message.role === "assistant";
  return {
    id: message.messageId,
    role: message.role,
    text: message.text,
    createdAt: toTimestamp(message.createdAt),
    ragState: message.pipeline?.ragState,
    currentNode: message.pipeline?.currentNode,
    step: message.pipeline?.step,
    pathType: message.pipeline?.pathType,
    isStreaming: false,
    response: isAssistant
      ? {
          answer: message.text,
          threadId: "",
          documents: (message.responseMeta?.documents ?? []) as RagChatResponse["documents"],
          webSearchResults: (message.responseMeta?.webResults ?? []) as RagChatResponse["webSearchResults"],
          plan: message.responseMeta?.plan ?? null,
          savedPlanId: message.responseMeta?.savedPlanId,
        }
      : undefined,
  };
};

export function RagChatPage() {
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const sidebarCollapsed = useSidebarCollapsed();
  const user = useAuthStore((s) => s.user);

  // Farm context selectors
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const { data: plots = [], isLoading: isLoadingPlots } = useFarmPlots(
    user?.profileId ?? "",
    !!user?.profileId,
  );
  const { data: zones = [], isLoading: isLoadingZones } = useFarmZones(
    selectedPlotId ?? "",
    !!selectedPlotId,
  );

  const handlePlotChange = (plotId: string | null) => {
    setSelectedPlotId(plotId);
    setSelectedZoneId(null); // reset zone when plot changes
  };
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
  const [selectedRoute, setSelectedRoute] = useState<RagRoute>("auto");
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<RagPageMessage[]>([
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

  const allTreatmentPlans = useMemo(() => {
    return messages
      .filter((m) => m.role === "assistant" && m.response?.plan)
      .map((m) => ({
        plan: m.response!.plan,
        savedPlanId: m.response!.savedPlanId,
        documents: m.response!.documents || [],
        webResults: m.response!.webSearchResults || [],
      }));
  }, [messages]);

  const streamingAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role === "assistant" && message.isStreaming) return message;
    }
    return null;
  }, [messages]);

  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  const updateMessageById = useCallback(
    (messageId: string, updater: (message: RagPageMessage) => RagPageMessage) => {
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
          farmPlotId: selectedPlotId,
          farmZoneId: selectedZoneId,
          route: selectedRoute,
        },
        {
          onState: (state) => {
            updateMessageById(assistantMessageId, (message) => ({
              ...message,
              ragState: state.ragState ?? message.ragState,
              currentNode: state.currentNode ?? message.currentNode,
              step: state.step ?? message.step,
              pathType: state.pathType ?? message.pathType,
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

  const handleResetConversation = () => {
    streamAbortRef.current?.abort();
    setActiveConversationId(null);
    setThreadId(null);
    setQuestion("");
    setSelectedRoute("auto");
    setMessages([createAssistantMessage(INITIAL_ASSISTANT_MESSAGE)]);
  };

  const handleQuestionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const pipelineStateForUi = streamingAssistantMessage ?? lastAssistantMessage;

  const showConversationErrorState =
    !isLoadingConversation && !!conversationError && !!activeConversationId;

  const showConversationListErrorState =
    !isLoadingConversations && !!conversationError && !activeConversationId;

  if (showConversationListErrorState) {
    return (
      <div
        className={`fixed inset-0 top-16 flex overflow-auto bg-white z-10 transition-all duration-300 ${
          sidebarCollapsed ? "lg:left-14" : "lg:left-56"
        }`}
      >
        <div className="w-full max-w-3xl mx-auto p-6">
          <PageErrorState
            title="Không thể tải danh sách hội thoại"
            description={conversationError ?? undefined}
            onRetry={() => void loadConversations()}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 top-16 flex overflow-hidden bg-white z-10 transition-all duration-300 ${
        sidebarCollapsed ? "lg:left-14" : "lg:left-56"
      }`}
    >
      <RagConversationList
        conversations={conversationList}
        activeConversationId={activeConversationId}
        isLoading={isLoadingConversations}
        error={conversationError}
        onSelect={(id) => void handleSelectConversation(id)}
        onDelete={(id) => void handleDeleteConversation(id)}
        onRefresh={() => void loadConversations()}
        onNewConversation={handleResetConversation}
      />

      {showConversationErrorState ? (
        <div className="flex-1 overflow-auto p-6">
          <PageErrorState
            title="Không thể tải hội thoại"
            description={conversationError ?? undefined}
            onRetry={() => void handleSelectConversation(activeConversationId)}
          />
        </div>
      ) : (
        <RagChatArea
          messages={messages}
          isLoadingConversation={isLoadingConversation}
          isSubmitting={isSubmitting}
          question={question}
          language={language}
          threadId={threadId}
          formRef={formRef}
          textareaRef={textareaRef}
          bottomRef={bottomRef}
          isInfoOpen={isInfoOpen}
          plots={plots}
          zones={zones}
          selectedPlotId={selectedPlotId}
          selectedZoneId={selectedZoneId}
          isLoadingPlots={isLoadingPlots}
          isLoadingZones={isLoadingZones}
          onPlotChange={handlePlotChange}
          onZoneChange={setSelectedZoneId}
          onSubmit={handleSubmit}
          onQuestionChange={setQuestion}
          onKeyDown={handleQuestionKeyDown}
          onStopStreaming={handleStopStreaming}
          onLanguageChange={setLanguage}
          onResetConversation={handleResetConversation}
          onToggleInfo={() => setIsInfoOpen((v) => !v)}
          selectedRoute={selectedRoute}
          onRouteChange={setSelectedRoute}
        />
      )}
      {isInfoOpen && (
        <RagInfoPanel
          pipelineState={
            pipelineStateForUi
              ? {
                  ragState: pipelineStateForUi.ragState,
                  currentNode: pipelineStateForUi.currentNode,
                  step: pipelineStateForUi.step,
                }
              : null
          }
          documents={latestDocuments}
          webResults={latestWebResults}
          treatmentPlans={allTreatmentPlans}
          onClose={() => setIsInfoOpen(false)}
        />
      )}
    </div>
  );
}

export default RagChatPage;
