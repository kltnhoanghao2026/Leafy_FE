import { useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ImageOff,
  Loader2,
  Pencil,
  Play,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { MediaImage } from "../../community/components/MediaImage";
import { useTranslation } from "../../../i18n";
import {
  formatMediaStatusLabel,
  formatScheduleRecurrenceLabel,
} from "../../iot/utils/iotTranslation";
import type {
  CameraScheduleRecurrence,
  DeviceCameraScheduleRequest,
  DeviceCameraScheduleResponse,
  DeviceMediaEventResponse,
} from "../../../types/iot";
import {
  useCameraSchedulesQuery,
  useCreateCameraScheduleMutation,
  useDeleteCameraScheduleMutation,
  useRunScheduledCameraForDeviceMutation,
  useRunCameraScheduleNowMutation,
  useUpdateCameraScheduleMutation,
} from "./cameraSchedules.queries";

type EnabledFilter = "all" | "enabled" | "disabled";

const recurrenceOptions: CameraScheduleRecurrence[] = ["DAILY", "WEEKLY", "NONE"];
const resolutionOptions = ["QVGA", "VGA", "HD"] as const;
const qualityOptions = ["LOW", "MEDIUM", "HIGH"] as const;

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const formatBytes = (value?: number | null) =>
  value == null ? "-" : new Intl.NumberFormat("vi-VN").format(value);

const normalizeTime = (value: string) => {
  if (!value) return "";
  return value.length === 5 ? `${value}:00` : value;
};

const toInputTime = (value?: string | null) => (value ? value.slice(0, 5) : "");

function statusClass(status?: string | null) {
  if (status === "UPLOADED") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "FAILED" || status === "TIMEOUT") return "bg-red-50 text-red-700 border-red-100";
  if (status === "REQUESTED" || status === "COMMAND_SENT" || status === "UPLOADING") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }
  return "bg-slate-50 text-slate-600 border-slate-100";
}

