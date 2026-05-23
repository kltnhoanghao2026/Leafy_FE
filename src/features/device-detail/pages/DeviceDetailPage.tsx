import type { ComponentType, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CalendarPlus,
  Camera,
  CheckCircle2,
  Cpu,
  Droplet,
  ImageOff,
  LogOut,
  Play,
  RefreshCw,
  Save,
  ScanSearch,
  Send,
  Settings2,
  Sun,
  Thermometer,
  WifiOff,
  Wind,
} from "lucide-react";
import {
  CHART_TYPES,
  CHART_TYPE_LABEL_KEYS,
  IoTMetricCard,
  type MetricData,
  type SensorChartType,
  type SensorTrend,
} from "../../metrics-view/components/IoTMetricCard";
import { CompareChart } from "../../metrics-view/components/CompareChart";
import { SensorChartModal } from "../../metrics-view/components/SensorChartModal";
import { useAlertEvents } from "../../alerts/queries";
import { ModalShell } from "../../../components/ui/ModalShell";
import { MediaImage } from "../../community/components/MediaImage";
import { formatDateTime, formatNumber } from "../../metrics-view/utils/format";
import { useTranslation } from "../../../i18n";
import type { TFunction } from "../../../i18n/context";
import {
  formatCameraQualityLabel,
  formatCameraResolutionLabel,
  formatCameraTriggerLabel,
  formatConfigStatusLabel,
  formatDeviceStatusLabel,
  formatDeviceTypeLabel,
  formatMediaStatusLabel,
  formatSensorLabel,
} from "../../iot/utils/iotTranslation";
import type {
  DisplayCameraSchedule,
  DisplayDeviceMediaEvent,
} from "../../iot/utils/iotDisplay";
import {
  chartToTrend,
  DISPLAY_CHART_RANGE_OPTIONS,
  type DisplayChartRange,
  toApiChartRange,
} from "../../metrics-view/utils/chartRanges";
import type { SensorThresholds } from "../../metrics-view/utils/chartThresholds";
import {
  createDataUpdateMarker,
  deriveAnalytics,
  thresholdsFromAlertEvents,
  type EventMarkerData,
} from "../../metrics-view/utils/chartAnalytics";
import {
  useDeviceChart,
  useDeviceConfig,
  useDeviceDetail,
  useDeviceLatestReadings,
  useDeviceMedia,
  useCaptureDeviceImage,
  usePushDeviceConfig,
  useReleaseDeviceMutation,
  useUpdateDeviceMutation,
  useUpdateDeviceConfig,
} from "../queries";
import { EditDeviceModal } from "../components/EditDeviceModal";
import { ReleaseDeviceConfirmDialog } from "../components/ReleaseDeviceConfirmDialog";
import {
  useDeviceSchedulesQuery,
  useCreateDeviceCameraScheduleMutation,
  useDeleteDeviceScheduleMutation,
  useRunScheduledCameraMutation,
  useUpdateDeviceScheduleMutation,
} from "../../admin/iot-camera-schedules/cameraSchedules.queries";
import { useDiseaseDetectMutation } from "../../admin/camera-batch-upload/cameraBatchUpload.queries";
import { ROUTES } from "../../../lib/routes";
import type {
  DeviceConfigResponse,
  DeviceDetailResponse,
  DeviceMediaEventResponse,
  DeviceCameraScheduleResponse,
  CameraScheduleRecurrence,
  AlertEventItemResponse,
  LatestReadingItemResponse,
  UpdateDeviceConfigRequest,
  UpdateDeviceRequest,
} from "../../../types/iot";

const SENSOR_CONFIG = [
  {
    code: "AIR_TEMP",
    title: "Air temperature",
    icon: Thermometer,
    colorClass: "text-[#F97316]",
    barColor: "#FB923C",
    iconBgClass: "bg-[#FFF7ED]",
  },
  {
    code: "AIR_HUMIDITY",
    title: "Air humidity",
    icon: Wind,
    colorClass: "text-[#3B82F6]",
    barColor: "#60A5FA",
    iconBgClass: "bg-[#EFF6FF]",
  },
  {
    code: "SOIL_MOISTURE",
    title: "Soil moisture",
    icon: Droplet,
    colorClass: "text-[#10B981]",
    barColor: "#34D399",
    iconBgClass: "bg-[#ECFDF5]",
  },
  {
    code: "LIGHT_INTENSITY",
    title: "Light intensity",
    icon: Sun,
    colorClass: "text-[#EAB308]",
    barColor: "#FACC15",
    iconBgClass: "bg-[#FEFCE8]",
  },
] as const;

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
const getScheduleId = (schedule: DeviceCameraScheduleResponse) =>
  schedule.scheduleId ?? schedule.id;

interface SensorSnapshot {
  sensorCode: string;
  title: string;
  unit: string;
  color: string;
  data: SensorTrend[];
  signature: string;
}

type SensorIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

const normalizeUnit = (unit?: string | null): string => {
  if (!unit) return "";
  return unit === "C" ? "deg C" : unit;
};

const readingValue = (reading?: LatestReadingItemResponse): number | string => {
  if (!reading || reading.value === null) return "-";
  return formatNumber(reading.value);
};

const readableDeviceName = (
  t: TFunction,
  device?: { deviceName?: string | null; deviceCode?: string | null },
) => device?.deviceName?.trim() || device?.deviceCode?.trim() || t("iot.devices.defaultName");

function getDeviceManagementErrorMessage(error: unknown, t: TFunction, action: "edit" | "release") {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("403")) return t("iot.devices.release.forbidden");
  if (message.includes("404")) {
    return action === "edit"
      ? t("iot.devices.edit.notFound")
      : t("iot.devices.release.notFound");
  }
  if (message.includes("400")) return t("iot.devices.edit.invalidName");
  return message || (action === "edit" ? t("iot.devices.edit.error") : t("iot.devices.release.error"));
}

const csvDateStamp = () => new Date().toISOString().slice(0, 10);

const chartExportFilename = (
  scope: string,
  sensorCode: string,
  range: DisplayChartRange,
) => `iot-${scope}-${sensorCode}-${range}-${csvDateStamp()}`;

const trendSignature = (trend: SensorTrend[]) => {
  const first = trend[0];
  const last = trend[trend.length - 1];
  return [
    trend.length,
    first?.timestamp ?? "",
    first?.value ?? "",
    last?.timestamp ?? "",
    last?.value ?? "",
    last?.rollingAverage ?? "",
    last?.trendValue ?? "",
    last?.alertSeverity ?? "",
  ].join("|");
};

