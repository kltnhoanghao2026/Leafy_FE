import { Bot, Sparkles } from "lucide-react";
import type { ChatMessage, RagTreatmentPlan } from "../types";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface ChatPanelProps {
  messages: ChatMessage[];
  isThinking?: boolean;
  onCreateTreatmentPlan?: (plan: RagTreatmentPlan) => void;
}

export function ChatPanel({
  messages,
  isThinking,
  onCreateTreatmentPlan,
}: ChatPanelProps) {
  if (!messages.length && !isThinking) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center">
        <span className="rounded-3xl bg-green-50 p-4 text-[#245A34]">
          <Bot className="h-8 w-8" strokeWidth={2.5} />
        </span>
        <h3 className="mt-4 text-xl font-black text-slate-900">
          Bắt đầu hỏi trợ lý AI
        </h3>
        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
          Bạn có thể hỏi về bệnh lá cà phê, lịch chăm sóc, tưới tiêu hoặc cách xử lý vấn đề cây trồng.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[360px] space-y-4 rounded-[2rem] bg-slate-50 p-4">
      {messages.map((message) => (
        <ChatMessageBubble
          key={message.id}
          message={message}
          onCreateTreatmentPlan={onCreateTreatmentPlan}
        />
      ))}
      {isThinking ? (
        <div className="flex justify-start">
          <div className="inline-flex items-center rounded-[1.5rem] border border-slate-100 bg-white px-5 py-4 text-sm font-bold text-slate-500 shadow-sm">
            <Sparkles className="mr-2 h-4 w-4 animate-pulse text-[#245A34]" />
            AI đang suy nghĩ...
          </div>
        </div>
      ) : null}
    </div>
  );
}