function ScheduleForm({
  initial,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: DeviceCameraScheduleResponse;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (payload: DeviceCameraScheduleRequest) => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const [deviceUid, setDeviceUid] = useState(initial?.deviceUid ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [timeOfDay, setTimeOfDay] = useState(toInputTime(initial?.timeOfDay) || "08:30");
  const [recurrence, setRecurrence] = useState<CameraScheduleRecurrence>(
    (initial?.recurrence as CameraScheduleRecurrence | undefined) ?? "DAILY",
  );
  const [resolution, setResolution] = useState(initial?.resolution ?? "VGA");
  const [quality, setQuality] = useState(initial?.quality ?? "MEDIUM");
  const [uploadEndpoint, setUploadEndpoint] = useState(initial?.uploadEndpoint ?? "");

  return (
    <form
      className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.7fr_0.8fr_0.7fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          deviceUid: deviceUid.trim(),
          enabled,
          triggerType: "SCHEDULED",
          timeOfDay: normalizeTime(timeOfDay),
          recurrence,
          resolution: resolution as DeviceCameraScheduleRequest["resolution"],
          quality: quality as DeviceCameraScheduleRequest["quality"],
          uploadEndpoint: uploadEndpoint.trim() || undefined,
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        {t("iot.cameraSchedules.deviceUid")}
        <input
          value={deviceUid}
          onChange={(event) => setDeviceUid(event.target.value)}
          required
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        {t("iot.cameraSchedules.timeOfDay")}
        <input
          type="time"
          value={timeOfDay}
          onChange={(event) => setTimeOfDay(event.target.value)}
          required
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        {t("iot.cameraSchedules.recurrence")}
        <select
          value={recurrence}
          onChange={(event) => setRecurrence(event.target.value as CameraScheduleRecurrence)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {recurrenceOptions.map((option) => (
            <option key={option} value={option}>
              {formatScheduleRecurrenceLabel(t, option)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 pt-5 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
        />
        {t("iot.cameraSchedules.enabled")}
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        {t("iot.cameraSchedules.resolution")}
        <select
          value={resolution ?? "VGA"}
          onChange={(event) => setResolution(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {resolutionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        {t("iot.cameraSchedules.quality")}
        <select
          value={quality ?? "MEDIUM"}
          onChange={(event) => setQuality(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {qualityOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        {t("iot.cameraSchedules.uploadEndpoint")}
        <input
          value={uploadEndpoint ?? ""}
          onChange={(event) => setUploadEndpoint(event.target.value)}
          placeholder="default"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </label>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            {t("iot.common.cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function LastCaptureCell({ media }: { media?: DeviceMediaEventResponse | null }) {
  const { t } = useTranslation();

  if (!media) {
    return (
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
        <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
          <ImageOff className="h-5 w-5" />
        </div>
        {t("iot.cameraSchedules.noCapture")}
      </div>
    );
  }

  return (
    <div className="flex min-w-[260px] items-center gap-3">
      <div className="h-14 w-20 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        {media.fileId ? (
          <MediaImage
            source={media.fileId}
            alt={t("iot.cameraSchedules.thumbnailAlt")}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${statusClass(media.status)}`}>
          {formatMediaStatusLabel(t, media.status)}
        </span>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {media.fileId
            ? `${media.width ?? "-"}x${media.height ?? "-"} - ${formatBytes(media.sizeBytes)} bytes`
            : media.error || media.requestId || t("iot.devices.media.waitingForUpload")}
        </p>
      </div>
    </div>
  );
}

export function IotCameraSchedulesPage() {
  const { t } = useTranslation();
  const [deviceFilter, setDeviceFilter] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const schedulesQuery = useCameraSchedulesQuery();
  const createSchedule = useCreateCameraScheduleMutation();
  const updateSchedule = useUpdateCameraScheduleMutation();
  const deleteSchedule = useDeleteCameraScheduleMutation();
  const runNow = useRunCameraScheduleNowMutation();
  const runDeviceScheduled = useRunScheduledCameraForDeviceMutation();

  const filteredSchedules = useMemo(() => {
    const schedules = schedulesQuery.data ?? [];
    const deviceNeedle = deviceFilter.trim().toLowerCase();
    return schedules.filter((schedule) => {
      const matchesDevice =
        !deviceNeedle || schedule.deviceUid.toLowerCase().includes(deviceNeedle);
      const matchesEnabled =
        enabledFilter === "all" ||
        (enabledFilter === "enabled" ? schedule.enabled : !schedule.enabled);
      return matchesDevice && matchesEnabled;
    });
  }, [deviceFilter, enabledFilter, schedulesQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
            {t("iot.cameraSchedules.adminEyebrow")}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {t("iot.cameraSchedules.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
            {t("iot.cameraSchedules.description")}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={deviceFilter}
            onChange={(event) => setDeviceFilter(event.target.value)}
            placeholder={t("iot.cameraSchedules.filterDevice")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <select
            value={enabledFilter}
            onChange={(event) => setEnabledFilter(event.target.value as EnabledFilter)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="all">{t("iot.cameraSchedules.filterAll")}</option>
            <option value="enabled">{t("iot.cameraSchedules.filterEnabled")}</option>
            <option value="disabled">{t("iot.cameraSchedules.filterDisabled")}</option>
          </select>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-800">
          <Camera className="h-4 w-4 text-emerald-700" />
          {t("iot.cameraSchedules.createTitle")}
        </h2>
        <ScheduleForm
          isPending={createSchedule.isPending}
          submitLabel={t("iot.cameraSchedules.create")}
          onSubmit={(payload) => createSchedule.mutate(payload)}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {schedulesQuery.isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm font-bold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("iot.cameraSchedules.loading")}
          </div>
        ) : null}

        {schedulesQuery.isError ? (
          <div className="p-6 text-sm font-bold text-red-600">
            {t("iot.cameraSchedules.loadFailed")}
          </div>
        ) : null}

        {!schedulesQuery.isLoading && filteredSchedules.length === 0 ? (
          <div className="p-6 text-sm font-bold text-slate-500">
            {t("iot.cameraSchedules.empty")}
          </div>
        ) : null}

        {filteredSchedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.deviceUid")}</th>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.enabled")}</th>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.timeOfDay")}</th>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.recurrence")}</th>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.captureOptions")}</th>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.nextRunAt")}</th>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.lastRunAt")}</th>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.lastCapture")}</th>
                  <th className="px-4 py-3">{t("iot.cameraSchedules.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="align-top">
                    <td className="px-4 py-4 font-bold text-slate-900">{schedule.deviceUid}</td>
                    <td className="px-4 py-4">
                      {schedule.enabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("iot.cameraSchedules.enabled")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
                          <XCircle className="h-3.5 w-3.5" />
                          {t("iot.cameraSchedules.disabled")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">{schedule.timeOfDay}</td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {formatScheduleRecurrenceLabel(t, schedule.recurrence)}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                      <div>{t("iot.cameraSchedules.resolution")}: {schedule.resolution ?? "-"}</div>
                      <div>{t("iot.cameraSchedules.quality")}: {schedule.quality ?? "-"}</div>
                      <div className="max-w-[180px] truncate">
                        {t("iot.cameraSchedules.uploadEndpoint")}: {schedule.uploadEndpoint || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{formatDateTime(schedule.nextRunAt)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{formatDateTime(schedule.lastRunAt)}</td>
                    <td className="px-4 py-4">
                      <LastCaptureCell media={schedule.lastMediaEvent} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(schedule.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("iot.cameraSchedules.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => runDeviceScheduled.mutate(schedule.deviceUid)}
                          disabled={runDeviceScheduled.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Play className="h-3.5 w-3.5" />
                          {t("iot.cameraSchedules.runScheduledCaptureNow")}
                        </button>
                        <button
                          type="button"
                          onClick={() => runNow.mutate(schedule.id)}
                          disabled={runNow.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                        >
                          <Play className="h-3.5 w-3.5" />
                          {t("iot.cameraSchedules.runNow")}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSchedule.mutate(schedule.id)}
                          disabled={deleteSchedule.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("iot.cameraSchedules.delete")}
                        </button>
                      </div>
                      {editingId === schedule.id ? (
                        <div className="mt-4 min-w-[720px] rounded-lg border border-slate-100 bg-slate-50 p-4">
                          <ScheduleForm
                            initial={schedule}
                            isPending={updateSchedule.isPending}
                            submitLabel={t("iot.cameraSchedules.save")}
                            onCancel={() => setEditingId(null)}
                            onSubmit={(payload) =>
                              updateSchedule.mutate(
                                { scheduleId: schedule.id, payload },
                                { onSuccess: () => setEditingId(null) },
                              )
                            }
                          />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default IotCameraSchedulesPage;
