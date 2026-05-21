import { type FormEvent, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { MediaImage } from "../../community/components/MediaImage";
import { useTranslation } from "../../../i18n";
import { formatMediaStatusLabel, formatScheduleRecurrenceLabel } from "../../iot/utils/iotTranslation";
import { useDeviceDetail } from "../queries";
import type { DeviceCameraScheduleRequest, DeviceCameraScheduleResponse } from "../../../types/iot";
import {
  useCreateDeviceCameraScheduleMutation,
  useDeleteDeviceScheduleMutation,
  useDeviceSchedulesQuery,
  useRunScheduledCameraMutation,
  useUpdateDeviceScheduleMutation,
} from "../../admin/iot-camera-schedules/cameraSchedules.queries";

const recurrenceOptions = ["DAILY", "WEEKLY", "MONTHLY"] as const;
const resolutionOptions = ["QVGA", "VGA", "HD"] as const;
const qualityOptions = ["LOW", "MEDIUM", "HIGH"] as const;
const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const toInputTime = (value?: string | null) => value?.slice(0, 5) ?? "08:30";
const normalizeTime = (value: string) => (value.length === 5 ? `${value}:00` : value);
const getScheduleId = (schedule: DeviceCameraScheduleResponse) =>
  schedule.scheduleId ?? schedule.id;
const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
};

function validate(payload: DeviceCameraScheduleRequest, t: ReturnType<typeof useTranslation>["t"]) {
  if (!payload.timeOfDay) return t("iot.cameraSchedules.validation.timeOfDay");
  if (!recurrenceOptions.includes(payload.recurrence as typeof recurrenceOptions[number])) {
    return t("iot.cameraSchedules.validation.recurrence");
  }
  if (payload.resolution && !resolutionOptions.includes(payload.resolution)) {
    return t("iot.cameraSchedules.validation.resolution");
  }
  if (payload.quality && !qualityOptions.includes(payload.quality)) {
    return t("iot.cameraSchedules.validation.quality");
  }
  if (payload.uploadEndpoint && !isHttpUrl(payload.uploadEndpoint)) {
    return t("iot.cameraSchedules.validation.uploadEndpoint");
  }
  return null;
}

function ScheduleForm({
  initial,
  onSubmit,
  isPending,
}: {
  initial?: DeviceCameraScheduleResponse | null;
  onSubmit: (payload: DeviceCameraScheduleRequest) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState(toInputTime(initial?.timeOfDay));
  const [recurrence, setRecurrence] = useState(initial?.recurrence ?? "DAILY");
  const [resolution, setResolution] = useState(initial?.resolution ?? "VGA");
  const [quality, setQuality] = useState(initial?.quality ?? "MEDIUM");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [uploadEndpoint, setUploadEndpoint] = useState(initial?.uploadEndpoint ?? "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload: DeviceCameraScheduleRequest = {
      enabled,
      triggerType: "SCHEDULED",
      timeOfDay: normalizeTime(timeOfDay),
      recurrence: recurrence as DeviceCameraScheduleRequest["recurrence"],
      resolution: resolution as DeviceCameraScheduleRequest["resolution"],
      quality: quality as DeviceCameraScheduleRequest["quality"],
      uploadEndpoint: uploadEndpoint.trim() || undefined,
    };
    const validationError = validate(payload, t);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSubmit(payload);
  };

  return (
    <form className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-6" onSubmit={submit}>
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        {t("iot.cameraSchedules.timeOfDay")}
        <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setTimeOfDay(e.target.value)} type="time" value={timeOfDay} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        {t("iot.cameraSchedules.recurrence")}
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setRecurrence(e.target.value)} value={recurrence}>
          {recurrenceOptions.map((option) => <option key={option} value={option}>{formatScheduleRecurrenceLabel(t, option)}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        {t("iot.cameraSchedules.resolution")}
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setResolution(e.target.value)} value={resolution ?? "VGA"}>
          {resolutionOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        {t("iot.cameraSchedules.quality")}
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setQuality(e.target.value)} value={quality ?? "MEDIUM"}>
          {qualityOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        {t("iot.cameraSchedules.uploadEndpoint")}
        <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setUploadEndpoint(e.target.value)} placeholder="https://..." value={uploadEndpoint ?? ""} />
      </label>
      <label className="flex items-center gap-2 pt-5 text-sm font-bold text-slate-700">
        <input checked={enabled} onChange={(e) => setEnabled(e.target.checked)} type="checkbox" />
        {t("iot.cameraSchedules.enabled")}
      </label>
      {error ? <p className="md:col-span-6 text-sm font-bold text-red-600">{error}</p> : null}
      <button className="md:col-span-6 inline-flex w-fit items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={isPending} type="submit">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {initial ? t("iot.cameraSchedules.save") : t("iot.cameraSchedules.createSchedule")}
      </button>
    </form>
  );
}

