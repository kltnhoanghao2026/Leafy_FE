import { AlertTriangle } from "lucide-react";
import { ModalShell } from "../../../components/ui/ModalShell";
import { useTranslation } from "../../../i18n";

interface ReleaseDeviceConfirmDialogProps {
  open: boolean;
  deviceName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export function ReleaseDeviceConfirmDialog({
  open,
  deviceName,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ReleaseDeviceConfirmDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <ModalShell
      onClose={isSubmitting ? () => undefined : onClose}
      title={t("iot.devices.release.title")}
      subtitle={
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {deviceName || t("iot.devices.defaultName")}
        </p>
      }
      icon={<AlertTriangle className="h-5 w-5 text-rose-700" strokeWidth={2.5} />}
      iconBg="bg-rose-50"
      maxWidth="sm:max-w-lg"
      accentBar={<div className="h-1 w-full shrink-0 bg-rose-500" />}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("iot.common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? t("iot.devices.release.releasing")
              : t("iot.devices.release.confirm")}
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <p className="text-sm font-semibold leading-6 text-slate-700">
          {t("iot.devices.release.message")}
        </p>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          {t("iot.devices.release.historyNote")}
        </div>
      </div>
    </ModalShell>
  );
}

export default ReleaseDeviceConfirmDialog;
