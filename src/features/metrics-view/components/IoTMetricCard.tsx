import type { ComponentType, MouseEvent as ReactMouseEvent } from "react";
import { useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import { AlertMarker } from "./AlertMarker";
import { CSVExportButton } from "./CSVExportButton";
import { EventMarker } from "./EventMarker";
import type { EventMarkerData } from "../utils/chartAnalytics";
import type { SensorThresholds } from "../utils/chartThresholds";

export type SensorChartType = "area" | "line" | "bar" | "scatter";
type TimestampValue = string | number | Date | null | undefined;

export interface SensorTrend {
  timestamp: string | number;
  label: string;
  value: number;
  minValue?: number | null;
  maxValue?: number | null;
  sampleCount?: number | null;
  rollingAverage?: number | null;
  trendValue?: number | null;
  movingMin?: number | null;
  movingMax?: number | null;
  alertSeverity?: string | null;
  alertMessage?: string | null;
}

export interface MetricData {
  value: number | string;
  unit: string;
  trend: SensorTrend[];
  badge?: string;
  latestUpdatedAt?: TimestampValue;
}

interface IoTMetricCardProps {
  title: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  data: MetricData;
  colorClass: string;
  barColor: string;
  iconBgClass: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  chartType?: SensorChartType;
  onChartTypeChange?: (type: SensorChartType) => void;
  onExpand?: () => void;
  thresholds?: SensorThresholds;
  showThresholds?: boolean;
  expanded?: boolean;
  analyticsEnabled?: boolean;
  onAnalyticsToggle?: (enabled: boolean) => void;
  eventMarkers?: EventMarkerData[];
  exportFilename?: string;
}

const chartWidth = 320;
const chartHeight = 92;
const chartPadding = 8;
export const CHART_TYPES: Array<{ value: SensorChartType; label: string }> = [
  { value: "area", label: "Area" },
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "scatter", label: "Dots" },
];

const parseTime = (value?: TimestampValue): number => {
  if (!value) return Number.NaN;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") {
    return value < 10_000_000_000 ? value * 1000 : value;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && value.trim() !== "") {
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }
  return Date.parse(value);
};

const formatDisplayTime = (value?: TimestampValue): string | null => {
  const time = parseTime(value);
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat("en", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));
};

const safeId = (value: string) => value.replace(/[^a-z0-9]/gi, "-").toLowerCase();

