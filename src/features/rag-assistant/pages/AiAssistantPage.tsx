import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, Leaf, Sparkles } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { ChatInput } from "../components/ChatInput";
import { ChatPanel } from "../components/ChatPanel";
import { CreatePlanFromRagDialog } from "../components/CreatePlanFromRagDialog";
import { useRagHealth, useSendRagChatMutation } from "../queries";
import type { ChatMessage, RagPlan } from "../types";
import {
  getChatAnswer,
  getThreadId,
  getTreatmentPlanFromChat,
  normalizeSources,
} from "../utils/ragResponse";
import {
  buildDiseaseAdvicePrompt,
  getDiseaseContextFromLocation,
} from "../utils/chatContext";

const suggestedPrompts = [
  "Lá cà phê bị gỉ sắt nên xử lý như thế nào?",
  "Lịch chăm sóc cây cà phê trong mùa mưa?",
  "Độ ẩm đất thấp thì nên tưới thế nào?",
  "Cách phòng nhện đỏ trên cây cà phê?",
];

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toFriendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/401|unauthenticated|unauthorized|forbidden/i.test(message)) {
    return "Bạn cần đăng nhập hoặc không có quyền sử dụng trợ lý AI.";
  }
  if (/timeout|network|failed/i.test(message)) {
    return "Không kết nối được rag-service. Vui lòng thử lại sau.";
  }
  return "AI Assistant phản hồi thất bại. Vui lòng thử lại.";
};

export function AiAssistantPage() {
  const location = useLocation();
  const diseaseContext = useMemo(
    () => getDiseaseContextFromLocation(location),
    [location],
  );
  const initialPrompt = diseaseContext
    ? buildDiseaseAdvicePrompt(diseaseContext)
    : "";
  const [input, setInput] = useState(initialPrompt);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [planForCreate, setPlanForCreate] = useState<RagPlan | null>(
    null,
  );
  const healthQuery = useRagHealth();
  const chatMutation = useSendRagChatMutation();
  const aiUnavailable = healthQuery.isError;

  const handleSubmit = async () => {
    const question = input.trim();
    if (!question || chatMutation.isPending || aiUnavailable) {
      if (!question) setError("Vui lòng nhập câu hỏi trước khi gửi.");
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);

    try {
      const result = await chatMutation.mutateAsync({
        question,
        language: "Vietnamese",
        thread_id: threadId,
      });
      const nextThreadId = getThreadId(result);
      if (nextThreadId) setThreadId(nextThreadId);

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: getChatAnswer(result),
        createdAt: new Date().toISOString(),
        plan: getTreatmentPlanFromChat(result),
        sources: normalizeSources(result),
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      setError(toFriendlyError(err));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            RAG Assistant
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            Trợ lý AI nông nghiệp
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Hỏi đáp về cây trồng, bệnh lá cà phê và cách chăm sóc.
          </p>
        </div>
        <Link
          to={ROUTES.DASHBOARD.RAG_PANEL}
          className="inline-flex items-center justify-center rounded-2xl border border-[#245A34] bg-white px-5 py-3 text-sm font-bold text-[#245A34] hover:bg-green-50"
        >
          <FileText className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Kế hoạch AI
        </Link>
      </header>

      <div
        className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-black ${
          aiUnavailable
            ? "bg-amber-50 text-amber-800"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        <Sparkles className="mr-2 h-4 w-4" strokeWidth={2.5} />
        {aiUnavailable ? "AI chưa sẵn sàng" : "AI sẵn sàng"}
      </div>

      {diseaseContext ? (
        <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-[#245A34]">
          Đã nhận ngữ cảnh chẩn đoán bệnh. Prompt tư vấn đã được điền sẵn, bạn có thể chỉnh lại trước khi gửi.
        </div>
      ) : null}

      {aiUnavailable ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          RAG service đang offline hoặc chưa sẵn sàng. Vui lòng thử lại sau.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <ChatPanel
            messages={messages}
            isThinking={chatMutation.isPending}
            onCreatePlan={setPlanForCreate}
          />
          {error ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => void handleSubmit()}
            disabled={aiUnavailable}
            isSubmitting={chatMutation.isPending}
          />
        </div>

        <aside className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Gợi ý câu hỏi</h3>
          <div className="mt-4 space-y-3">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInput(prompt)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-bold leading-6 text-slate-600 hover:border-[#245A34] hover:bg-green-50 hover:text-[#245A34]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </aside>
      </section>

      {planForCreate ? (
        <CreatePlanFromRagDialog
          plan={planForCreate}
          context={diseaseContext}
          onClose={() => setPlanForCreate(null)}
        />
      ) : null}

      <section className="rounded-4xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex gap-3">
          <Leaf className="mt-1 h-5 w-5 text-amber-700" />
          <div>
            <h3 className="text-base font-black text-amber-950">
              Lưu ý an toàn khi dùng AI
            </h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
              Kết quả chẩn đoán và kế hoạch AI chỉ mang tính hỗ trợ. Cần kiểm tra thực tế tại vườn trước khi áp dụng thuốc hoặc can thiệp.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AiAssistantPage;
