import { AlertTriangle } from "lucide-react";
import { ModalShell } from "../../../../components/ui/ModalShell";
import type { PlanApplyResponse } from "../../shared/types";

interface CancelApplyDialogProps {
  apply: PlanApplyResponse;
  isCancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function CancelApplyDialog({
  apply,
  isCancelling,
  onClose,
  onConfirm,
}: CancelApplyDialogProps) {
  const planName = apply.planName || apply.diseaseName || apply.planId;
  const eventCount = apply.plantEventIds?.length ?? 0;

  return (
    <ModalShell
      onClose={onClose}
      icon={
        <AlertTriangle
          className="h-5 w-5 text-amber-600"
          strokeWidth={2.5}
        />
      }
      iconBg="bg-amber-50"
      title="Hủy áp dụng kế hoạch"
      titleId="cancel-apply-title"
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </div>
      }
    >
      <div className="px-6 py-4 space-y-4">
        <p className="text-sm font-semibold text-slate-500">
          Bạn đang hủy áp dụng kế hoạch:{" "}
          <span className="font-black text-slate-800">{planName}</span>
        </p>

        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Ngày bắt đầu</span>
            <span className="font-bold text-slate-700">{formatDate(apply.startDate)}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Tổng sự kiện</span>
            <span className="font-bold text-slate-700">{eventCount} sự kiện</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700">
            <span className="font-black">Lưu ý:</span> Các sự kiện{" "}
            <span className="font-black">chưa hoàn thành</span> sẽ bị xóa. Các sự kiện{" "}
            <span className="font-black">đã hoàn thành</span> sẽ được giữ lại.
            Hành động này không thể hoàn tác.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}
