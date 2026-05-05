import type {
  ChartRange,
  SensorChartPointResponse,
  SensorChartResponse,
} from "../../../types/iot";

export type DisplayChartRange = "H1" | "D1" | "D7" | "M1";

export const DISPLAY_CHART_RANGE_OPTIONS: Array<{
  value: DisplayChartRange;
  label: string;
}> = [
  { value: "H1", label: "1h" },
  { value: "D1", label: "1d" },
  { value: "D7", label: "7d" },
  { value: "M1", label: "1m" },
];

export const toApiChartRange = (range: DisplayChartRange): ChartRange => {
  if (range === "H1" || range === "D1") return "H24";
  if (range === "M1") return "D30";
  return "D7";
};

const lookbackMsByDisplayRange: Record<DisplayChartRange, number> = {
  H1: 60 * 60 * 1000,
  D1: 24 * 60 * 60 * 1000,
  D7: 7 * 24 * 60 * 60 * 1000,
  M1: 30 * 24 * 60 * 60 * 1000,
};

const formatChartTick = (value: string, range: DisplayChartRange): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  if (range === "H1") {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (range === "D1") {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
  }).format(date);
};

export interface SensorTrendPoint {
  timestamp: string;
  label: string;
  value: number;
  minValue: number | null;
  maxValue: number | null;
  sampleCount: number | null;
}

export const chartToTrend = (
  chart: SensorChartResponse | undefined,
  range: DisplayChartRange,
): SensorTrendPoint[] => {
  if (!chart?.points?.length) return [];

  const latestPointTime = chart.points.reduce<number>((latest, point) => {
    const pointTime = Date.parse(point.bucketStart);
    return Number.isNaN(pointTime) ? latest : Math.max(latest, pointTime);
  }, 0);
  const cutoff = latestPointTime - lookbackMsByDisplayRange[range];

  return chart.points
    .filter((point): point is SensorChartPointResponse & { avgValue: number } => {
      if (point.avgValue === null) return false;
      const pointTime = Date.parse(point.bucketStart);
      return !Number.isNaN(pointTime) && pointTime >= cutoff;
    })
    .map((point) => ({
      timestamp: point.bucketStart,
      label: formatChartTick(point.bucketStart, range),
      value: point.avgValue,
      minValue: point.minValue,
      maxValue: point.maxValue,
      sampleCount: point.sampleCount,
    }));
};
