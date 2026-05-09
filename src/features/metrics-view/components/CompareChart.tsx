import type { MouseEvent as ReactMouseEvent } from "react";
import { useMemo, useState } from "react";
import { AlertMarker } from "./AlertMarker";
import { ChartStatisticsPanel } from "./ChartStatisticsPanel";
import { CSVExportButton } from "./CSVExportButton";
import type { SensorTrend } from "./IoTMetricCard";
import { calculateStatistics, type AnalyticsPoint } from "../utils/chartAnalytics";

export interface CompareSeries {
  sensorCode: string;
  title: string;
  unit: string;
  color: string;
  data: SensorTrend[];
}

interface CompareChartProps {
  series: CompareSeries[];
  analyticsEnabled?: boolean;
  exportFilename?: string;
}

const chartWidth = 640;
const chartHeight = 220;
const chartPadding = 24;

export function CompareChart({
  series,
  analyticsEnabled = false,
  exportFilename,
}: CompareChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const drawableSeries = series.filter((item) => item.data.length > 0);
  const primary = drawableSeries[0];

  const valueDomain = useMemo(() => {
    const values = drawableSeries.flatMap((item) =>
      item.data.map((point) => point.value).filter((value) => Number.isFinite(value)),
    );
    if (values.length === 0) return [0, 1] as const;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.15, Math.abs(max) * 0.05, 1);
    return [Math.max(0, min - padding), max + padding] as const;
  }, [drawableSeries]);

  const valueToY = (value: number) => {
    const range = Math.max(valueDomain[1] - valueDomain[0], 1);
    const normalized = (value - valueDomain[0]) / range;
    return (
      chartHeight -
      chartPadding -
      Math.min(1, Math.max(0, normalized)) * (chartHeight - chartPadding * 2)
    );
  };

  const pointToX = (index: number, length: number) => {
    const maxIndex = Math.max(length - 1, 1);
    return chartPadding + (index / maxIndex) * (chartWidth - chartPadding * 2);
  };

  const paths = drawableSeries.map((item) => ({
    ...item,
    path: item.data
      .map((point, index) => {
        const x = item.data.length === 1 ? chartWidth / 2 : pointToX(index, item.data.length);
        return `${index === 0 ? "M" : "L"} ${x} ${valueToY(point.value)}`;
      })
      .join(" "),
    rollingPath: item.data
      .filter((point) => typeof point.rollingAverage === "number")
      .map((point, index) => {
        const x = item.data.length === 1 ? chartWidth / 2 : pointToX(index, item.data.length);
        return `${index === 0 ? "M" : "L"} ${x} ${valueToY(point.rollingAverage as number)}`;
      })
      .join(" "),
  }));
  const activeIndex = hoverIndex ?? Math.max((primary?.data.length ?? 1) - 1, 0);
  const activePoint = primary?.data[activeIndex];
  const csvData = drawableSeries.flatMap((item) =>
    item.data.map((point) => ({
      ...point,
      timestamp: `${item.sensorCode}:${point.timestamp}`,
    })),
  );
  const statistics = useMemo(
    () => calculateStatistics(drawableSeries.flatMap((item) => item.data) as AnalyticsPoint[]),
    [drawableSeries],
  );
  const updateHoverPosition = (event: ReactMouseEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setHoverPosition({
      x: Math.min(Math.max(event.clientX - rect.left, 12), rect.width - 12),
      y: Math.min(Math.max(event.clientY - rect.top, 12), rect.height - 12),
    });
  };

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-base font-black text-slate-900">Compare sensors</h4>
          <p className="text-sm font-semibold text-slate-500">
            Multi-sensor trend from the existing chart queries.
          </p>
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          {drawableSeries.length} selected
        </p>
        <CSVExportButton
          chartData={csvData}
          filename={exportFilename || "iot-compare-chart"}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 hover:border-[#245A34] hover:text-[#245A34] disabled:opacity-40"
        />
      </div>

      {drawableSeries.length === 0 ? (
        <div className="flex h-56 items-center justify-center rounded-3xl bg-slate-50 text-sm font-bold text-slate-400">
          No compare data
        </div>
      ) : (
        <div
          className="relative min-h-64 overflow-visible rounded-3xl bg-slate-50 p-4"
          onMouseLeave={() => {
            setHoverIndex(null);
            setHoverPosition(null);
          }}
        >
          <svg
            className="h-56 w-full overflow-visible"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Multi-sensor compare line chart"
          >
            {paths.map((item) => (
              <path
                key={item.sensorCode}
                d={item.path}
                fill="none"
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {analyticsEnabled
              ? paths.map((item) =>
                  item.rollingPath ? (
                    <path
                      key={`${item.sensorCode}-rolling`}
                      d={item.rollingPath}
                      fill="none"
                      stroke={item.color}
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeOpacity="0.45"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : null,
                )
              : null}
            {drawableSeries.flatMap((item) =>
              item.data
                .map((point, index) => {
                  if (!point.alertSeverity) return null;
                  const x =
                    item.data.length === 1 ? chartWidth / 2 : pointToX(index, item.data.length);
                  return (
                    <AlertMarker
                      key={`${item.sensorCode}-${point.timestamp}-alert`}
                      x={x}
                      y={valueToY(point.value)}
                      height={chartHeight}
                      severity={point.alertSeverity}
                      label={point.alertMessage || `${point.alertSeverity} alert`}
                    />
                  );
                })
                .filter(Boolean),
            )}
            {primary?.data.map((point, index) => {
              const x = primary.data.length === 1 ? chartWidth / 2 : pointToX(index, primary.data.length);
              return (
                <rect
                  key={`${point.timestamp}-${index}`}
                  x={Math.max(0, x - 14)}
                  y="0"
                  width="28"
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={(event) => {
                    setHoverIndex(index);
                    updateHoverPosition(event);
                  }}
                  onMouseMove={updateHoverPosition}
                  onFocus={() => setHoverIndex(index)}
                />
              );
            })}
          </svg>

          {activePoint && hoverPosition ? (
            <div
              className="pointer-events-none absolute z-20 max-w-[300px] -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl"
              style={{
                left: hoverPosition.x,
                top: hoverPosition.y > 110 ? 14 : hoverPosition.y + 22,
              }}
            >
              <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-300">
                Time: {activePoint.label || "Unknown"}
              </p>
              <div className="space-y-1">
                {drawableSeries.map((item) => {
                  const match =
                    item.data.find((point) => point.timestamp === activePoint.timestamp) ||
                    item.data[Math.min(activeIndex, item.data.length - 1)];
                  return (
                    <p key={item.sensorCode} className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.title}
                      </span>
                      <span>
                        {match ? `${match.value.toFixed(2)} ${item.unit}` : "-"}
                      </span>
                      {analyticsEnabled && typeof match?.rollingAverage === "number" ? (
                        <span className="text-blue-200">
                          avg {match.rollingAverage.toFixed(2)}
                        </span>
                      ) : null}
                      {match?.alertSeverity ? (
                        <span className="text-red-200">
                          {match.alertSeverity}
                        </span>
                      ) : null}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-3">
            {drawableSeries.map((item) => (
              <span
                key={item.sensorCode}
                className="inline-flex items-center gap-2 text-xs font-black text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.title}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <ChartStatisticsPanel
              statistics={statistics}
              unit=""
              analyticsEnabled={analyticsEnabled}
            />
          </div>
        </div>
      )}
    </section>
  );
}
