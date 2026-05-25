import { Link, Navigate, useParams } from "react-router-dom";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Cpu,
  Droplet,
  ImageOff,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  IoTMetricCard,
  type MetricData,
  type SensorChartType,
  type SensorTrend,
} from "../components/IoTMetricCard";
import { CHART_TYPES, CHART_TYPE_LABEL_KEYS } from "../utils/chartHelpers";
import { CompareChart } from "../components/CompareChart";
import { SensorChartModal } from "../components/SensorChartModal";
import { RecentAlerts } from "../components/RecentAlerts";
import { useAlertEvents } from "../../alerts/queries";
import { useDeviceMedia, useCaptureDeviceImage } from "../../device-detail/queries";
import { useMyDevices } from "../../device-onboarding/queries";
import { useFarmPlots, useFarmZonesByOwner } from "../../farm-management/queries";
import { useZoneChart, useZoneOverview } from "../queries";
import { ROUTES } from "../../../lib/routes";
import type {
  AlertEventItemResponse,
  DeviceMediaEventResponse,
  DeviceResponse,
  LatestReadingItemResponse,
} from "../../../types/iot";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime, formatNumber } from "../utils/format";
import {
  chartToTrend,
  DISPLAY_CHART_RANGE_OPTIONS,
  type DisplayChartRange,
  toApiChartRange,
} from "../utils/chartRanges";
import type { SensorThresholds } from "../utils/chartThresholds";
import {
  createDataUpdateMarker,
  deriveAnalytics,
  thresholdsFromAlertEvents,
  type EventMarkerData,
} from "../utils/chartAnalytics";
import { useTranslation } from "../../../i18n";
import {
  formatChartRangeLabel,
  formatDeviceStatusLabel,
  formatDeviceTypeLabel,
  formatMediaStatusLabel,
  formatSensorLabel,
} from "../../iot/utils/iotTranslation";
import { useMyProfile } from "../../settings/queries";
import { MediaImage } from "../../community/components/MediaImage";

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

const deviceDisplayName = (device?: DeviceResponse | null) =>
  device?.deviceName?.trim() || device?.deviceCode?.trim() || "";

const isCameraDevice = (device: DeviceResponse) =>
  device.deviceType?.toUpperCase().includes("CAM") ||
  device.deviceCode?.toUpperCase().includes("CAM");

const mediaImageSource = (media?: DeviceMediaEventResponse | null) =>
  media?.analysis?.fileUrl || media?.fileId || "";

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

interface ZoneSummaryCardProps {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "orange" | "red";
}

function ZoneSummaryCard({ label, value, detail, tone }: ZoneSummaryCardProps) {
  const toneClasses = {
    green: "bg-[#ECFDF5] text-[#10B981]",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-sm border border-slate-100/80 h-[120px]">
      <div>
        <h4 className="text-[14px] font-bold text-slate-500 mb-2">
          {label}
        </h4>
        <p className="text-[36px] font-black text-slate-800 leading-none">
          {value}
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-500">{detail}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${toneClasses[tone]}`}
      >
        <AlertTriangle className="w-6 h-6" strokeWidth={3} />
      </div>
    </div>
  );
}

interface ZoneDeviceContextProps {
  device?: DeviceResponse | null;
  farmLabel: string;
  zoneLabel: string;
  isDeviceLoading: boolean;
}

