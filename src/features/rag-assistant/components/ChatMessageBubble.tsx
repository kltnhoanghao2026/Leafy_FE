import { PlanPreviewCard } from './PlanPreviewCard';
import type { ChatMessage, RagPlan } from "../types";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onCreatePlan?: (plan: RagPlan) => void;
}

export function ChatMessageBubble({
  message,
  onCreatePlan,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(760px,90%)] rounded-[1.5rem] px-5 py-4 shadow-sm ${
          isUser
            ? "bg-[#245A34] text-white"
            : "border border-slate-100 bg-white text-slate-700"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
          {message.content}
        </p>
        {message.plan ? (
          <div className="mt-4">
            <PlanPreviewCard
              plan={message.plan}
              onCreatePlan={onCreatePlan}
            />
          </div>
        ) : null}
        {message.sources?.length ? (
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
            Nguồn tham khảo: {message.sources.length} tài liệu/kết quả
          </div>
        ) : null}
      </div>
    </div>
  );
}
