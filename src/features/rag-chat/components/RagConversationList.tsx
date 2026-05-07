import { Bot, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { RagConversationSummary } from "../types";

interface RagConversationListProps {
  conversations: RagConversationSummary[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onNewConversation: () => void;
}

function formatConversationTime(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "";
  const d = new Date(parsed);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday)
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function RagConversationList({
  conversations,
  activeConversationId,
  isLoading,
  error,
  onSelect,
  onDelete,
  onRefresh,
  onNewConversation,
}: RagConversationListProps) {
  return (
    <div className="w-80 shrink-0 h-full border-r border-gray-200/60 bg-white flex flex-col z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
        <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-600" />
          Trợ lý RAG
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onNewConversation}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            title="Phiên mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 shrink-0">
          {error}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <LoaderCircle className="w-4 h-4 animate-spin" />
            Đang tải...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-60">
            <Bot className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">Chưa có hội thoại</p>
            <p className="text-xs text-gray-400 mt-1">Đặt câu hỏi để bắt đầu</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {conversations.map((conv) => {
              const isActive = activeConversationId === conv.conversationId;
              return (
                <div
                  key={conv.conversationId}
                  onClick={() => onSelect(conv.conversationId)}
                  className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 group ${
                    isActive
                      ? "bg-emerald-50 ring-1 ring-emerald-200 shadow-sm"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar placeholder */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? "bg-emerald-100" : "bg-slate-100"
                    }`}
                  >
                    <Bot
                      className={`w-4 h-4 ${
                        isActive ? "text-emerald-700" : "text-slate-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive ? "text-emerald-900" : "text-gray-800"
                        }`}
                      >
                        {conv.title || "Hội thoại mới"}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatConversationTime(conv.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {conv.preview || "Không có nội dung xem trước"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {conv.messageCount} tin nhắn
                    </p>
                  </div>

                  {/* Delete button — shows on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.conversationId);
                    }}
                    className="absolute right-2 top-2 p-1.5 rounded-lg text-transparent group-hover:text-slate-400 hover:text-red-500! hover:bg-red-50 transition-colors"
                    aria-label="Xoá hội thoại"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
