import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { ModalShell } from "../../../components/ui/ModalShell";
import { useTranslation } from "../../../i18n";
import type {
  DeviceDetailResponse,
  DeviceResponse,
  UpdateDeviceRequest,
} from "../../../types/iot";
import { FarmLocationSelector } from "../../device-onboarding/components/FarmLocationSelector";

type EditableDevice = DeviceResponse | DeviceDetailResponse;

interface EditDeviceModalProps {
  open: boolean;
  device: EditableDevice | null;
  onClose: () => void;
  onSubmit: (payload: UpdateDeviceRequest) => Promise<void> | void;
  isSubmitting?: boolean;
}

const DEVICE_NAME_MAX_LENGTH = 100;

const normalizeValue = (value?: string | null) => value?.trim() ?? "";

const toDeviceManagementErrorMessage = (
  error: unknown,
  fallback: string,
  forbidden: string,
  notFound: string,
  invalidName: string,
) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("403")) return forbidden;
  if (message.includes("404")) return notFound;
  if (message.includes("400")) return invalidName;
  return message || fallback;
};

export function EditDeviceModal({
  open,
  device,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EditDeviceModalProps) {
  const { t } = useTranslation();
  const [deviceName, setDeviceName] = useState("");
  const [farmPlotId, setFarmPlotId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !device) return;
    setDeviceName(device.deviceName ?? "");
    setFarmPlotId(device.farmPlotId ?? "");
    setZoneId(device.zoneId ?? "");
    setActive(device.isActive ?? true);
    setError(null);
  }, [device, open]);

  const trimmedName = deviceName.trim();
  const original = useMemo(
    () => ({
      deviceName: normalizeValue(device?.deviceName),
      farmPlotId: device?.farmPlotId ?? "",
      zoneId: device?.zoneId ?? "",
      active: device?.isActive ?? true,
    }),
    [device],
  );

  const validationError = useMemo(() => {
    if (!trimmedName) return t("iot.devices.edit.nameRequired");
    if (trimmedName.length > DEVICE_NAME_MAX_LENGTH) {
      return t("iot.devices.edit.nameTooLong")(DEVICE_NAME_MAX_LENGTH);
    }
    if (zoneId && !farmPlotId) return t("iot.devices.edit.zoneRequiresFarm");
    return null;
  }, [farmPlotId, t, trimmedName, zoneId]);

  const payload = useMemo<UpdateDeviceRequest>(() => {
    const nextPayload: UpdateDeviceRequest = {};
    if (trimmedName !== original.deviceName) nextPayload.deviceName = trimmedName;
    if (farmPlotId !== original.farmPlotId) nextPayload.farmPlotId = farmPlotId;
    if (zoneId !== original.zoneId) nextPayload.zoneId = zoneId;
    if (active !== original.active) nextPayload.active = active;
    return nextPayload;
  }, [active, farmPlotId, original, trimmedName, zoneId]);

  const hasChanges = Object.keys(payload).length > 0;

  if (!open || !device) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(
        toDeviceManagementErrorMessage(
          submitError,
          t("iot.devices.edit.error"),
          t("iot.devices.release.forbidden"),
          t("iot.devices.edit.notFound"),
          t("iot.devices.edit.invalidName"),
        ),
      );
    }
  };

  return (
    <ModalShell
      onClose={isSubmitting ? () => undefined : onClose}
      title={t("iot.devices.edit.title")}
      subtitle={
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {t("iot.devices.edit.description")}
        </p>
      }
      icon={<Settings2 className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />}
      maxWidth="sm:max-w-2xl"
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
            type="submit"
            form="edit-device-form"
            disabled={isSubmitting || Boolean(validationError) || !hasChanges}
            className="rounded-2xl bg-[#245A34] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1d472a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("iot.devices.edit.saving") : t("iot.devices.edit.save")}
          </button>
        </div>
      }
    >
      <form id="edit-device-form" onSubmit={handleSubmit} className="space-y-5 p-6">
        <label className="block">
          <span className="text-sm font-black text-slate-700">
            {t("iot.devices.edit.deviceName")}
          </span>
          <input
            value={deviceName}
            onChange={(event) => setDeviceName(event.target.value)}
            maxLength={DEVICE_NAME_MAX_LENGTH}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#245A34] focus:ring-4 focus:ring-[#245A34]/10"
          />
        </label>

        <FarmLocationSelector
          farmPlotId={farmPlotId}
          zoneId={zoneId}
          onFarmPlotChange={(nextFarmPlotId) => setFarmPlotId(nextFarmPlotId)}
          onZoneChange={(nextZoneId) => setZoneId(nextZoneId)}
        />

        <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span>
            <span className="block text-sm font-black text-slate-800">
              {t("iot.devices.edit.active")}
            </span>
            <span className="block text-xs font-semibold text-slate-500">
              {t("iot.devices.edit.activeHelper")}
            </span>
          </span>
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="h-5 w-5 accent-[#245A34]"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}
      </form>
    </ModalShell>
  );
}

export default EditDeviceModal;
