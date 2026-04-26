import type { KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  value: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatInput({
  value,
  disabled,
  isSubmitting,
  onChange,
  onSubmit,
}: ChatInputProps) {
  const canSubmit = value.trim().length > 0 && !disabled && !isSubmitting;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-3 shadow-sm">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSubmitting}
        rows={3}
        placeholder="Nhập câu hỏi cho trợ lý AI..."
        className="min-h-[96px] w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#245A34] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-400">
          Enter để gửi, Shift+Enter để xuống dòng.
        </p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="inline-flex items-center rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizontal className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {isSubmitting ? "Đang gửi..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}
