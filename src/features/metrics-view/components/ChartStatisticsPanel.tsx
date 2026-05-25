import type { ChartStatistics } from "../utils/chartAnalytics";
import { useTranslation } from "../../../i18n";

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
  const { t } = useTranslation();
  const items = [
    { label: t("iot.metrics.current"), value: formatValue(statistics.current, unit) },
    { label: t("iot.metrics.min"), value: formatValue(statistics.min, unit) },
    { label: t("iot.metrics.max"), value: formatValue(statistics.max, unit) },
    { label: t("iot.metrics.avg"), value: formatValue(statistics.avg, unit) },
    { label: t("iot.metrics.trend"), value: analyticsEnabled ? statistics.trend : "-" },
    {
      label: t("iot.metrics.rollingAvg"),
      value: analyticsEnabled ? formatValue(statistics.rollingAvg, unit) : "-",
    },
    { label: t("iot.metrics.alerts"), value: String(statistics.alertsCount) },
    {
      label: t("iot.metrics.outsideThreshold"),
      value: hasThresholds ? t("iot.metrics.points")(statistics.durationAboveThreshold) : "-",
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
