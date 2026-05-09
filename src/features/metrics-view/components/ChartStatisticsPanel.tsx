import type { ChartStatistics } from "../utils/chartAnalytics";

interface ChartStatisticsPanelProps {
  statistics: ChartStatistics;
  unit: string;
  analyticsEnabled?: boolean;
  hasThresholds?: boolean;
}

const formatValue = (value: number | null, unit = "") =>
  value === null ? "-" : `${value.toFixed(2)} ${unit}`.trim();

export function ChartStatisticsPanel({
  statistics,
  unit,
  analyticsEnabled = false,
  hasThresholds = false,
}: ChartStatisticsPanelProps) {
  const items = [
    { label: "Current", value: formatValue(statistics.current, unit) },
    { label: "Min", value: formatValue(statistics.min, unit) },
    { label: "Max", value: formatValue(statistics.max, unit) },
    { label: "Avg", value: formatValue(statistics.avg, unit) },
    { label: "Trend", value: analyticsEnabled ? statistics.trend : "-" },
    {
      label: "Rolling avg",
      value: analyticsEnabled ? formatValue(statistics.rollingAvg, unit) : "-",
    },
    { label: "Alerts", value: String(statistics.alertsCount) },
    {
      label: "Outside threshold",
      value: hasThresholds ? `${statistics.durationAboveThreshold} points` : "-",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-black capitalize text-slate-800">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