const badgeClass = (tone: "green" | "red" | "orange" | "slate") => {
  const classes = {
    green: "bg-green-50 text-green-700 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return `inline-flex rounded-full border px-3 py-1 text-xs font-black ${classes[tone]}`;
};

const statusTone = (status?: string | null): "green" | "red" | "orange" | "slate" => {
  if (status === "ONLINE" || status === "ACKED" || status === "CLAIMED") {
    return "green";
  }
  if (status === "FAILED" || status === "OFFLINE") return "red";
  if (status === "PENDING" || status === "SENT") return "orange";
  return "slate";
};

const isOfflineClaimedDevice = (device?: DeviceDetailResponse) =>
  device?.provisioningStatus === "CLAIMED" && device?.status === "OFFLINE";

const isMediaWaiting = (media?: DeviceMediaEventResponse) =>
  media?.status === "REQUESTED" ||
  media?.status === "COMMAND_SENT" ||
  media?.status === "UPLOADING";

const validateConfig = (
  payload: UpdateDeviceConfigRequest,
  t: TFunction,
): string | null => {
  if (payload.samplingIntervalSec <= 0) {
    return t("iot.devices.config.samplingPositive");
  }
  if (payload.publishIntervalSec <= 0) {
    return t("iot.devices.config.publishPositive");
  }
  if (payload.offlineTimeoutSec <= 0) {
    return t("iot.devices.config.offlinePositive");
  }
  if (payload.publishIntervalSec < payload.samplingIntervalSec) {
    return t("iot.devices.config.publishAfterSampling");
  }
  if (payload.offlineTimeoutSec <= payload.publishIntervalSec) {
    return t("iot.devices.config.offlineAfterPublish");
  }

  return null;
};

interface InfoTileProps {
  label: string;
  value: string;
}

function InfoTile({ label, value }: InfoTileProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

interface DeviceSensorCardProps {
  deviceId: string;
  apiRange: ReturnType<typeof toApiChartRange>;
  displayRange: DisplayChartRange;
  reading: LatestReadingItemResponse;
  chartType: SensorChartType;
  onChartTypeChange: (type: SensorChartType) => void;
  onExpand: (snapshot: {
    title: string;
    icon: SensorIcon;
    data: MetricData;
    colorClass: string;
    barColor: string;
    iconBgClass: string;
    chartType: SensorChartType;
    sensorCode: string;
    thresholds?: SensorThresholds;
  }) => void;
  onChartSnapshot: (snapshot: SensorSnapshot) => void;
  alerts: AlertEventItemResponse[];
  analyticsEnabled: boolean;
  onAnalyticsToggle: (enabled: boolean) => void;
  eventMarkers: EventMarkerData[];
  exportFilename: string;
}

function DeviceSensorCard({
  deviceId,
  apiRange,
  displayRange,
  reading,
  chartType,
  onChartTypeChange,
  onExpand,
  onChartSnapshot,
  alerts,
  analyticsEnabled,
  onAnalyticsToggle,
  eventMarkers,
  exportFilename,
}: DeviceSensorCardProps) {
  const { t } = useTranslation();
  const knownSensor = SENSOR_CONFIG.find((sensor) => sensor.code === reading.sensorCode);
  const chartQuery = useDeviceChart(deviceId, reading.sensorCode, apiRange);
  const trend = useMemo(
    () => deriveAnalytics(chartToTrend(chartQuery.data, displayRange), alerts),
    [alerts, chartQuery.data, displayRange],
  );
  const backendThresholds = useMemo(
    () => thresholdsFromAlertEvents(alerts),
    [alerts],
  );
  const title = formatSensorLabel(
    t,
    reading.sensorCode,
    reading.sensorName || knownSensor?.title || reading.sensorCode,
  );
  const unit = normalizeUnit(reading.unit || chartQuery.data?.unit);
  const metricData: MetricData = {
    value: readingValue(reading),
    unit,
    badge: reading.qualityStatus || t("iot.devices.detail.live"),
    latestUpdatedAt: reading.readingTime,
    trend,
  };

  useEffect(() => {
    onChartSnapshot({
      sensorCode: reading.sensorCode,
      title,
      unit,
      color: knownSensor?.barColor ?? "#64748B",
      data: trend,
      signature: trendSignature(trend),
    });
  }, [knownSensor?.barColor, onChartSnapshot, reading.sensorCode, title, trend, unit]);

  return (
    <IoTMetricCard
      title={title}
      icon={knownSensor?.icon ?? Cpu}
      data={metricData}
      colorClass={knownSensor?.colorClass ?? "text-slate-600"}
      barColor={knownSensor?.barColor ?? "#64748B"}
      iconBgClass={knownSensor?.iconBgClass ?? "bg-slate-50"}
      isLoading={chartQuery.isLoading}
      isError={chartQuery.isError}
      onRetry={() => void chartQuery.refetch()}
      chartType={chartType}
      onChartTypeChange={onChartTypeChange}
      thresholds={backendThresholds}
      showThresholds={Boolean(backendThresholds)}
      analyticsEnabled={analyticsEnabled}
      onAnalyticsToggle={onAnalyticsToggle}
      eventMarkers={eventMarkers}
      exportFilename={exportFilename}
      onExpand={() =>
        onExpand({
          title,
          icon: knownSensor?.icon ?? Cpu,
          data: metricData,
          colorClass: knownSensor?.colorClass ?? "text-slate-600",
          barColor: knownSensor?.barColor ?? "#64748B",
          iconBgClass: knownSensor?.iconBgClass ?? "bg-slate-50",
          chartType,
          sensorCode: reading.sensorCode,
          thresholds: backendThresholds,
        })
      }
    />
  );
}

interface DeviceMediaPanelProps {
  mediaEvents: DisplayDeviceMediaEvent[];
  canCapture: boolean;
  isCapturing: boolean;
  isPolling: boolean;
  deviceSchedule?: DisplayCameraSchedule | null;
  deviceSchedules: DisplayCameraSchedule[];
  isRunningSchedule: boolean;
  isCreatingSchedule: boolean;
  isDetectingDisease: boolean;
  onCapture: () => Promise<void>;
  onRunScheduleNow: () => Promise<void>;
  onRunSchedule: (schedule: DisplayCameraSchedule) => Promise<void>;
  onCreateSchedule: (payload: {
    timeOfDay: string;
    recurrence: CameraScheduleRecurrence;
    resolution: "QVGA" | "VGA" | "HD";
    quality: "LOW" | "MEDIUM" | "HIGH";
    uploadEndpoint?: string;
  }) => Promise<void>;
  onUpdateSchedule: (
    schedule: DisplayCameraSchedule,
    payload: {
      enabled: boolean;
      timeOfDay: string;
      recurrence: CameraScheduleRecurrence;
      resolution: "QVGA" | "VGA" | "HD";
      quality: "LOW" | "MEDIUM" | "HIGH";
      uploadEndpoint?: string;
    },
  ) => Promise<void>;
  onDeleteSchedule: (schedule: DisplayCameraSchedule) => Promise<void>;
  onDetectLatest: (media: DisplayDeviceMediaEvent) => Promise<void>;
}

function DeviceMediaPanel({
  mediaEvents,
  canCapture,
  isCapturing,
  isPolling,
  deviceSchedule,
  deviceSchedules,
  isRunningSchedule,
  isCreatingSchedule,
  isDetectingDisease,
  onCapture,
  onRunScheduleNow,
  onRunSchedule,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onDetectLatest,
}: DeviceMediaPanelProps) {
  const { t } = useTranslation();
  const [scheduleTime, setScheduleTime] = useState("08:30");
  const [scheduleRecurrence, setScheduleRecurrence] = useState<CameraScheduleRecurrence>("DAILY");
  const [scheduleResolution, setScheduleResolution] = useState<"QVGA" | "VGA" | "HD">("VGA");
  const [scheduleQuality, setScheduleQuality] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [uploadEndpoint, setUploadEndpoint] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const latestMedia = mediaEvents[0];
  const latestUploaded = mediaEvents.find(
    (event) => event.status === "UPLOADED" && event.fileId,
  );
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const selectedMedia = mediaEvents.find((event) => event.id === selectedMediaId) ?? null;
  const selectedMediaSource =
    selectedMedia?.analysis?.fileUrl ?? selectedMedia?.fileId ?? null;
  const selectedAnalysis = selectedMedia?.analysis;
  const isWaiting = isCapturing || isPolling || isMediaWaiting(latestMedia);
  const failedLatest =
    latestMedia?.status === "FAILED" || latestMedia?.status === "TIMEOUT"
      ? latestMedia
      : null;

  useEffect(() => {
    if (selectedMediaId && !mediaEvents.some((event) => event.id === selectedMediaId)) {
      setSelectedMediaId(null);
    }
  }, [mediaEvents, selectedMediaId]);

  const resetScheduleForm = () => {
    setScheduleTime("08:30");
    setScheduleRecurrence("DAILY");
    setScheduleResolution("VGA");
    setScheduleQuality("MEDIUM");
    setUploadEndpoint("");
    setEditingScheduleId(null);
  };

  const startEditSchedule = (schedule: DeviceCameraScheduleResponse) => {
    setEditingScheduleId(getScheduleId(schedule));
    setScheduleTime(schedule.timeOfDay?.slice(0, 5) || "08:30");
    setScheduleRecurrence(schedule.recurrence as CameraScheduleRecurrence);
    setScheduleResolution((schedule.resolution as "QVGA" | "VGA" | "HD") || "VGA");
    setScheduleQuality((schedule.quality as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM");
    setUploadEndpoint(schedule.uploadEndpoint ?? "");
    setScheduleError(null);
  };

  const submitSchedule = async () => {
    if (uploadEndpoint.trim() && !isHttpUrl(uploadEndpoint.trim())) {
      setScheduleError(t("iot.cameraSchedules.validation.uploadEndpoint"));
      return;
    }

    setScheduleError(null);
    const payload = {
      enabled: true,
      timeOfDay: scheduleTime.length === 5 ? `${scheduleTime}:00` : scheduleTime,
      recurrence: scheduleRecurrence,
      resolution: scheduleResolution,
      quality: scheduleQuality,
      uploadEndpoint: uploadEndpoint.trim() || undefined,
    };

    const editingSchedule = editingScheduleId
      ? deviceSchedules.find((schedule) => getScheduleId(schedule) === editingScheduleId)
      : null;

    if (editingSchedule) {
      await onUpdateSchedule(editingSchedule, {
        ...payload,
        enabled: editingSchedule.enabled,
      });
    } else {
      await onCreateSchedule(payload);
    }
    resetScheduleForm();
  };

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div>
          <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
            {t("iot.devices.media.title")}
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            {t("iot.devices.media.description")}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {deviceSchedule ? (
            <button
              type="button"
              onClick={() => void onRunScheduleNow()}
              disabled={!canCapture || isRunningSchedule}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {isRunningSchedule
                ? t("iot.devices.media.capturing")
                : t("iot.cameraSchedules.runScheduleNow")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void onCapture()}
            disabled={!canCapture || isCapturing}
            className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera className="mr-2 h-4 w-4" strokeWidth={2.5} />
            {isCapturing ? t("iot.devices.media.capturing") : t("iot.devices.media.captureImage")}
          </button>
          {latestUploaded?.fileId ? (
            <button
              type="button"
              onClick={() => void onDetectLatest(latestUploaded)}
              disabled={isDetectingDisease}
              className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ScanSearch className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {isDetectingDisease ? t("iot.devices.media.analyzing") : t("iot.devices.media.triggerAnalysis")}
            </button>
          ) : null}
        </div>
      </div>

      {deviceSchedules.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-black text-emerald-900">
              {t("iot.cameraSchedules.title")}
            </h4>
            <span className="text-xs font-black text-emerald-700">
              {deviceSchedules.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {deviceSchedules.map((schedule) => (
              <div key={getScheduleId(schedule)} className="rounded-xl border border-emerald-100 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-slate-800">
                    {schedule.display.timeOfDay} · {schedule.display.recurrence}
                  </span>
                  <span className={badgeClass(schedule.enabled ? "green" : "slate")}>
                    {schedule.display.enabled}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {t("iot.cameraSchedules.nextRunAt")}: {formatDateTime(schedule.nextRunAt)}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {t("iot.cameraSchedules.lastRunAt")}: {formatDateTime(schedule.lastRunAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onRunSchedule(schedule)}
                    disabled={!canCapture || isRunningSchedule}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {t("iot.cameraSchedules.runNow")}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditSchedule(schedule)}
                    className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700"
                  >
                    {t("iot.cameraSchedules.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("iot.cameraSchedules.deleteConfirm"))) {
                        void onDeleteSchedule(schedule);
                      }
                    }}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {t("iot.cameraSchedules.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canCapture ? (
        <form
          className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[0.7fr_0.7fr_0.7fr_0.7fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void submitSchedule();
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            {t("iot.cameraSchedules.timeOfDay")}
            <input
              type="time"
              value={scheduleTime}
              onChange={(event) => setScheduleTime(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            {t("iot.cameraSchedules.recurrence")}
            <select
              value={scheduleRecurrence}
              onChange={(event) => setScheduleRecurrence(event.target.value as CameraScheduleRecurrence)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="DAILY">{t("iot.cameraSchedules.recurrenceDaily")}</option>
              <option value="WEEKLY">{t("iot.cameraSchedules.recurrenceWeekly")}</option>
              <option value="MONTHLY">{t("iot.cameraSchedules.recurrenceMonthly")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            {t("iot.cameraSchedules.resolution")}
            <select
              value={scheduleResolution}
              onChange={(event) => setScheduleResolution(event.target.value as "QVGA" | "VGA" | "HD")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="QVGA">{formatCameraResolutionLabel(t, "QVGA")}</option>
              <option value="VGA">{formatCameraResolutionLabel(t, "VGA")}</option>
              <option value="HD">{formatCameraResolutionLabel(t, "HD")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            {t("iot.cameraSchedules.quality")}
            <select
              value={scheduleQuality}
              onChange={(event) => setScheduleQuality(event.target.value as "LOW" | "MEDIUM" | "HIGH")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="LOW">{formatCameraQualityLabel(t, "LOW")}</option>
              <option value="MEDIUM">{formatCameraQualityLabel(t, "MEDIUM")}</option>
              <option value="HIGH">{formatCameraQualityLabel(t, "HIGH")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            {t("iot.cameraSchedules.uploadEndpoint")}
            <input
              value={uploadEndpoint}
              onChange={(event) => setUploadEndpoint(event.target.value)}
              placeholder={t("iot.cameraSchedules.uploadEndpointPlaceholder")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </label>
          {scheduleError ? (
            <p className="md:col-span-full text-sm font-bold text-red-600">{scheduleError}</p>
          ) : null}
          <button
            type="submit"
            disabled={isCreatingSchedule}
            className="inline-flex items-center justify-center self-end rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            {isCreatingSchedule
              ? t("iot.cameraSchedules.loading")
              : editingScheduleId
                ? t("iot.cameraSchedules.save")
                : t("iot.cameraSchedules.create")}
          </button>
          {editingScheduleId ? (
            <button
              type="button"
              onClick={resetScheduleForm}
              className="inline-flex items-center justify-center self-end rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
            >
              {t("common.cancel")}
            </button>
          ) : null}
        </form>
      ) : null}

      {!canCapture ? (
        <p className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
          {t("iot.devices.media.requiresClaimed")}
        </p>
      ) : null}

      {isWaiting ? (
        <p className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {isCapturing
            ? t("iot.devices.media.capturing")
            : t("iot.devices.media.waitingUpload")}
        </p>
      ) : null}

      {failedLatest ? (
        <p role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {failedLatest.status === "TIMEOUT"
            ? t("iot.devices.media.timeout")
            : failedLatest.error || t("iot.devices.media.captureFailed")}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
          {latestUploaded?.fileId ? (
            <MediaImage
              source={latestUploaded.fileId}
              alt={t("iot.devices.media.latestImageAlt")}
              className="h-[320px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[320px] flex-col items-center justify-center gap-3 text-slate-500">
              <ImageOff className="h-8 w-8" strokeWidth={2.5} />
              <span className="text-sm font-bold">{t("iot.devices.media.noUploadedImage")}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">
            {t("iot.devices.media.mediaHistory")}
          </h4>
          {mediaEvents.length === 0 ? (
            <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
              {t("iot.devices.media.noEvents")}
            </p>
          ) : null}
          {mediaEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedMediaId(event.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:border-[#245A34]/40 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 ${
                selectedMedia?.id === event.id
                  ? "border-[#245A34]/50 bg-white shadow-sm"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {event.fileId || event.analysis?.fileUrl ? (
                    <MediaImage
                      source={event.analysis?.fileUrl ?? event.fileId ?? ""}
                      alt={t("iot.devices.media.latestImageAlt")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <ImageOff className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className={badgeClass(statusTone(event.status))}>
                      {formatMediaStatusLabel(t, event.status)}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-slate-500">
                      {formatDateTime(event.uploadedAt || event.capturedAt || event.requestedAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {event.fileId ? event.display.size : event.display.fallbackMessage}
                  </p>
                  {event.analysis ? (
                    <div className={`mt-2 text-xs font-black ${event.analysis.diseaseDetected ? "text-red-600" : "text-emerald-700"}`}>
                      {event.display.analysis?.summary}
                      {event.analysis.alertEventId ? (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700">
                          {t("iot.devices.media.analysis.alertCreated")}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-black text-slate-400">{t("iot.devices.media.analysis.notAnalyzed")}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedMedia ? (
        <ModalShell
          title={t("iot.devices.media.mediaDetail")}
          titleId="device-media-detail-title"
          subtitle={
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {formatDateTime(
                selectedMedia.uploadedAt || selectedMedia.capturedAt || selectedMedia.requestedAt,
              )}
            </p>
          }
          icon={<ScanSearch className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />}
          maxWidth="sm:max-w-5xl"
          onClose={() => setSelectedMediaId(null)}
        >
          <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {selectedMediaSource ? (
                <MediaImage
                  source={selectedMediaSource}
                  alt={t("iot.devices.media.latestImageAlt")}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-slate-500">
                  <ImageOff className="h-8 w-8" strokeWidth={2.5} />
                  <span className="text-sm font-bold">{t("iot.devices.media.noUploadedImage")}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={badgeClass(statusTone(selectedMedia.status))}>
                    {formatMediaStatusLabel(t, selectedMedia.status)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                    {formatCameraTriggerLabel(t, selectedMedia.triggerType)}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-slate-500">{t("iot.devices.media.capturedAt")}</dt>
                    <dd className="text-right font-black text-slate-700">{formatDateTime(selectedMedia.capturedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-slate-500">{t("iot.devices.media.uploadedAt")}</dt>
                    <dd className="text-right font-black text-slate-700">{formatDateTime(selectedMedia.uploadedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-slate-500">{t("iot.devices.media.size")}</dt>
                    <dd className="text-right font-black text-slate-700">
                      {selectedMedia.display.size}
                    </dd>
                  </div>
                </dl>
                {selectedMedia.error ? (
                  <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
                    {selectedMedia.error}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">
                  {t("iot.devices.media.analysis.title")}
                </h4>
                {selectedAnalysis ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={badgeClass(selectedAnalysis.diseaseDetected ? "red" : "green")}>
                        {selectedMedia.display.analysis?.status}
                      </span>
                      {selectedAnalysis.alertEventId ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                          {t("iot.devices.media.analysis.alertCreated")}
                        </span>
                      ) : null}
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">{t("iot.devices.media.analysis.disease")}</dt>
                        <dd className="text-right font-black text-slate-700">
                          {selectedMedia.display.analysis?.diseaseName ?? "-"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">{t("iot.devices.media.analysis.severity")}</dt>
                        <dd className="text-right font-black text-slate-700">{selectedMedia.display.analysis?.severity ?? "-"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">{t("iot.devices.media.analysis.confidence")}</dt>
                        <dd className="text-right font-black text-slate-700">
                          {selectedMedia.display.analysis?.confidence ?? "-"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">{t("iot.devices.media.analysis.analyzedAt")}</dt>
                        <dd className="text-right font-black text-slate-700">{selectedMedia.display.analysis?.analyzedAt ?? "-"}</dd>
                      </div>
                    </dl>
                    {selectedAnalysis.notes || selectedAnalysis.error ? (
                      <p className={`rounded-xl px-3 py-2 text-sm font-bold ${
                        selectedAnalysis.error
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-50 text-slate-600"
                      }`}>
                        {selectedAnalysis.error ?? selectedAnalysis.notes}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">
                    {t("iot.devices.media.analysis.notAnalyzed")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </section>
  );
}

interface ConfigFormProps {
  config: DeviceConfigResponse;
  canManageConfig: boolean;
  isSaving: boolean;
  onSave: (payload: UpdateDeviceConfigRequest) => Promise<void>;
}

function ConfigForm({
  config,
  canManageConfig,
  isSaving,
  onSave,
}: ConfigFormProps) {
  const { t } = useTranslation();
  const [samplingIntervalSec, setSamplingIntervalSec] = useState(
    String(config.samplingIntervalSec ?? ""),
  );
  const [publishIntervalSec, setPublishIntervalSec] = useState(
    String(config.publishIntervalSec ?? ""),
  );
  const [offlineTimeoutSec, setOfflineTimeoutSec] = useState(
    String(config.offlineTimeoutSec ?? ""),
  );
  const [alertEnabled, setAlertEnabled] = useState(Boolean(config.alertEnabled));
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: UpdateDeviceConfigRequest = {
      samplingIntervalSec: Number(samplingIntervalSec),
      publishIntervalSec: Number(publishIntervalSec),
      offlineTimeoutSec: Number(offlineTimeoutSec),
      alertEnabled,
    };
    const validationError = validateConfig(payload, t);
    setValidationMessage(validationError);

    if (validationError) return;

    await onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("iot.devices.config.samplingIntervalSec")}
          </span>
          <input
            value={samplingIntervalSec}
            onChange={(event) => setSamplingIntervalSec(event.target.value)}
            type="number"
            min={1}
            disabled={!canManageConfig || isSaving}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34] disabled:bg-slate-50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("iot.devices.config.publishIntervalSec")}
          </span>
          <input
            value={publishIntervalSec}
            onChange={(event) => setPublishIntervalSec(event.target.value)}
            type="number"
            min={1}
            disabled={!canManageConfig || isSaving}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34] disabled:bg-slate-50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("iot.devices.config.offlineTimeoutSec")}
          </span>
          <input
            value={offlineTimeoutSec}
            onChange={(event) => setOfflineTimeoutSec(event.target.value)}
            type="number"
            min={1}
            disabled={!canManageConfig || isSaving}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34] disabled:bg-slate-50"
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          checked={alertEnabled}
          onChange={(event) => setAlertEnabled(event.target.checked)}
          disabled={!canManageConfig || isSaving}
          className="h-4 w-4 accent-[#245A34]"
        />
        {t("iot.devices.config.alertEnabled")}
      </label>

      {validationMessage ? (
        <p role="alert" className="text-sm font-bold text-red-600">
          {validationMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canManageConfig || isSaving}
        className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="mr-2 h-4 w-4" strokeWidth={2.5} />
        {isSaving ? t("iot.devices.config.saving") : t("iot.devices.config.save")}
      </button>
    </form>
  );
}

export function DeviceDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { deviceId } = useParams();
  const resolvedDeviceId = deviceId ?? "";
  const [range, setRange] = useState<DisplayChartRange>("D1");
  const [chartType, setChartType] = useState<SensorChartType>("area");
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareSensors, setCompareSensors] = useState<string[]>(
    SENSOR_CONFIG.map((sensor) => sensor.code),
  );
  const [chartSnapshots, setChartSnapshots] = useState<Record<string, SensorSnapshot>>({});
  const [expandedSensor, setExpandedSensor] = useState<{
    title: string;
    icon: SensorIcon;
    data: MetricData;
    colorClass: string;
    barColor: string;
    iconBgClass: string;
    chartType: SensorChartType;
    sensorCode: string;
    thresholds?: SensorThresholds;
  } | null>(null);
  const apiChartRange = toApiChartRange(range);
  const [captureRequestId, setCaptureRequestId] = useState<string | null>(null);
  const [isEditDeviceOpen, setIsEditDeviceOpen] = useState(false);
  const [isReleaseDeviceOpen, setIsReleaseDeviceOpen] = useState(false);
  const pushWatchUntilRef = useRef(0);
  const completedCaptureRef = useRef<string | null>(null);

  const deviceDetailQuery = useDeviceDetail(resolvedDeviceId, !!deviceId);
  const latestReadingsQuery = useDeviceLatestReadings(resolvedDeviceId, !!deviceId);
  const configQuery = useDeviceConfig(resolvedDeviceId, !!deviceId);
  const mediaQuery = useDeviceMedia(resolvedDeviceId, !!deviceId, 10_000);
  const device = deviceDetailQuery.data;
  const deviceUid = device?.deviceUid;
  const cameraSchedulesQuery = useDeviceSchedulesQuery(deviceUid, !!deviceUid, 10_000);
  const alertEventsQuery = useAlertEvents(
    {
      deviceId: resolvedDeviceId,
      size: 100,
      sortBy: "openedAt",
      sortDir: "desc",
    },
    !!deviceId,
  );
  const updateConfigMutation = useUpdateDeviceConfig(resolvedDeviceId);
  const updateDeviceMutation = useUpdateDeviceMutation();
  const releaseDeviceMutation = useReleaseDeviceMutation();
  const pushConfigMutation = usePushDeviceConfig(resolvedDeviceId);
  const captureImageMutation = useCaptureDeviceImage(resolvedDeviceId);
  const runScheduleNowMutation = useRunScheduledCameraMutation(deviceUid);
  const createScheduleMutation = useCreateDeviceCameraScheduleMutation();
  const updateScheduleMutation = useUpdateDeviceScheduleMutation(deviceUid);
  const deleteScheduleMutation = useDeleteDeviceScheduleMutation(deviceUid);
  const detectDiseaseMutation = useDiseaseDetectMutation();

  useEffect(() => {
    if (!deviceId) return undefined;

    const intervalId = window.setInterval(() => {
      const shouldPoll = Date.now() < pushWatchUntilRef.current;
      const currentStatus = configQuery.data?.lastPushStatus;
      if (!shouldPoll || currentStatus === "ACKED" || currentStatus === "FAILED") {
        return;
      }

      void configQuery.refetch();
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [configQuery, deviceId]);

  const config = configQuery.data;
  const mediaEvents = useMemo(() => mediaQuery.data ?? [], [mediaQuery.data]);
  const deviceSchedules = useMemo(() => cameraSchedulesQuery.data ?? [], [cameraSchedulesQuery.data]);
  const deviceSchedule = deviceSchedules?.[0] ?? null;
  const watchedCaptureEvent = useMemo(
    () =>
      captureRequestId
        ? mediaEvents.find((event) => event.requestId === captureRequestId)
        : null,
    [captureRequestId, mediaEvents],
  );
  const isMediaPolling =
    captureRequestId !== null &&
    (!watchedCaptureEvent || isMediaWaiting(watchedCaptureEvent));
  const canManageConfig =
    device?.isActive === true && device?.provisioningStatus === "CLAIMED";
  const isDeviceActionPending =
    updateDeviceMutation.isPending || releaseDeviceMutation.isPending;
  const handleUpdateDevice = async (payload: UpdateDeviceRequest) => {
    try {
      await updateDeviceMutation.mutateAsync({
        deviceId: resolvedDeviceId,
        payload,
      });
      toast.success(t("iot.devices.edit.success"));
      setIsEditDeviceOpen(false);
      void deviceDetailQuery.refetch();
    } catch (error) {
      toast.error(getDeviceManagementErrorMessage(error, t, "edit"));
      throw error;
    }
  };
  const handleReleaseDevice = async () => {
    try {
      await releaseDeviceMutation.mutateAsync({ deviceId: resolvedDeviceId });
      toast.success(t("iot.devices.release.success"));
      setIsReleaseDeviceOpen(false);
      navigate(ROUTES.DASHBOARD.DEVICES);
    } catch (error) {
      toast.error(getDeviceManagementErrorMessage(error, t, "release"));
    }
  };
  const rememberChartSnapshot = useCallback((snapshot: SensorSnapshot) => {
    setChartSnapshots((current) => {
      const previous = current[snapshot.sensorCode];
      if (
        previous &&
        previous.title === snapshot.title &&
        previous.unit === snapshot.unit &&
        previous.color === snapshot.color &&
        previous.signature === snapshot.signature
      ) {
        return current;
      }
      return { ...current, [snapshot.sensorCode]: snapshot };
    });
  }, []);
  const selectedCompareSeries = compareSensors
    .map((sensorCode) => chartSnapshots[sensorCode])
    .filter((snapshot): snapshot is SensorSnapshot => Boolean(snapshot));

  useEffect(() => {
    if (!isMediaPolling) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void mediaQuery.refetch();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isMediaPolling, mediaQuery]);

  useEffect(() => {
    if (
      !captureRequestId ||
      !watchedCaptureEvent ||
      isMediaWaiting(watchedCaptureEvent) ||
      completedCaptureRef.current === captureRequestId
    ) {
      return;
    }

    completedCaptureRef.current = captureRequestId;
    void deviceDetailQuery.refetch();
  }, [captureRequestId, deviceDetailQuery, watchedCaptureEvent]);

  useEffect(() => {
    if (!captureRequestId) {
      return;
    }

    const latest = mediaEvents[0];
    if (
      latest &&
      !latest.requestId &&
      !isMediaWaiting(latest) &&
      completedCaptureRef.current !== captureRequestId
    ) {
      completedCaptureRef.current = captureRequestId;
      void deviceDetailQuery.refetch();
    }
  }, [captureRequestId, deviceDetailQuery, mediaEvents]);

  const visibleReadings = useMemo(() => {
    const latestReadings =
      latestReadingsQuery.data && latestReadingsQuery.data.length > 0
        ? latestReadingsQuery.data
        : device?.latestReadings ?? [];
    const priority = new Map<string, number>(
      SENSOR_CONFIG.map((sensor, index) => [sensor.code, index]),
    );
    return [...latestReadings].sort((first, second) => {
      const firstRank = priority.get(first.sensorCode) ?? 99;
      const secondRank = priority.get(second.sensorCode) ?? 99;
      return firstRank - secondRank || first.sensorCode.localeCompare(second.sensorCode);
    });
  }, [device?.latestReadings, latestReadingsQuery.data]);
  const deviceAlerts = alertEventsQuery.data?.items ?? [];

  const displayedExpandedSensor = useMemo(() => {
    if (!expandedSensor) return null;
    const snapshot = chartSnapshots[expandedSensor.sensorCode];
    if (!snapshot || snapshot.data === expandedSensor.data.trend) {
      return expandedSensor;
    }
    return {
      ...expandedSensor,
      data: {
        ...expandedSensor.data,
        trend: snapshot.data,
        unit: snapshot.unit,
      },
    };
  }, [chartSnapshots, expandedSensor]);

  if (!deviceId) {
    return <Navigate to={ROUTES.DASHBOARD.DEVICES} replace />;
  }

  const handleSaveConfig = async (payload: UpdateDeviceConfigRequest) => {
    await updateConfigMutation.mutateAsync(payload);
    await configQuery.refetch();
    await deviceDetailQuery.refetch();
  };

  const handlePushConfig = async () => {
    pushWatchUntilRef.current = Date.now() + 45_000;
    await pushConfigMutation.mutateAsync();
    await configQuery.refetch();
    await deviceDetailQuery.refetch();
  };

  const handleCaptureImage = async () => {
    const response = await captureImageMutation.mutateAsync();
    completedCaptureRef.current = null;
    setCaptureRequestId(response.data.requestId);
    await mediaQuery.refetch();
  };

  const handleRunScheduleNow = async () => {
    if (!deviceSchedule) return;
    await handleRunSchedule(deviceSchedule);
  };

  const handleRunSchedule = async (schedule: DeviceCameraScheduleResponse) => {
    const response = await runScheduleNowMutation.mutateAsync({
      scheduleId: getScheduleId(schedule),
      deviceUid,
    });
    const requestId = response.data.lastMediaEvent?.requestId ?? null;
    completedCaptureRef.current = null;
    setCaptureRequestId(requestId);
    await mediaQuery.refetch();
    await cameraSchedulesQuery.refetch();
  };

  const handleCreateCameraSchedule = async (payload: {
    timeOfDay: string;
    recurrence: CameraScheduleRecurrence;
    resolution: "QVGA" | "VGA" | "HD";
    quality: "LOW" | "MEDIUM" | "HIGH";
    uploadEndpoint?: string;
  }) => {
    if (!deviceUid) return;
    await createScheduleMutation.mutateAsync({
      deviceUid,
      payload: {
        enabled: true,
        timeOfDay: payload.timeOfDay,
        recurrence: payload.recurrence,
        resolution: payload.resolution,
        quality: payload.quality,
        uploadEndpoint: payload.uploadEndpoint,
      },
    });
    await cameraSchedulesQuery.refetch();
  };

  const handleUpdateCameraSchedule = async (
    schedule: DeviceCameraScheduleResponse,
    payload: {
      enabled: boolean;
      timeOfDay: string;
      recurrence: CameraScheduleRecurrence;
      resolution: "QVGA" | "VGA" | "HD";
      quality: "LOW" | "MEDIUM" | "HIGH";
      uploadEndpoint?: string;
    },
  ) => {
    if (!deviceUid) return;
    await updateScheduleMutation.mutateAsync({
      scheduleId: getScheduleId(schedule),
      deviceUid,
      payload,
    });
    await cameraSchedulesQuery.refetch();
  };

  const handleDeleteCameraSchedule = async (schedule: DeviceCameraScheduleResponse) => {
    if (!deviceUid) return;
    await deleteScheduleMutation.mutateAsync({
      scheduleId: getScheduleId(schedule),
      deviceUid,
    });
    await cameraSchedulesQuery.refetch();
  };

  const handleDetectLatestMedia = async (media: DeviceMediaEventResponse) => {
    if (!deviceUid || !media.fileId) return;
    await detectDiseaseMutation.mutateAsync({
      deviceUid,
      payload: {
        mediaEventId: media.id,
        fileId: media.fileId,
        deviceUid,
        force: true,
      },
    });
    await mediaQuery.refetch();
    await alertEventsQuery.refetch();
  };

  const isPageLoading = deviceDetailQuery.isLoading || configQuery.isLoading;
  const hasPageError = deviceDetailQuery.isError || configQuery.isError;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {isPageLoading ? (
        <div aria-label={t("iot.devices.detail.loading")} className="space-y-5">
          <div className="h-36 rounded-[2rem] bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-24 rounded-3xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : null}

      {hasPageError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-red-700">
                {t("iot.devices.detail.error")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                {t("iot.devices.detail.errorDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void deviceDetailQuery.refetch();
                void configQuery.refetch();
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {t("iot.devices.detail.retry")}
            </button>
          </div>
        </div>
      ) : null}

      {!isPageLoading && !hasPageError && !device ? (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-4 text-lg font-black text-slate-800">
            {t("iot.devices.detail.notFound")}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {t("iot.devices.detail.notFoundDescription")}
          </p>
        </div>
      ) : null}

      {device && config ? (
        <>
          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 lg:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[30px] font-black text-[#111827] tracking-tight">
                    {readableDeviceName(t, device)}
                  </h2>
                  <span className={badgeClass(statusTone(device.status))}>
                    {formatDeviceStatusLabel(t, device.status)}
                  </span>
                  <span
                    className={badgeClass(statusTone(device.provisioningStatus))}
                  >
                    {formatDeviceStatusLabel(t, device.provisioningStatus)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {formatDeviceTypeLabel(t, device.deviceType)} · {formatDeviceStatusLabel(t, device.status)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                <div className="flex items-center gap-3 rounded-3xl bg-[#F2FCF4] px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-[#245A34]" strokeWidth={3} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#245A34]">
                      {t("iot.devices.detail.lastSeenAt")}
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {formatDateTime(device.lastSeenAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditDeviceOpen(true)}
                    disabled={isDeviceActionPending}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Settings2 className="h-4 w-4" />
                    {t("iot.devices.actions.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReleaseDeviceOpen(true)}
                    disabled={isDeviceActionPending}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("iot.devices.actions.release")}
                  </button>
                </div>
              </div>
            </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoTile label={t("iot.devices.detail.type")} value={formatDeviceTypeLabel(t, device.deviceType)} />
              <InfoTile
                label={t("iot.devices.detail.firmwareVersion")}
                value={device.firmwareVersion || t("iot.devices.detail.unknown")}
              />
              <InfoTile
                label={t("iot.common.farm")}
                value={device.farmPlotId ? t("iot.devices.detail.farmPlotAssigned") : t("iot.devices.detail.farmPlotUnassigned")}
              />
              <InfoTile
                label={t("iot.common.zone")}
                value={device.zoneId ? t("iot.devices.detail.zoneAssigned") : t("iot.devices.detail.zoneUnassigned")}
              />
            </div>

            {isOfflineClaimedDevice(device) ? (
              <div className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <WifiOff className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-black text-amber-800">
                        {t("iot.devices.detail.offlineTitle")}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-amber-700">
                        {t("iot.devices.detail.offlineDescription")}
                      </p>
                    </div>
                    <ol className="space-y-2 text-sm font-semibold text-amber-800">
                      <li>{t("iot.devices.detail.offlineStepPower")}</li>
                      <li>{t("iot.devices.detail.offlineStepWifi")}</li>
                      <li>{t("iot.devices.detail.offlineStepPortal")}</li>
                      <li>{t("iot.devices.detail.offlineStepCredential")}</li>
                      <li>{t("iot.devices.detail.offlineStepWait")}</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section>
            <div className="mb-6">
              <div>
                <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
                  {t("iot.devices.detail.latestReadings")}
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  {t("iot.devices.detail.latestReadingsDescription")}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <label className="inline-flex items-center gap-3 text-sm font-black text-slate-700">
                  <input
                    type="checkbox"
                    checked={compareEnabled}
                    onChange={(event) => setCompareEnabled(event.target.checked)}
                    className="h-4 w-4 accent-[#245A34]"
                    aria-checked={compareEnabled}
                  />
                  {t("iot.devices.detail.compareMode")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {visibleReadings.map((reading) => {
                    const knownSensor = SENSOR_CONFIG.find(
                      (sensor) => sensor.code === reading.sensorCode,
                    );
                    const checked = compareSensors.includes(reading.sensorCode);
                    return (
                      <label
                        key={reading.sensorCode}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setCompareSensors((current) =>
                              event.target.checked
                                ? Array.from(new Set([...current, reading.sensorCode]))
                                : current.filter((sensorCode) => sensorCode !== reading.sensorCode),
                            );
                          }}
                          className="h-3.5 w-3.5 accent-[#245A34]"
                          aria-checked={checked}
                        />
                        {formatSensorLabel(
                          t,
                          reading.sensorCode,
                          reading.sensorName || knownSensor?.title || reading.sensorCode,
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {compareEnabled ? (
              <div className="mb-6">
                <CompareChart
                  series={selectedCompareSeries}
                  analyticsEnabled={analyticsEnabled}
                  exportFilename={chartExportFilename(
                    `device-${deviceId}-compare`,
                    compareSensors.join("-") || "sensors",
                    range,
                  )}
                />
              </div>
            ) : null}

            <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("iot.devices.detail.chartDisplay")}
                </p>
                <p className="text-sm font-semibold text-slate-500">
                  {t("iot.devices.detail.chartDisplayDescription")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                  {DISPLAY_CHART_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={range === option.value}
                      onClick={() => setRange(option.value)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        range === option.value
                          ? "bg-[#245A34] text-white shadow-sm"
                          : "text-slate-500 hover:bg-white hover:text-[#245A34]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                  {CHART_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      aria-pressed={chartType === type.value}
                      onClick={() => setChartType(type.value)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        chartType === type.value
                          ? "bg-[#245A34] text-white shadow-sm"
                          : "text-slate-500 hover:bg-white hover:text-[#245A34]"
                      }`}
                    >
                      {t(CHART_TYPE_LABEL_KEYS[type.value])}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-pressed={analyticsEnabled}
                  onClick={() => setAnalyticsEnabled((current) => !current)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    analyticsEnabled
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t("iot.devices.detail.analytics")}
                </button>
              </div>
            </div>

            {latestReadingsQuery.isLoading ? (
              <div aria-label={t("iot.devices.detail.loadingReadings")} className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {[0, 1].map((item) => (
                  <div key={item} className="h-[240px] rounded-3xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : null}

            {!latestReadingsQuery.isLoading && visibleReadings.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-black text-slate-800">
                  {t("iot.devices.detail.noReadings")}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {t("iot.devices.detail.noReadingsDescription")}
                </p>
              </div>
            ) : null}

            {visibleReadings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {visibleReadings.map((reading) => (
                  <DeviceSensorCard
                    key={reading.sensorCode}
                    deviceId={deviceId}
                    apiRange={apiChartRange}
                    displayRange={range}
                    reading={reading}
                    chartType={chartType}
                    onChartTypeChange={setChartType}
                    onExpand={setExpandedSensor}
                    onChartSnapshot={rememberChartSnapshot}
                    alerts={deviceAlerts.filter(
                      (alert) => alert.sensorTypeId === reading.sensorTypeId,
                    )}
                    analyticsEnabled={analyticsEnabled}
                    onAnalyticsToggle={setAnalyticsEnabled}
                    eventMarkers={createDataUpdateMarker(reading.readingTime)}
                    exportFilename={chartExportFilename(
                      `device-${deviceId}`,
                      reading.sensorCode,
                      range,
                    )}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <DeviceMediaPanel
            mediaEvents={mediaEvents}
            canCapture={canManageConfig}
            isCapturing={captureImageMutation.isPending}
            isPolling={isMediaPolling}
            deviceSchedule={deviceSchedule}
            deviceSchedules={deviceSchedules ?? []}
            isRunningSchedule={runScheduleNowMutation.isPending}
            isCreatingSchedule={createScheduleMutation.isPending}
            isDetectingDisease={detectDiseaseMutation.isPending}
            onCapture={handleCaptureImage}
            onRunScheduleNow={handleRunScheduleNow}
            onRunSchedule={handleRunSchedule}
            onCreateSchedule={handleCreateCameraSchedule}
            onUpdateSchedule={handleUpdateCameraSchedule}
            onDeleteSchedule={handleDeleteCameraSchedule}
            onDetectLatest={handleDetectLatestMedia}
          />

          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 lg:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
              <div>
                <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
                  {t("iot.devices.config.title")}
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  {t("iot.devices.config.description")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handlePushConfig()}
                disabled={!canManageConfig || pushConfigMutation.isPending}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" strokeWidth={2.5} />
                {pushConfigMutation.isPending ? t("iot.devices.config.pushing") : t("iot.devices.config.push")}
              </button>
            </div>

            {!canManageConfig ? (
              <p className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                {t("iot.devices.config.actionsDisabled")}
              </p>
            ) : null}

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoTile
                label={t("iot.devices.config.configVersion")}
                value={formatNumber(config.configVersion)}
              />
              <InfoTile
                label={t("iot.devices.config.pushStatus")}
                value={formatConfigStatusLabel(t, config.lastPushStatus)}
              />
              <InfoTile label={t("iot.devices.config.lastAckAt")} value={formatDateTime(config.lastAckAt)} />
              <InfoTile label={t("iot.devices.config.appliedAt")} value={formatDateTime(config.appliedAt)} />
            </div>

            {config.lastPushStatus ? (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className={badgeClass(statusTone(config.lastPushStatus))}>
                  {formatConfigStatusLabel(t, config.lastPushStatus)}
                </span>
                {config.lastPushStatus === "SENT" ||
                config.lastPushStatus === "PENDING" ? (
                  <span className="text-sm font-bold text-slate-500">
                    {t("iot.devices.config.waitingAck")}
                  </span>
                ) : null}
              </div>
            ) : null}

            {config.lastPushError ? (
              <p role="alert" className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {config.lastPushError}
              </p>
            ) : null}

            {updateConfigMutation.isError ? (
              <p role="alert" className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {t("iot.devices.config.updateFailed")}
              </p>
            ) : null}

            {pushConfigMutation.isError ? (
              <p role="alert" className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {t("iot.devices.config.pushFailed")}
              </p>
            ) : null}

            <ConfigForm
              key={`${config.deviceId}-${config.configVersion}-${config.lastPushStatus ?? "none"}`}
              config={config}
              canManageConfig={canManageConfig}
              isSaving={updateConfigMutation.isPending}
              onSave={handleSaveConfig}
            />
          </section>
        </>
      ) : null}

      <EditDeviceModal
        open={isEditDeviceOpen}
        device={device ?? null}
        onClose={() => setIsEditDeviceOpen(false)}
        onSubmit={handleUpdateDevice}
        isSubmitting={updateDeviceMutation.isPending}
      />
      <ReleaseDeviceConfirmDialog
        open={isReleaseDeviceOpen}
        deviceName={device ? readableDeviceName(t, device) : undefined}
        onClose={() => setIsReleaseDeviceOpen(false)}
        onConfirm={handleReleaseDevice}
        isSubmitting={releaseDeviceMutation.isPending}
      />

      {displayedExpandedSensor ? (
        <SensorChartModal
          title={displayedExpandedSensor.title}
          icon={displayedExpandedSensor.icon}
          data={displayedExpandedSensor.data}
          colorClass={displayedExpandedSensor.colorClass}
          barColor={displayedExpandedSensor.barColor}
          iconBgClass={displayedExpandedSensor.iconBgClass}
          chartType={chartType}
          onChartTypeChange={(type) => {
            setChartType(type);
            setExpandedSensor((current) =>
              current ? { ...current, chartType: type } : current,
            );
          }}
          range={range}
          rangeOptions={DISPLAY_CHART_RANGE_OPTIONS}
          onRangeChange={setRange}
          thresholds={displayedExpandedSensor.thresholds}
          isLoading={false}
          isError={false}
          analyticsEnabled={analyticsEnabled}
          onAnalyticsToggle={setAnalyticsEnabled}
          eventMarkers={createDataUpdateMarker(displayedExpandedSensor.data.latestUpdatedAt)}
          exportFilename={chartExportFilename(
            `device-${deviceId}`,
            displayedExpandedSensor.sensorCode,
            range,
          )}
          onClose={() => setExpandedSensor(null)}
        />
      ) : null}
    </div>
  );
}

export default DeviceDetailPage;
