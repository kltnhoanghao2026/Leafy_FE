import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Droplet,
  RefreshCw,
  Save,
  Send,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { IoTMetricCard } from "../../metrics-view/components/IoTMetricCard";
import {
  compactId,
  formatDateTime,
  formatNumber,
} from "../../metrics-view/utils/format";
import {
  useDeviceChart,
  useDeviceConfig,
  useDeviceDetail,
  useDeviceLatestReadings,
  usePushDeviceConfig,
  useUpdateDeviceConfig,
} from "../queries";
import { ROUTES } from "../../../lib/routes";
import type {
  ChartRange,
  DeviceConfigResponse,
  LatestReadingItemResponse,
  SensorChartResponse,
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

const CHART_RANGE_OPTIONS: Array<{ value: ChartRange; label: string }> = [
  { value: "H24", label: "24 hours" },
  { value: "D3", label: "3 days" },
  { value: "D7", label: "7 days" },
  { value: "D30", label: "30 days" },
  { value: "D90", label: "90 days" },
];

const normalizeUnit = (unit?: string | null): string => {
  if (!unit) return "";
  return unit === "C" ? "deg C" : unit;
};

const chartToTrend = (chart?: SensorChartResponse) =>
  chart?.points
    .filter((point) => point.avgValue !== null)
    .map((point) => ({
      time: formatDateTime(point.bucketStart),
      value: point.avgValue ?? 0,
    })) ?? [];

const readingValue = (reading?: LatestReadingItemResponse): number | string => {
  if (!reading || reading.value === null) return "-";
  return formatNumber(reading.value);
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

const validateConfig = (payload: UpdateDeviceConfigRequest): string | null => {
  if (payload.samplingIntervalSec <= 0) {
    return "Sampling interval must be greater than 0.";
  }
  if (payload.publishIntervalSec <= 0) {
    return "Publish interval must be greater than 0.";
  }
  if (payload.offlineTimeoutSec <= 0) {
    return "Offline timeout must be greater than 0.";
  }
  if (payload.publishIntervalSec < payload.samplingIntervalSec) {
    return "Publish interval must be greater than or equal to sampling interval.";
  }
  if (payload.offlineTimeoutSec <= payload.publishIntervalSec) {
    return "Offline timeout must be greater than publish interval.";
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
  range: ChartRange;
  reading: LatestReadingItemResponse;
}

function DeviceSensorCard({ deviceId, range, reading }: DeviceSensorCardProps) {
  const knownSensor = SENSOR_CONFIG.find((sensor) => sensor.code === reading.sensorCode);
  const chartQuery = useDeviceChart(deviceId, reading.sensorCode, range);

  return (
    <IoTMetricCard
      title={reading.sensorName || knownSensor?.title || reading.sensorCode}
      icon={knownSensor?.icon ?? Cpu}
      data={{
        value: readingValue(reading),
        unit: normalizeUnit(reading.unit || chartQuery.data?.unit),
        badge: reading.qualityStatus || "Live",
        trend: chartToTrend(chartQuery.data),
      }}
      colorClass={knownSensor?.colorClass ?? "text-slate-600"}
      barColor={knownSensor?.barColor ?? "#64748B"}
      iconBgClass={knownSensor?.iconBgClass ?? "bg-slate-50"}
      isLoading={chartQuery.isLoading}
      isError={chartQuery.isError}
    />
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
    const validationError = validateConfig(payload);
    setValidationMessage(validationError);

    if (validationError) return;

    await onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Sampling sec
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
            Publish sec
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
            Offline timeout sec
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
        Alert evaluation enabled
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
        {isSaving ? "Saving..." : "Save config"}
      </button>
    </form>
  );
}

export function DeviceDetailPage() {
  const { deviceId } = useParams();
  const resolvedDeviceId = deviceId ?? "";
  const [range, setRange] = useState<ChartRange>("H24");
  const pushWatchUntilRef = useRef(0);

  const deviceDetailQuery = useDeviceDetail(resolvedDeviceId, !!deviceId);
  const latestReadingsQuery = useDeviceLatestReadings(resolvedDeviceId, !!deviceId);
  const configQuery = useDeviceConfig(resolvedDeviceId, !!deviceId);
  const updateConfigMutation = useUpdateDeviceConfig(resolvedDeviceId);
  const pushConfigMutation = usePushDeviceConfig(resolvedDeviceId);

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
  const canManageConfig =
    device?.isActive === true && device?.provisioningStatus === "CLAIMED";

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

  const isPageLoading = deviceDetailQuery.isLoading || configQuery.isLoading;
  const hasPageError = deviceDetailQuery.isError || configQuery.isError;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {isPageLoading ? (
        <div aria-label="Loading device detail" className="space-y-5">
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
                Device detail could not be loaded
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                Check the route deviceId or collector service availability.
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
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {!isPageLoading && !hasPageError && !device ? (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-4 text-lg font-black text-slate-800">
            Device not found
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            The backend returned no device detail for this route.
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
                    {device.deviceName}
                  </h2>
                  <span className={badgeClass(statusTone(device.status))}>
                    {device.status}
                  </span>
                  <span
                    className={badgeClass(statusTone(device.provisioningStatus))}
                  >
                    {device.provisioningStatus}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {device.deviceCode} - {device.deviceUid}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-3xl bg-[#F2FCF4] px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-[#245A34]" strokeWidth={3} />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#245A34]">
                    Last seen
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {formatDateTime(device.lastSeenAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoTile label="Type" value={device.deviceType} />
              <InfoTile
                label="Firmware"
                value={device.firmwareVersion || "Unknown"}
              />
              <InfoTile label="Farm plot" value={compactId(device.farmPlotId)} />
              <InfoTile label="Zone" value={compactId(device.zoneId)} />
            </div>
          </section>

          <section>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
                  Latest readings and charts
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  Realtime readings use the device latest-readings endpoint.
                </p>
              </div>
              <div className="inline-flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm shrink-0 overflow-x-auto">
                {CHART_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    className={`px-5 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 whitespace-nowrap ${
                      range === option.value
                        ? "bg-[#245A34] text-white shadow-md"
                        : "text-slate-500 hover:text-[#245A34] hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {latestReadingsQuery.isLoading ? (
              <div aria-label="Loading device readings" className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {[0, 1].map((item) => (
                  <div key={item} className="h-[240px] rounded-3xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : null}

            {!latestReadingsQuery.isLoading && visibleReadings.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-black text-slate-800">
                  No latest sensor readings
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  The backend returned no sensor readings for this device.
                </p>
              </div>
            ) : null}

            {visibleReadings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {visibleReadings.map((reading) => (
                  <DeviceSensorCard
                    key={reading.sensorCode}
                    deviceId={deviceId}
                    range={range}
                    reading={reading}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 lg:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
              <div>
                <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
                  Device config
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  Save updates desired config. Push sends that config to the device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handlePushConfig()}
                disabled={!canManageConfig || pushConfigMutation.isPending}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" strokeWidth={2.5} />
                {pushConfigMutation.isPending ? "Pushing..." : "Push config"}
              </button>
            </div>

            {!canManageConfig ? (
              <p className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                Config actions are disabled because this device is not active and CLAIMED.
              </p>
            ) : null}

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoTile
                label="Version"
                value={formatNumber(config.configVersion)}
              />
              <InfoTile
                label="Last push"
                value={config.lastPushStatus || "Not pushed"}
              />
              <InfoTile label="Last ACK" value={formatDateTime(config.lastAckAt)} />
              <InfoTile label="Applied" value={formatDateTime(config.appliedAt)} />
            </div>

            {config.lastPushStatus ? (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className={badgeClass(statusTone(config.lastPushStatus))}>
                  {config.lastPushStatus}
                </span>
                {config.lastPushStatus === "SENT" ||
                config.lastPushStatus === "PENDING" ? (
                  <span className="text-sm font-bold text-slate-500">
                    Waiting for device acknowledgement.
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
                Config update failed. Please review the values and try again.
              </p>
            ) : null}

            {pushConfigMutation.isError ? (
              <p role="alert" className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                Config push failed. Please try again.
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
    </div>
  );
}

export default DeviceDetailPage;