export function IoTMetricCard({
  title,
  icon: Icon,
  data,
  colorClass,
  barColor,
  iconBgClass,
  isLoading = false,
  isError = false,
  onRetry,
  chartType = "area",
  onExpand,
  thresholds,
  showThresholds = false,
  expanded = false,
  analyticsEnabled = false,
  eventMarkers = [],
  exportFilename,
}: IoTMetricCardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<SensorTrend | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<EventMarkerData | null>(null);
  const chartPointCount = data.trend.length;
  const trendValues = data.trend
    .map((point) => point.value)
    .filter((value) => Number.isFinite(value));
  const thresholdValues = showThresholds
    ? [thresholds?.min, thresholds?.max].filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      )
    : [];
  const domainValues = [...trendValues, ...thresholdValues];
  const minTrendValue = domainValues.length ? Math.min(...domainValues) : 0;
  const maxTrendValue = domainValues.length ? Math.max(...domainValues) : 1;
  const domainPadding = Math.max(
    (maxTrendValue - minTrendValue) * 0.15,
    Math.abs(maxTrendValue) * 0.05,
    1,
  );
  const yDomain: [number, number] = domainValues.length
    ? [
        Math.max(0, minTrendValue - domainPadding),
        maxTrendValue + domainPadding,
      ]
    : [0, 1];
  const yRange = Math.max(yDomain[1] - yDomain[0], 1);
  const lastTrendPoint = data.trend[data.trend.length - 1];
  const lastUpdated =
    formatDisplayTime(data.latestUpdatedAt) ||
    formatDisplayTime(lastTrendPoint?.timestamp) ||
    "No data";
  const formatTooltipValue = (point: SensorTrend) => {
    const formattedValue = new Intl.NumberFormat("en", {
      maximumFractionDigits: 2,
    }).format(point.value);
    const sampleSuffix = point.sampleCount ? ` - ${point.sampleCount} samples` : "";
    return `${formattedValue} ${data.unit}${sampleSuffix}`;
  };
  const labelInterval = Math.max(1, Math.ceil(data.trend.length / 4));
  const valueToY = (value: number) => {
    const drawableHeight = chartHeight - chartPadding * 2;
    const normalized = (value - yDomain[0]) / yRange;
    return (
      chartHeight -
      chartPadding -
      Math.min(1, Math.max(0, normalized)) * drawableHeight
    );
  };
  const chartPoints = useMemo(() => {
    if (!data.trend.length) return [];
    const maxIndex = Math.max(data.trend.length - 1, 1);
    return data.trend.map((point, index) => {
      const x =
        data.trend.length === 1
          ? chartWidth / 2
          : chartPadding + (index / maxIndex) * (chartWidth - chartPadding * 2);
      const y = valueToY(point.value);
      return { ...point, x, y };
    });
  }, [data.trend, yDomain, yRange]);
  const rollingPath = chartPoints
    .filter((point) => typeof point.rollingAverage === "number")
    .map((point, index) => {
      const y = valueToY(point.rollingAverage as number);
      return `${index === 0 ? "M" : "L"} ${point.x} ${y}`;
    })
    .join(" ");
  const trendPath = chartPoints
    .filter((point) => typeof point.trendValue === "number")
    .map((point, index) => {
      const y = valueToY(point.trendValue as number);
      return `${index === 0 ? "M" : "L"} ${point.x} ${y}`;
    })
    .join(" ");
  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    chartPoints.length > 0
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight - chartPadding} L ${chartPoints[0].x} ${chartHeight - chartPadding} Z`
      : "";
  const activePoint = hoveredPoint ?? lastTrendPoint ?? null;
  const gradientId = useMemo(() => `iot-area-${safeId(title)}`, [title]);
  const barWidth = Math.max(4, Math.min(18, (chartWidth - chartPadding * 2) / Math.max(chartPoints.length, 1) * 0.55));
  const isOutOfThreshold = (point: SensorTrend) =>
    (typeof thresholds?.min === "number" && point.value < thresholds.min) ||
    (typeof thresholds?.max === "number" && point.value > thresholds.max);
  const eventMarkerPoints = eventMarkers
    .map((marker) => {
      const markerTime = parseTime(marker.timestamp);
      if (Number.isNaN(markerTime) || chartPoints.length === 0) return null;
      const nearest = chartPoints.reduce((best, point) => {
        const bestDelta = Math.abs(parseTime(best.timestamp) - markerTime);
        const pointDelta = Math.abs(parseTime(point.timestamp) - markerTime);
        return pointDelta < bestDelta ? point : best;
      }, chartPoints[0]);
      return { ...marker, x: nearest.x };
    })
    .filter((marker): marker is EventMarkerData & { x: number } => Boolean(marker));
  const updateHoverPosition = (event: ReactMouseEvent<SVGElement>) => {
    const svg = event.currentTarget.ownerSVGElement ?? event.currentTarget;
    const rect = svg.getBoundingClientRect();
    setHoverPosition({
      x: Math.min(Math.max(event.clientX - rect.left, 12), rect.width - 12),
      y: Math.min(Math.max(event.clientY - rect.top, 12), rect.height - 12),
    });
  };

  return (
    <article
      aria-label={`${title} latest reading and chart`}
      className={`bg-white rounded-3xl p-5 flex min-w-0 flex-col shadow-sm border border-slate-100/50 ${
        expanded ? "min-h-[520px]" : "min-h-[320px]"
      }`}
    >
      <div className="grid grid-cols-[1fr_auto] items-start gap-3 w-full shrink-0">
        <div className="grid min-w-0 grid-cols-[40px_1fr] gap-3">
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBgClass} shrink-0`}
          >
            <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[12px] font-bold text-slate-500 mb-1 leading-none">
              {title}
            </h4>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black text-slate-800 leading-none">
                {isLoading && data.value === "-" ? "..." : data.value}
              </span>
              <span
                className={`font-black text-slate-800 leading-none ${
                  data.unit === "Lux" ? "text-[14px]" : "text-[22px]"
                }`}
              >
                {data.unit}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        <div className="flex min-w-[96px] flex-col items-end gap-2">
          <div className="flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[12px] font-bold text-slate-500">
            {isError ? "Error" : data.badge || "Live"}
          </div>
          <div className="flex items-center justify-end gap-1">
            <CSVExportButton
              chartData={data.trend}
              filename={exportFilename || `${safeId(title)}-chart`}
              status={data.badge}
              className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            />
            {onExpand ? (
              <button
                type="button"
                aria-label={`Expand ${title} chart`}
                onClick={onExpand}
                className="rounded-full bg-slate-50 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#245A34]"
              >
                <Maximize2 className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {chartPointCount} chart points
        </p>
        {showThresholds && (thresholds?.min !== undefined || thresholds?.max !== undefined) ? (
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">
            Threshold {thresholds.min ?? "-"} / {thresholds.max ?? "-"}
          </p>
        ) : null}
      </div>

      <div className={`mt-3 ${expanded ? "h-80 min-h-80" : "h-36 min-h-36"} w-full min-w-0 overflow-visible rounded-2xl relative`}>
        <div
          className={`absolute inset-x-0 bottom-0 ${expanded ? "h-40" : "h-20"} ${iconBgClass} rounded-2xl`}
        />
        {isError ? (
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 text-sm font-bold text-rose-500">
            <span>Failed to load chart</span>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-black text-rose-600 hover:bg-rose-50"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : isLoading && chartPointCount === 0 ? (
          <div className="relative z-10 h-full rounded-2xl bg-slate-100/70 p-4">
            <div className="h-full w-full animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-white to-slate-100" />
          </div>
        ) : chartPointCount > 0 ? (
          <div
            className="relative z-10 h-full w-full overflow-visible pb-6"
            onMouseLeave={() => {
              setHoveredPoint(null);
              setHoveredEvent(null);
              setHoverPosition(null);
            }}
          >
            <svg
              className={`${expanded ? "h-[292px]" : "h-[112px]"} w-full overflow-hidden`}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${title} ${chartType} chart`}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={barColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={barColor} stopOpacity="0.04" />
                </linearGradient>
              </defs>

              {showThresholds && typeof thresholds?.max === "number" ? (
                <line
                  x1={chartPadding}
                  x2={chartWidth - chartPadding}
                  y1={valueToY(thresholds.max)}
                  y2={valueToY(thresholds.max)}
                  stroke="#F97316"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {showThresholds && typeof thresholds?.min === "number" ? (
                <line
                  x1={chartPadding}
                  x2={chartWidth - chartPadding}
                  y1={valueToY(thresholds.min)}
                  y2={valueToY(thresholds.min)}
                  stroke="#0EA5E9"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}

              {chartType === "area" ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
              {chartType === "area" || chartType === "line" ? (
                <path
                  d={linePath}
                  fill="none"
                  stroke={barColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {analyticsEnabled && rollingPath ? (
                <path
                  d={rollingPath}
                  fill="none"
                  stroke="#2563EB"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  strokeOpacity="0.85"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {analyticsEnabled && trendPath ? (
                <path
                  d={trendPath}
                  fill="none"
                  stroke="#7C3AED"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  strokeDasharray="5 4"
                  strokeOpacity="0.85"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {eventMarkerPoints.map((marker) => (
                <g
                  key={marker.id}
                  onMouseEnter={(event) => {
                    setHoveredEvent(marker);
                    updateHoverPosition(event);
                  }}
                  onMouseMove={updateHoverPosition}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  <EventMarker
                    x={marker.x}
                    height={chartHeight}
                    label={marker.label}
                  />
                </g>
              ))}
              {chartType === "bar"
                ? chartPoints.map((point, index) => (
                    <rect
                      key={`${point.timestamp}-bar-${index}`}
                      x={point.x - barWidth / 2}
                      y={point.y}
                      width={barWidth}
                      height={chartHeight - chartPadding - point.y}
                      rx="2"
                      fill={isOutOfThreshold(point) ? "#EF4444" : barColor}
                      opacity="0.88"
                    />
                  ))
                : null}
              {chartPoints.map((point, index) => (
                <g key={`${point.timestamp}-${index}`}>
                  {point.alertSeverity ? (
                    <AlertMarker
                      x={point.x}
                      y={Math.max(10, point.y - 8)}
                      height={chartHeight}
                      severity={point.alertSeverity}
                      label={point.alertMessage || `${point.alertSeverity} alert`}
                    />
                  ) : null}
                  {chartType !== "bar" ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={activePoint?.timestamp === point.timestamp ? 4 : chartType === "scatter" ? 3.2 : 2.6}
                      fill={isOutOfThreshold(point) ? "#EF4444" : "white"}
                      stroke={isOutOfThreshold(point) ? "#EF4444" : barColor}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : null}
                  <rect
                    x={Math.max(0, point.x - 12)}
                    y="0"
                    width="24"
                    height={chartHeight}
                    fill="transparent"
                    onMouseEnter={(event) => {
                      setHoveredPoint(point);
                      updateHoverPosition(event);
                    }}
                    onMouseMove={updateHoverPosition}
                    onFocus={() => setHoveredPoint(point)}
                  />
                </g>
              ))}
            </svg>

            {activePoint && hoverPosition ? (
              <div
                className="pointer-events-none absolute z-20 max-w-[260px] -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xl transition-transform duration-75"
                style={{
                  left: hoverPosition.x,
                  top: hoverPosition.y > (expanded ? 140 : 46) ? 8 : hoverPosition.y + 14,
                }}
              >
                <p className="text-[10px] uppercase tracking-wide text-slate-300">
                  Time: {activePoint.label || "Unknown"}
                </p>
                <p>{title}: {formatTooltipValue(activePoint)}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-300">
                  Status: {data.badge || "Live"}
                </p>
                {analyticsEnabled ? (
                  <>
                    <p className="text-[10px] uppercase tracking-wide text-blue-200">
                      Rolling avg:{" "}
                      {typeof activePoint.rollingAverage === "number"
                        ? activePoint.rollingAverage.toFixed(2)
                        : "-"}{" "}
                      {data.unit}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-violet-200">
                      Trend:{" "}
                      {typeof activePoint.trendValue === "number"
                        ? activePoint.trendValue.toFixed(2)
                        : "-"}{" "}
                      {data.unit}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-300">
                      Min/Max:{" "}
                      {typeof activePoint.movingMin === "number"
                        ? activePoint.movingMin.toFixed(2)
                        : "-"}
                      /
                      {typeof activePoint.movingMax === "number"
                        ? activePoint.movingMax.toFixed(2)
                        : "-"}{" "}
                      {data.unit}
                    </p>
                  </>
                ) : null}
                {activePoint.alertSeverity ? (
                  <p className="text-[10px] uppercase tracking-wide text-red-200">
                    Alert: {activePoint.alertSeverity} - {activePoint.alertMessage || "Threshold violation"}
                  </p>
                ) : null}
                {isOutOfThreshold(activePoint) ? (
                  <p className="text-[10px] uppercase tracking-wide text-red-200">
                    Threshold exceeded
                  </p>
                ) : null}
              </div>
            ) : null}

            {hoveredEvent && hoverPosition ? (
              <div
                className="pointer-events-none absolute z-20 max-w-[240px] -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xl"
                style={{
                  left: hoverPosition.x,
                  top: hoverPosition.y > (expanded ? 140 : 46) ? 8 : hoverPosition.y + 14,
                }}
              >
                <p className="text-[10px] uppercase tracking-wide text-slate-300">
                  Event marker
                </p>
                <p>{hoveredEvent.label}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-300">
                  Time: {formatDisplayTime(hoveredEvent.timestamp) || String(hoveredEvent.timestamp)}
                </p>
              </div>
            ) : null}

            <div className="absolute inset-x-0 -bottom-1 flex justify-between px-1">
              {data.trend.map((point, index) => {
                const showLabel =
                  index === 0 ||
                  index === data.trend.length - 1 ||
                  index % labelInterval === 0;
                return showLabel ? (
                  <span
                    key={`${point.timestamp}-${index}`}
                    className="text-[10px] font-bold text-slate-400"
                  >
                    {point.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ) : (
          <div className="relative z-10 h-full flex items-center justify-center text-sm font-bold text-slate-400">
            No chart data
          </div>
        )}
      </div>
    </article>
  );
}
