import { AlertTriangle } from "lucide-react";
import { ModalShell } from "../../../components/ui/ModalShell";

interface ConfirmDeleteDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  title,
  description,
  confirmLabel = "Xóa",
  isDeleting = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <ModalShell
      onClose={onCancel}
      icon={<AlertTriangle className="h-5 w-5 text-red-600" strokeWidth={2.5} />}
      iconBg="bg-red-50"
      title={title}
      titleId="confirm-delete-title"
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Đang xóa..." : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="px-6 py-4 text-sm font-semibold text-slate-500">{description}</p>
    </ModalShell>
  );
}
