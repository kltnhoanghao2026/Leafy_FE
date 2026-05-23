import type { ComponentType, WheelEvent as ReactWheelEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ChartStatisticsPanel } from "./ChartStatisticsPanel";
import {
  IoTMetricCard,
  type MetricData,
  type SensorChartType,
} from "./IoTMetricCard";
import {
  CHART_TYPE_LABEL_KEYS,
  CHART_TYPES,
} from "../utils/chartHelpers";
import {
  calculateStatistics,
  type AnalyticsPoint,
  type EventMarkerData,
} from "../utils/chartAnalytics";
import type { SensorThresholds } from "../utils/chartThresholds";
import type { DisplayChartRange } from "../utils/chartRanges";
import { useTranslation } from "../../../i18n";
import { formatChartRangeLabel } from "../../iot/utils/iotTranslation";

interface RangeOption {
  value: DisplayChartRange;
  label: string;
}

interface SensorChartModalProps {
  title: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  data: MetricData;
  colorClass: string;
  barColor: string;
  iconBgClass: string;
  chartType: SensorChartType;
  onChartTypeChange: (type: SensorChartType) => void;
  range: DisplayChartRange;
  rangeOptions: RangeOption[];
  onRangeChange: (range: DisplayChartRange) => void;
  thresholds?: SensorThresholds;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onClose: () => void;
  analyticsEnabled?: boolean;
  onAnalyticsToggle?: (enabled: boolean) => void;
  eventMarkers?: EventMarkerData[];
  exportFilename?: string;
}

export function SensorChartModal({
  title,
  icon,
  data,
  colorClass,
  barColor,
  iconBgClass,
  chartType,
  onChartTypeChange,
  range,
  rangeOptions,
  onRangeChange,
  thresholds,
  isLoading,
  isError,
  onRetry,
  onClose,
  analyticsEnabled = false,
  onAnalyticsToggle,
  eventMarkers = [],
  exportFilename,
}: SensorChartModalProps) {
  const { t } = useTranslation();
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(1);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);
  // Reset window when range/trend changes — deferred to avoid cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setWindowStart(0);
      setWindowEnd(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [range, data.trend]);

  const visibleData = useMemo(() => {
    if (data.trend.length <= 2) return data.trend;
    const start = Math.floor(windowStart * (data.trend.length - 1));
    const end = Math.max(start + 2, Math.ceil(windowEnd * data.trend.length));
    return data.trend.slice(start, Math.min(end, data.trend.length));
  }, [data.trend, windowEnd, windowStart]);
  const visibleMetricData = useMemo(
    () => ({
      ...data,
      trend: visibleData,
      latestUpdatedAt: visibleData[visibleData.length - 1]?.timestamp ?? data.latestUpdatedAt,
    }),
    [data, visibleData],
  );
  const statistics = useMemo(
    () =>
      calculateStatistics(visibleData as AnalyticsPoint[], {
        thresholds,
      }),
    [thresholds, visibleData],
  );

  const zoomIn = () => {
    const span = windowEnd - windowStart;
    if (span <= 0.25) return;
    const midpoint = windowStart + span / 2;
    const nextSpan = span * 0.6;
    setWindowStart(Math.max(0, midpoint - nextSpan / 2));
    setWindowEnd(Math.min(1, midpoint + nextSpan / 2));
  };
  const zoomOut = () => {
    const span = windowEnd - windowStart;
    const midpoint = windowStart + span / 2;
    const nextSpan = Math.min(1, span / 0.6);
    setWindowStart(Math.max(0, midpoint - nextSpan / 2));
    setWindowEnd(Math.min(1, midpoint + nextSpan / 2));
  };
  const pan = (direction: -1 | 1) => {
    const span = windowEnd - windowStart;
    const step = span * 0.25 * direction;
    const nextStart = Math.max(0, Math.min(1 - span, windowStart + step));
    setWindowStart(nextStart);
    setWindowEnd(nextStart + span);
  };
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 2) return;
    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} ${t("iot.metrics.expandedChart")}`}
    >
      <div className="mx-auto my-6 w-full max-w-5xl rounded-[2rem] bg-slate-50 p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#245A34]">
              {t("iot.metrics.expandedChart")}
            </p>
            <h3 className="text-2xl font-black text-slate-900">{title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={range === option.value}
                  onClick={() => onRangeChange(option.value)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    range === option.value
                      ? "bg-[#245A34] text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#245A34]"
                  }`}
                >
                  {formatChartRangeLabel(t, option.value)}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label={t("iot.metrics.closeExpandedChart")}
              onClick={onClose}
              className="rounded-full bg-white p-3 text-slate-500 shadow-sm hover:text-red-500"
            >
              <X className="h-5 w-5" strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                aria-pressed={chartType === type.value}
                onClick={() => onChartTypeChange(type.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  chartType === type.value
                    ? "bg-[#245A34] text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#245A34]"
                }`}
              >
                {t(CHART_TYPE_LABEL_KEYS[type.value])}
              </button>
            ))}
          </div>
          {onAnalyticsToggle ? (
            <button
              type="button"
              aria-pressed={analyticsEnabled}
              onClick={() => onAnalyticsToggle(!analyticsEnabled)}
              className={`rounded-full px-4 py-2 text-xs font-black shadow-sm transition ${
                analyticsEnabled
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:text-[#245A34]"
              }`}
            >
              {t("iot.metrics.analytics")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:text-[#245A34]"
          >
            {t("iot.metrics.zoomIn")}
          </button>
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:text-[#245A34]"
          >
            {t("iot.metrics.zoomOut")}
          </button>
          <button
            type="button"
            onClick={() => pan(-1)}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:text-[#245A34]"
          >
            {t("iot.metrics.panLeft")}
          </button>
          <button
            type="button"
            onClick={() => pan(1)}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:text-[#245A34]"
          >
            {t("iot.metrics.panRight")}
          </button>
          <span className="text-xs font-bold text-slate-400">
            {t("iot.metrics.window")(Math.round(windowStart * 100), Math.round(windowEnd * 100))}
          </span>
        </div>

        <div onWheel={handleWheel}>
          <IoTMetricCard
            title={title}
            icon={icon}
            data={visibleMetricData}
            colorClass={colorClass}
            barColor={barColor}
            iconBgClass={iconBgClass}
            chartType={chartType}
            onChartTypeChange={onChartTypeChange}
            thresholds={thresholds}
            showThresholds={Boolean(thresholds)}
            expanded
            isLoading={isLoading}
            isError={isError}
            onRetry={onRetry}
            analyticsEnabled={analyticsEnabled}
            onAnalyticsToggle={onAnalyticsToggle}
            eventMarkers={eventMarkers}
            exportFilename={exportFilename}
          />
        </div>

        <div className="mt-4">
          <ChartStatisticsPanel
            statistics={statistics}
            unit={data.unit}
            analyticsEnabled={analyticsEnabled}
            hasThresholds={Boolean(thresholds)}
          />
        </div>
      </div>
    </div>
  );
}
