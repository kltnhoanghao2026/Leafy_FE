import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ModalShell } from '../../../../components/ui/ModalShell';
import { useCompleteApplyMutation } from '../../plan/queries/plan.queries';
import { useTranslation } from '../../../../i18n';

interface SuccessPromptModalProps {
  applyId: string;
  onClose: () => void;
}

export function SuccessPromptModal({ applyId, onClose }: SuccessPromptModalProps) {
  const { t } = useTranslation();
  const completeApply = useCompleteApplyMutation();
  const [selected, setSelected] = useState<boolean | null>(null);

  const handleConfirm = async (success: boolean) => {
    setSelected(success);
    try {
      await completeApply.mutateAsync({ applyId, success });
      onClose();
    } catch {
      setSelected(null);
    }
  };

  const isLoading = completeApply.isPending;

  return (
    <ModalShell
      onClose={onClose}
      title="Kết thúc kế hoạch"
      subtitle={
        <p className="text-sm text-slate-500 mt-0.5">
          Bạn đã hoàn thành sự kiện cuối cùng. Kế hoạch này có thành công không?
        </p>
      }
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleConfirm(false)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Thất bại
          </button>
          <button
            type="button"
            onClick={() => handleConfirm(true)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#2F7F34] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#245A2A] disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Thành công
          </button>
        </div>
      }
    >
      <div className="px-6 py-4 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg
            className="h-6 w-6 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-600">
          Chọn <strong>Thành công</strong> nếu cây đã hồi phục sau điều trị,
          hoặc <strong>Thất bại</strong> nếu kế hoạch không đạt kết quả mong muốn.
        </p>
      </div>
    </ModalShell>
  );
}