function ZoneDeviceContext({
  device,
  farmLabel,
  zoneLabel,
  isDeviceLoading,
}: ZoneDeviceContextProps) {
  const { t } = useTranslation();
  const displayName = deviceDisplayName(device);
  const deviceId = device?.id ?? "";

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          {t("iot.metrics.currentScope")}
        </p>
        <h3 className="mt-2 text-xl font-black text-slate-900">
          {zoneLabel}
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {t("iot.metrics.currentScopeDescription")(zoneLabel, farmLabel)}
        </p>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#245A34]">
              <Cpu className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {t("iot.metrics.zoneDeviceTitle")}
            </p>
            {isDeviceLoading ? (
              <div className="mt-3 h-6 w-44 rounded-full bg-slate-100 animate-pulse" />
            ) : device ? (
              <>
                <h3 className="mt-2 truncate text-lg font-black text-slate-900">
                  {displayName || t("iot.devices.defaultName")}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {formatDeviceStatusLabel(t, device.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {formatDeviceTypeLabel(t, device.deviceType)}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {t("iot.metrics.deviceLastSeen")}:{" "}
                  {device.lastSeenAt
                    ? formatDateTime(device.lastSeenAt)
                    : t("iot.metrics.noDeviceLastSeen")}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {t("iot.metrics.noZoneDeviceAssigned")}
              </p>
            )}
          </div>

          {deviceId ? (
            <Link
              to={ROUTES.DASHBOARD.DEVICE_DETAIL(deviceId)}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#245A34] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1B4328]"
            >
              {t("iot.metrics.viewDeviceDetail")}
              <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.5} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface ZoneCameraPanelProps {
  device?: DeviceResponse | null;
  mediaEvents: DeviceMediaEventResponse[];
  isLoading: boolean;
  isCapturing: boolean;
  onCapture: () => void;
}

function ZoneCameraPanel({
  device,
  mediaEvents,
  isLoading,
  isCapturing,
  onCapture,
}: ZoneCameraPanelProps) {
  const { t } = useTranslation();
  const latestMedia =
    mediaEvents.find((event) => event.status === "UPLOADED" && mediaImageSource(event)) ??
    mediaEvents.find((event) => mediaImageSource(event)) ??
    null;
  const latestSource = mediaImageSource(latestMedia);

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {t("iot.metrics.zoneCameraTitle")}
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-900">
            {t("iot.metrics.zoneCameraHeading")}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {t("iot.metrics.zoneCameraDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={onCapture}
          disabled={!device || isCapturing}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-black text-white transition hover:bg-[#1B4328] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Camera className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {isCapturing
            ? t("iot.metrics.capturingZoneImage")
            : t("iot.metrics.captureZoneImage")}
        </button>
      </div>

      {!device ? (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <ImageOff className="mx-auto h-8 w-8 text-slate-400" strokeWidth={2.5} />
          <p className="mt-3 text-sm font-bold text-slate-600">
            {t("iot.metrics.zoneCameraNoDevice")}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
            {isLoading ? (
              <div className="h-72 animate-pulse bg-slate-100" />
            ) : latestSource ? (
              <MediaImage
                source={latestSource}
                alt={t("iot.metrics.latestZoneImage")}
                className="h-72 w-full object-cover"
              />
            ) : (
              <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-500">
                <ImageOff className="h-8 w-8" strokeWidth={2.5} />
                <span className="text-sm font-bold">{t("iot.metrics.noZoneImages")}</span>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                {t("iot.metrics.zoneImageHistory")}
              </h4>
              <span className="text-xs font-black text-slate-400">
                {t("iot.metrics.latestCount")(Math.min(mediaEvents.length, 4))}
              </span>
            </div>
            <div className="space-y-3">
              {mediaEvents.slice(0, 4).map((event) => {
                const source = mediaImageSource(event);
                const eventDisplay = event as DeviceMediaEventResponse & {
                  display?: { capturedAt?: string };
                };
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
                  >
                    <div className="h-14 w-16 overflow-hidden rounded-xl bg-slate-100">
                      {source ? (
                        <MediaImage
                          source={source}
                          alt={t("iot.metrics.zoneImageHistory")}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ImageOff className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-800">
                        {formatMediaStatusLabel(t, event.status)}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {eventDisplay.display?.capturedAt ||
                          formatDateTime(event.capturedAt || event.uploadedAt || event.requestedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {!isLoading && mediaEvents.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-500">
                  {t("iot.metrics.noZoneImages")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface ZoneSensorCardProps {
  zoneId: string;
  apiRange: ReturnType<typeof toApiChartRange>;
  displayRange: DisplayChartRange;
  sensor: (typeof SENSOR_CONFIG)[number];
  reading?: LatestReadingItemResponse;
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

function ZoneSensorCard({
  zoneId,
  apiRange,
  displayRange,
  sensor,
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
}: ZoneSensorCardProps) {
  const { t, locale } = useTranslation();
  const chartQuery = useZoneChart(zoneId, sensor.code, apiRange);
  const chart = chartQuery.data;
  const alertsKey = useMemo(() => alertEventsKey(alerts), [alerts]);
  const stableAlerts = useMemo(() => alerts, [alertsKey]);
  const trend = useMemo(
    () => deriveAnalytics(chartToTrend(chart, displayRange), stableAlerts),
    [chart, displayRange, stableAlerts, locale],
  );
  const backendThresholds = useMemo(
    () => thresholdsFromAlertEvents(stableAlerts),
    [stableAlerts],
  );
  const title = formatSensorLabel(t, sensor.code, reading?.sensorName || sensor.title);
  const unit = normalizeUnit(reading?.unit || chart?.unit);
  const metricData: MetricData = {
    value: readingValue(reading),
    unit,
    badge:
      reading?.qualityStatus ||
      (chart ? t("iot.metrics.samples")(formatNumber(chart.points.length)) : undefined),
    latestUpdatedAt: reading?.readingTime ?? null,
    trend,
  };

  useEffect(() => {
    onChartSnapshot({
      sensorCode: sensor.code,
      title,
      unit,
      color: sensor.barColor,
      data: trend,
      signature: trendSignature(trend),
    });
  }, [onChartSnapshot, sensor.barColor, sensor.code, title, trend, unit]);

  return (
    <IoTMetricCard
      title={title}
      icon={sensor.icon}
      data={metricData}
      colorClass={sensor.colorClass}
      barColor={sensor.barColor}
      iconBgClass={sensor.iconBgClass}
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
          icon: sensor.icon,
          data: metricData,
          colorClass: sensor.colorClass,
          barColor: sensor.barColor,
          iconBgClass: sensor.iconBgClass,
          chartType,
          sensorCode: sensor.code,
          thresholds: backendThresholds,
        })
      }
    />
  );
}

export function ZoneDetailMetricsPage() {
  const { t } = useTranslation();
  const { zoneId } = useParams();
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
  const resolvedZoneId = zoneId ?? "";
  const profileQuery = useMyProfile();
  const farmPlotsQuery = useFarmPlots(
    profileQuery.data?.id ?? "",
    Boolean(profileQuery.data?.id),
  );
  const farmZonesQuery = useFarmZonesByOwner(
    profileQuery.data?.id ?? "",
    Boolean(profileQuery.data?.id),
  );
  const zoneDevicesQuery = useMyDevices(
    { zoneId: resolvedZoneId, page: 0, size: 5 },
    !!zoneId,
  );
  const zoneDevices = useMemo(
    () => zoneDevicesQuery.data?.items ?? [],
    [zoneDevicesQuery.data?.items],
  );
  const zoneDevice = useMemo(
    () => zoneDevices.find(isCameraDevice) ?? zoneDevices[0] ?? null,
    [zoneDevices],
  );
  const zoneDeviceId = zoneDevice?.id ?? "";
  const zoneMediaQuery = useDeviceMedia(
    zoneDeviceId,
    resolvedZoneId,
    Boolean(zoneDeviceId && resolvedZoneId),
    10000,
  );
  const captureZoneImageMutation = useCaptureDeviceImage(zoneDeviceId);
  const zoneDeviceCount =
    zoneDevicesQuery.data?.totalItems ?? zoneDevicesQuery.data?.items.length ?? 0;
  const canLoadCollectorMetrics = !!zoneId && zoneDevicesQuery.isSuccess && zoneDeviceCount > 0;
  const zoneOverviewQuery = useZoneOverview(resolvedZoneId, canLoadCollectorMetrics);
  const alertEventsQuery = useAlertEvents(
    {
      zoneId: resolvedZoneId,
      size: 100,
      sortBy: "openedAt",
      sortDir: "desc",
    },
    canLoadCollectorMetrics,
  );
  const zoneOverview = zoneOverviewQuery.data;
  const readings = zoneOverview?.latestReadings ?? [];
  const zoneAlerts = alertEventsQuery.data?.items ?? [];
  const currentZone = farmZonesQuery.data?.find((zone) => zone.id === resolvedZoneId) ?? null;
  const currentFarmPlotId = currentZone?.farmPlotId ?? zoneDevice?.farmPlotId ?? null;
  const currentFarm =
    farmPlotsQuery.data?.find((plot) => plot.id === currentFarmPlotId) ?? null;
  const zoneLabel = currentZone
    ? currentZone.zoneCode
      ? `${currentZone.zoneName} (${currentZone.zoneCode})`
      : currentZone.zoneName
    : farmZonesQuery.isLoading
      ? t("iot.metrics.loadingZoneContext")
      : t("iot.metrics.unknownZone");
  const farmLabel = currentFarm
    ? currentFarm.code
      ? `${currentFarm.name} (${currentFarm.code})`
      : currentFarm.name
    : farmPlotsQuery.isLoading
      ? t("iot.metrics.loadingFarmContext")
      : t("iot.metrics.unknownFarm");
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

  if (!zoneId) {
    return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  }

  const findReading = (sensorCode: string) =>
    readings.find((reading) => reading.sensorCode === sensorCode);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <div>
          <h2 className="text-[32px] font-bold text-[#111827] tracking-tight mb-1">
            {t("iot.metrics.title")}
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium">
            {t("iot.metrics.contextDescription")(zoneLabel, farmLabel)}
          </p>
        </div>
      </div>

      <ZoneDeviceContext
        device={zoneDevice}
        farmLabel={farmLabel}
        zoneLabel={zoneLabel}
        isDeviceLoading={zoneDevicesQuery.isLoading}
      />

      <ZoneCameraPanel
        device={zoneDevice}
        mediaEvents={zoneMediaQuery.data ?? []}
        isLoading={zoneMediaQuery.isLoading}
        isCapturing={captureZoneImageMutation.isPending}
        onCapture={() => captureZoneImageMutation.mutate()}
      />

      {zoneDevicesQuery.isLoading || zoneOverviewQuery.isLoading ? (
        <div
          aria-label={t("iot.metrics.loadingOverview")}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-[120px] rounded-[2rem] bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {zoneDevicesQuery.isSuccess && zoneDeviceCount === 0 ? (
        <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-black text-amber-800">
              {t("iot.metrics.noZoneDevices")}
            </h3>
            <p className="text-sm font-semibold text-amber-700">
              {t("iot.metrics.noZoneDevicesDescription")}
            </p>
          </div>
        </div>
      ) : null}

      {zoneDevicesQuery.isError || zoneOverviewQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-red-700">
                {t("iot.metrics.error")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                {t("iot.metrics.errorDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void zoneDevicesQuery.refetch();
                if (canLoadCollectorMetrics) {
                  void zoneOverviewQuery.refetch();
                }
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {t("iot.metrics.retry")}
            </button>
          </div>
        </div>
      ) : null}

      {zoneOverview ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ZoneSummaryCard
              label={t("iot.metrics.openAlerts")}
              value={formatNumber(zoneOverview.openAlerts)}
              detail={t("iot.metrics.updated")(formatDateTime(zoneOverview.lastUpdatedAt))}
              tone="orange"
            />
            <ZoneSummaryCard
              label={t("iot.metrics.highSeverity")}
              value={formatNumber(
                zoneOverview.alertSummary?.highSeverityAlerts ?? 0,
              )}
              detail={t("iot.metrics.highAlerts")}
              tone="red"
            />
            <ZoneSummaryCard
              label={t("iot.metrics.critical")}
              value={formatNumber(zoneOverview.alertSummary?.criticalAlerts ?? 0)}
              detail={t("iot.metrics.criticalAlerts")}
              tone="red"
            />
          </div>

          {readings.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-black text-slate-800">
                {t("iot.metrics.noReadings")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {t("iot.metrics.noReadingsDescription")}
              </p>
            </div>
          ) : null}

          <div className="space-y-6 lg:space-y-8">
            <div>
              <div>
                <div className="flex items-center mb-6">
                  <svg
                    className="w-5 h-5 text-[#245A34] mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                    />
                  </svg>
                  <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
                    {t("iot.metrics.sensorMetrics")}
                  </h3>
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
                      {t("iot.metrics.compareMode")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SENSOR_CONFIG.map((sensor) => {
                        const checked = compareSensors.includes(sensor.code);
                        return (
                          <label
                            key={sensor.code}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                setCompareSensors((current) =>
                                  event.target.checked
                                    ? Array.from(new Set([...current, sensor.code]))
                                    : current.filter((sensorCode) => sensorCode !== sensor.code),
                                );
                              }}
                              className="h-3.5 w-3.5 accent-[#245A34]"
                              aria-checked={checked}
                            />
                            {formatSensorLabel(t, sensor.code, sensor.title)}
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
                        `zone-${zoneId}-compare`,
                        compareSensors.join("-") || "sensors",
                        range,
                      )}
                    />
                  </div>
                ) : null}

                <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t("iot.metrics.chartDisplay")}
                    </p>
                    <p className="text-sm font-semibold text-slate-500">
                      {t("iot.metrics.chartDisplayDescription")}
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
                          {formatChartRangeLabel(t, option.value)}
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
                      {t("iot.metrics.analytics")}
                    </button>
                  </div>
                </div>

	                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
	                  {SENSOR_CONFIG.map((sensor) => (
                    <ZoneSensorCard
                      key={sensor.code}
                      zoneId={zoneId}
                      apiRange={apiChartRange}
                      displayRange={range}
                      sensor={sensor}
                      reading={findReading(sensor.code)}
                      chartType={chartType}
                      onChartTypeChange={setChartType}
                      onExpand={setExpandedSensor}
                      onChartSnapshot={rememberChartSnapshot}
                      alerts={zoneAlerts.filter((alert) => {
                        const reading = findReading(sensor.code);
                        return reading?.sensorTypeId
                          ? alert.sensorTypeId === reading.sensorTypeId
                          : false;
                      })}
                      analyticsEnabled={analyticsEnabled}
                      onAnalyticsToggle={setAnalyticsEnabled}
                      eventMarkers={createDataUpdateMarker(findReading(sensor.code)?.readingTime)}
                      exportFilename={chartExportFilename(
                        `zone-${zoneId}`,
                        sensor.code,
                        range,
                      )}
                    />
	                  ))}
	                </div>
	              </div>
	            </div>

	            <div>
	              <RecentAlerts zoneId={zoneId} />
	            </div>
	          </div>
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
            `zone-${zoneId}`,
            expandedSensor.sensorCode,
            range,
          )}
          onClose={() => setExpandedSensor(null)}
        />
      ) : null}
    </div>
  );
}

export default ZoneDetailMetricsPage;
