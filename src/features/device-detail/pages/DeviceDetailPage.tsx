import type { ComponentType, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Cpu,
  Droplet,
  ImageOff,
  RefreshCw,
  Save,
  Send,
  Sun,
  Thermometer,
  WifiOff,
  Wind,
} from "lucide-react";
import {
  CHART_TYPES,
  IoTMetricCard,
  type MetricData,
  type SensorChartType,
  type SensorTrend,
} from "../../metrics-view/components/IoTMetricCard";
import { CompareChart } from "../../metrics-view/components/CompareChart";
import { SensorChartModal } from "../../metrics-view/components/SensorChartModal";
import { useAlertEvents } from "../../alerts/queries";
import { MediaImage } from "../../community/components/MediaImage";
import { formatDateTime, formatNumber } from "../../metrics-view/utils/format";
import {
  deviceTypeLabel,
  readableDeviceName,
} from "../../device-onboarding/utils/deviceLabels";
import { useTranslation } from "../../../i18n";
import type { TFunction } from "../../../i18n/context";
import {
  formatConfigStatusLabel,
  formatDeviceStatusLabel,
  formatMediaStatusLabel,
  formatSensorLabel,
} from "../../iot/utils/iotTranslation";
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
  useUpdateDeviceConfig,
} from "../queries";
import { ROUTES } from "../../../lib/routes";
import type {
  DeviceConfigResponse,
  DeviceDetailResponse,
  DeviceMediaEventResponse,
  AlertEventItemResponse,
  LatestReadingItemResponse,
  UpdateDeviceConfigRequest,
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

const csvDateStamp = () => new Date().toISOString().slice(0, 10);

const chartExportFilename = (
  scope: string,
  sensorCode: string,
  range: DisplayChartRange,
) => `iot-${scope}-${sensorCode}-${range}-${csvDateStamp()}`;

const alertEventsKey = (alerts: AlertEventItemResponse[]) =>
  alerts
    .map((alert) =>
      [
        alert.id,
        alert.status,
        alert.severity,
        alert.openedAt,
        alert.thresholdMin,
        alert.thresholdMax,
      ].join(":"),
    )
    .join("|");

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
  const alertsKey = useMemo(() => alertEventsKey(alerts), [alerts]);
  const stableAlerts = useMemo(() => alerts, [alertsKey]);
  const trend = useMemo(
    () => deriveAnalytics(chartToTrend(chartQuery.data, displayRange), stableAlerts),
    [chartQuery.data, displayRange, stableAlerts],
  );
  const backendThresholds = useMemo(
    () => thresholdsFromAlertEvents(stableAlerts),
    [stableAlerts],
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
  mediaEvents: DeviceMediaEventResponse[];
  canCapture: boolean;
  isCapturing: boolean;
  isPolling: boolean;
  onCapture: () => Promise<void>;
}

function DeviceMediaPanel({
  mediaEvents,
  canCapture,
  isCapturing,
  isPolling,
  onCapture,
}: DeviceMediaPanelProps) {
  const { t } = useTranslation();
  const latestMedia = mediaEvents[0];
  const latestUploaded = mediaEvents.find(
    (event) => event.status === "UPLOADED" && event.fileId,
  );
  const isWaiting = isCapturing || isPolling || isMediaWaiting(latestMedia);
  const failedLatest =
    latestMedia?.status === "FAILED" || latestMedia?.status === "TIMEOUT"
      ? latestMedia
      : null;

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
        <button
          type="button"
          onClick={() => void onCapture()}
          disabled={!canCapture || isCapturing}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Camera className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {isCapturing ? t("iot.devices.media.capturing") : t("iot.devices.media.captureImage")}
        </button>
      </div>

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
          {mediaEvents.slice(0, 6).map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={badgeClass(statusTone(event.status))}>
                  {formatMediaStatusLabel(t, event.status)}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {formatDateTime(event.uploadedAt || event.requestedAt)}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {event.fileId
                  ? `${event.width ?? "-"}x${event.height ?? "-"} - ${formatNumber(event.sizeBytes)} bytes`
                  : event.error || event.requestId || t("iot.devices.media.waitingForUpload")}
              </p>
            </div>
          ))}
        </div>
      </div>
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
  const pushWatchUntilRef = useRef(0);
  const completedCaptureRef = useRef<string | null>(null);

  const deviceDetailQuery = useDeviceDetail(resolvedDeviceId, !!deviceId);
  const latestReadingsQuery = useDeviceLatestReadings(resolvedDeviceId, !!deviceId);
  const configQuery = useDeviceConfig(resolvedDeviceId, !!deviceId);
  const mediaQuery = useDeviceMedia(resolvedDeviceId, !!deviceId);
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
  const pushConfigMutation = usePushDeviceConfig(resolvedDeviceId);
  const captureImageMutation = useCaptureDeviceImage(resolvedDeviceId);

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

  const device = deviceDetailQuery.data;
  const config = configQuery.data;
  const mediaEvents = useMemo(() => mediaQuery.data ?? [], [mediaQuery.data]);
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

  useEffect(() => {
    if (!expandedSensor) return;
    const snapshot = chartSnapshots[expandedSensor.sensorCode];
    if (!snapshot || snapshot.data === expandedSensor.data.trend) return;
    setExpandedSensor((current) =>
      current
        ? {
            ...current,
            data: {
              ...current.data,
              trend: snapshot.data,
              unit: snapshot.unit,
            },
          }
        : current,
    );
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
                    {readableDeviceName(device)}
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
                  {deviceTypeLabel(device.deviceType)} · {formatDeviceStatusLabel(t, device.status)}
                </p>
              </div>
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
            </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoTile label={t("iot.devices.detail.type")} value={deviceTypeLabel(device.deviceType)} />
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
                      {type.label}
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
            onCapture={handleCaptureImage}
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

      {expandedSensor ? (
        <SensorChartModal
          title={expandedSensor.title}
          icon={expandedSensor.icon}
          data={expandedSensor.data}
          colorClass={expandedSensor.colorClass}
          barColor={expandedSensor.barColor}
          iconBgClass={expandedSensor.iconBgClass}
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
          thresholds={expandedSensor.thresholds}
          isLoading={false}
          isError={false}
          analyticsEnabled={analyticsEnabled}
          onAnalyticsToggle={setAnalyticsEnabled}
          eventMarkers={createDataUpdateMarker(expandedSensor.data.latestUpdatedAt)}
          exportFilename={chartExportFilename(
            `device-${deviceId}`,
            expandedSensor.sensorCode,
            range,
          )}
          onClose={() => setExpandedSensor(null)}
        />
      ) : null}
    </div>
  );
}

export default DeviceDetailPage;