export function DeviceCameraSchedulesPage() {
  const { deviceId = "" } = useParams();
  const { t } = useTranslation();
  const deviceQuery = useDeviceDetail(deviceId);
  const deviceUid = deviceQuery.data?.deviceUid;
  const schedulesQuery = useDeviceSchedulesQuery(deviceUid);
  const createSchedule = useCreateDeviceCameraScheduleMutation();
  const updateSchedule = useUpdateDeviceScheduleMutation(deviceUid);
  const deleteSchedule = useDeleteDeviceScheduleMutation(deviceUid);
  const runSchedule = useRunScheduledCameraMutation(deviceUid);
  const [editingId, setEditingId] = useState<string | null>(null);
  const schedules = useMemo(() => schedulesQuery.data ?? [], [schedulesQuery.data]);
  const editing = useMemo(
    () => schedules.find((schedule) => getScheduleId(schedule) === editingId),
    [editingId, schedules],
  );

  if (deviceQuery.isLoading) {
    return <div className="p-6 text-sm font-bold text-slate-500">{t("iot.devices.detail.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900">{t("iot.cameraSchedules.title")}</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">{deviceUid}</p>
      </header>

      <ScheduleForm
        isPending={createSchedule.isPending}
        onSubmit={(payload) => deviceUid && createSchedule.mutate({ deviceUid, payload })}
      />

      {editing ? (
        <section className="rounded-2xl border border-emerald-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-black text-slate-800">{t("iot.cameraSchedules.editSchedule")}</h2>
          <ScheduleForm
            initial={editing}
            isPending={updateSchedule.isPending}
            onSubmit={(payload) =>
              updateSchedule.mutate(
                { scheduleId: getScheduleId(editing), payload, deviceUid },
                { onSuccess: () => setEditingId(null) },
              )
            }
          />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {schedulesQuery.isLoading ? <div className="p-5 text-sm font-bold text-slate-500">{t("iot.cameraSchedules.loading")}</div> : null}
        {!schedulesQuery.isLoading && schedules.length === 0 ? <div className="p-5 text-sm font-bold text-slate-500">{t("iot.cameraSchedules.empty")}</div> : null}
        {schedules.map((schedule) => {
          const scheduleId = getScheduleId(schedule);
          const thumbnailSource = schedule.lastMediaEvent?.fileId ?? schedule.lastMediaThumbnail;
          const mediaStatus = schedule.lastMediaEvent?.status ?? schedule.lastMediaStatus;
          return (
          <article className="grid gap-4 border-b border-slate-100 p-4 md:grid-cols-[1fr_220px_auto]" key={scheduleId}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-slate-900">{schedule.timeOfDay}</strong>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{formatScheduleRecurrenceLabel(t, schedule.recurrence)}</span>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-black text-slate-600">{schedule.enabled ? t("iot.cameraSchedules.enabled") : t("iot.cameraSchedules.disabled")}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">{schedule.resolution ?? "VGA"} · {schedule.quality ?? "MEDIUM"} · {schedule.uploadEndpoint || "-"}</p>
              <p className="text-sm font-semibold text-slate-500">{t("iot.cameraSchedules.lastRunAt")}: {formatDateTime(schedule.lastRunAt)}</p>
              <p className="text-sm font-semibold text-slate-500">{t("iot.cameraSchedules.nextRunAt")}: {formatDateTime(schedule.nextRunAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                {thumbnailSource ? <MediaImage alt={t("iot.cameraSchedules.thumbnailAlt")} className="h-full w-full object-cover" source={thumbnailSource} /> : null}
              </div>
              <span className="text-xs font-bold text-slate-500">{formatMediaStatusLabel(t, mediaStatus)}</span>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" onClick={() => setEditingId(scheduleId)} type="button"><Pencil className="h-3.5 w-3.5" />{t("iot.cameraSchedules.edit")}</button>
              <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white" disabled={runSchedule.isPending} onClick={() => runSchedule.mutate({ scheduleId, deviceUid })} type="button"><Play className="h-3.5 w-3.5" />{t("iot.cameraSchedules.runNow")}</button>
              <button className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white" onClick={() => window.confirm(t("iot.cameraSchedules.deleteConfirm")) && deleteSchedule.mutate({ scheduleId, deviceUid })} type="button"><Trash2 className="h-3.5 w-3.5" />{t("iot.cameraSchedules.delete")}</button>
            </div>
          </article>
        );
        })}
      </section>
    </div>
  );
}

export default DeviceCameraSchedulesPage;
