import { Navigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Droplet,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { IoTMetricCard } from "../components/IoTMetricCard";
import { RecentAlerts } from "../components/RecentAlerts";
import { useZoneChart, useZoneOverview } from "../queries";
import { ROUTES } from "../../../lib/routes";
import type {
  LatestReadingItemResponse,
} from "../../../types/iot";
import { useState } from "react";
import { formatDateTime, formatNumber } from "../utils/format";
import {
  chartToTrend,
  DISPLAY_CHART_RANGE_OPTIONS,
  type DisplayChartRange,
  toApiChartRange,
} from "../utils/chartRanges";

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

const normalizeUnit = (unit?: string | null): string => {
  if (!unit) return "";
  return unit === "C" ? "deg C" : unit;
};

const readingValue = (reading?: LatestReadingItemResponse): number | string => {
  if (!reading || reading.value === null) return "-";
  return formatNumber(reading.value);
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

interface ZoneSensorCardProps {
  zoneId: string;
  apiRange: ReturnType<typeof toApiChartRange>;
  displayRange: DisplayChartRange;
  sensor: (typeof SENSOR_CONFIG)[number];
  reading?: LatestReadingItemResponse;
}

function ZoneSensorCard({
  zoneId,
  apiRange,
  displayRange,
  sensor,
  reading,
}: ZoneSensorCardProps) {
  const chartQuery = useZoneChart(zoneId, sensor.code, apiRange);
  const chart = chartQuery.data;

  return (
    <IoTMetricCard
      title={reading?.sensorName || sensor.title}
      icon={sensor.icon}
      data={{
        value: readingValue(reading),
        unit: normalizeUnit(reading?.unit || chart?.unit),
        badge:
          reading?.qualityStatus ||
          (chart ? `${formatNumber(chart.points.length)} samples` : undefined),
        trend: chartToTrend(chart, displayRange),
      }}
      colorClass={sensor.colorClass}
      barColor={sensor.barColor}
      iconBgClass={sensor.iconBgClass}
      isLoading={chartQuery.isLoading}
      isError={chartQuery.isError}
    />
  );
}

export function ZoneDetailMetricsPage() {
  const { zoneId } = useParams();
  const [range, setRange] = useState<DisplayChartRange>("D1");
  const apiChartRange = toApiChartRange(range);
  const resolvedZoneId = zoneId ?? "";
  const zoneOverviewQuery = useZoneOverview(resolvedZoneId, !!zoneId);
  const zoneOverview = zoneOverviewQuery.data;
  const readings = zoneOverview?.latestReadings ?? [];

  if (!zoneId) {
    return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  }

  const findReading = (sensorCode: string) =>
    readings.find((reading) => reading.sensorCode === sensorCode);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-bold text-[#111827] tracking-tight mb-1">
            Zone metrics
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium">
            Backend latest readings and aggregate charts for zone {zoneId}.
          </p>
        </div>
        <div className="inline-flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm shrink-0">
          {DISPLAY_CHART_RANGE_OPTIONS.map((option) => (
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

      {zoneOverviewQuery.isLoading ? (
        <div
          aria-label="Loading zone overview"
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

      {zoneOverviewQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-red-700">
                Zone overview could not be loaded
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                Check the route zoneId or collector service availability.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void zoneOverviewQuery.refetch()}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {zoneOverview ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ZoneSummaryCard
              label="Open alerts"
              value={formatNumber(zoneOverview.openAlerts)}
              detail={`Updated ${formatDateTime(zoneOverview.lastUpdatedAt)}`}
              tone="orange"
            />
            <ZoneSummaryCard
              label="High severity"
              value={formatNumber(
                zoneOverview.alertSummary?.highSeverityAlerts ?? 0,
              )}
              detail="HIGH alerts"
              tone="red"
            />
            <ZoneSummaryCard
              label="Critical"
              value={formatNumber(zoneOverview.alertSummary?.criticalAlerts ?? 0)}
              detail="CRITICAL alerts"
              tone="red"
            />
          </div>

          {readings.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-black text-slate-800">
                No latest sensor readings
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                The collector returned an empty latestReadings array for this
                zone.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
            <div className="flex-1 space-y-6 lg:space-y-8">
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
                    IoT sensor metrics
                  </h3>
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
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full xl:w-[380px] shrink-0">
              <RecentAlerts zoneId={zoneId} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default ZoneDetailMetricsPage;
