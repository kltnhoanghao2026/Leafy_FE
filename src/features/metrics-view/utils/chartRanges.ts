import type {
  ChartRange,
  SensorChartPointResponse,
  SensorChartResponse,
} from "../../../types/iot";
import { useSettingsStore } from "../../settings/store/useSettingsStore";

const currentIntlLocale = () =>
  useSettingsStore.getState().locale === "vi" ? "vi-VN" : "en-US";

export type DisplayChartRange = "H1" | "D1" | "D7" | "M1";

export const DISPLAY_CHART_RANGE_OPTIONS: Array<{
  value: DisplayChartRange;
  label: string;
}> = [
  { value: "H1", label: "1h" },
  { value: "D1", label: "1d" },
  { value: "D7", label: "7d" },
  { value: "M1", label: "30d" },
];

export const toApiChartRange = (range: DisplayChartRange): ChartRange => {
  if (range === "H1" || range === "D1") return "H24";
  if (range === "M1") return "D30";
  return "D7";
};

type DisplayBucket = "5m" | "1h" | "1d";

const bucketByDisplayRange: Record<DisplayChartRange, DisplayBucket> = {
  H1: "5m",
  D1: "1h",
  D7: "1d",
  M1: "1d",
};

const lookbackMsByDisplayRange: Record<DisplayChartRange, number> = {
  H1: 60 * 60 * 1000,
  D1: 24 * 60 * 60 * 1000,
  D7: 7 * 24 * 60 * 60 * 1000,
  M1: 30 * 24 * 60 * 60 * 1000,
};

const parseChartTime = (value: string | number): number => {
  if (typeof value === "number") {
    return value < 10_000_000_000 ? value * 1000 : value;
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && value.trim() !== "") {
    return numericValue < 10_000_000_000 ? numericValue * 1000 : numericValue;
  }

  return Date.parse(value);
};

const formatChartTick = (
  value: string | number,
  range: DisplayChartRange,
): string => {
  const time = parseChartTime(value);
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return String(value);

  if (range === "H1") {
    return new Intl.DateTimeFormat(currentIntlLocale(), {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (range === "D1") {
    return new Intl.DateTimeFormat(currentIntlLocale(), {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(currentIntlLocale(), {
    month: "short",
    day: "2-digit",
  }).format(date);
};

const alignToDisplayBucket = (
  value: string | number,
  bucket: DisplayBucket,
): string | null => {
  const date = new Date(parseChartTime(value));
  if (Number.isNaN(date.getTime())) return null;

  if (bucket === "5m") {
    const minutes = Math.floor(date.getMinutes() / 5) * 5;
    date.setMinutes(minutes, 0, 0);
  } else if (bucket === "1h") {
    date.setMinutes(0, 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
};

type NumericChartPoint = SensorChartPointResponse & { avgValue: number };

const aggregateDisplayBucket = (
  points: NumericChartPoint[],
  range: DisplayChartRange,
): NumericChartPoint[] => {
  const bucket = bucketByDisplayRange[range];
  const groups = new Map<
    string,
    {
      bucketStart: string;
      bucketEnd: string | number;
      weightedValue: number;
      valueCount: number;
      sampleCount: number;
      minValue: number | null;
      maxValue: number | null;
    }
  >();

  for (const point of points) {
    const bucketStart = alignToDisplayBucket(point.bucketStart, bucket);
    if (!bucketStart) continue;

    const weight = point.sampleCount && point.sampleCount > 0 ? point.sampleCount : 1;
    const current =
      groups.get(bucketStart) ??
      {
        bucketStart,
        bucketEnd: point.bucketEnd,
        weightedValue: 0,
        valueCount: 0,
        sampleCount: 0,
        minValue: null,
        maxValue: null,
      };

    current.bucketEnd = point.bucketEnd;
    current.weightedValue += point.avgValue * weight;
    current.valueCount += weight;
    current.sampleCount += point.sampleCount ?? 0;

    const pointMin = point.minValue ?? point.avgValue;
    const pointMax = point.maxValue ?? point.avgValue;
    current.minValue =
      current.minValue === null ? pointMin : Math.min(current.minValue, pointMin);
    current.maxValue =
      current.maxValue === null ? pointMax : Math.max(current.maxValue, pointMax);

    groups.set(bucketStart, current);
  }

  return [...groups.values()]
    .sort((left, right) => Date.parse(left.bucketStart) - Date.parse(right.bucketStart))
    .map((group) => ({
      bucketStart: group.bucketStart,
      bucketEnd: group.bucketEnd,
      avgValue: group.valueCount > 0 ? group.weightedValue / group.valueCount : 0,
      minValue: group.minValue,
      maxValue: group.maxValue,
      sampleCount: group.sampleCount || group.valueCount,
    }));
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
    const pointTime = parseChartTime(point.bucketStart);
    return Number.isNaN(pointTime) ? latest : Math.max(latest, pointTime);
  }, 0);
  const cutoff = latestPointTime - lookbackMsByDisplayRange[range];

  const filteredPoints = chart.points
    .filter((point): point is SensorChartPointResponse & { avgValue: number } => {
      if (point.avgValue === null) return false;
      const pointTime = parseChartTime(point.bucketStart);
      return !Number.isNaN(pointTime) && pointTime >= cutoff;
    });

  return aggregateDisplayBucket(filteredPoints, range)
    .map((point) => ({
      timestamp: String(point.bucketStart),
      label: formatChartTick(point.bucketStart, range),
      value: point.avgValue,
      minValue: point.minValue,
      maxValue: point.maxValue,
      sampleCount: point.sampleCount,
    }));
};
