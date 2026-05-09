import type { AlertEventItemResponse } from "../../../types/iot";
import type { SensorTrend } from "../components/IoTMetricCard";
import type { SensorThresholds } from "./chartThresholds";

export interface AnalyticsPoint extends SensorTrend {
  rollingAverage?: number | null;
  trendValue?: number | null;
  movingMin?: number | null;
  movingMax?: number | null;
  alertSeverity?: string | null;
  alertMessage?: string | null;
}

export interface EventMarkerData {
  id: string;
  timestamp: string | number | Date;
  label: string;
  type: "data-update";
}

export interface ChartStatistics {
  current: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  trend: "up" | "down" | "flat" | "none";
  rollingAvg: number | null;
  alertsCount: number;
  durationAboveThreshold: number;
}

interface CalculateStatisticsOptions {
  thresholds?: SensorThresholds;
  alertsCount?: number;
}

const parseTime = (value?: string | number | Date | null): number => {
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

const regression = (values: number[]) => {
  if (values.length < 2) {
    return { slope: 0, intercept: values[0] ?? 0 };
  }
  const n = values.length;
  const sumX = values.reduce((sum, _value, index) => sum + index, 0);
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
  const sumXX = values.reduce((sum, _value, index) => sum + index * index, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n };
  }
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

export const deriveAnalytics = (
  data: SensorTrend[],
  alerts: AlertEventItemResponse[] = [],
): AnalyticsPoint[] => {
  const values = data.map((point) => point.value);
  const trend = regression(values);
  const alertsByTime = new Map<number, AlertEventItemResponse[]>();

  alerts.forEach((alert) => {
    const openedAt = parseTime(alert.openedAt);
    if (Number.isNaN(openedAt)) return;
    const bucket = Math.round(openedAt / 60_000);
    alertsByTime.set(bucket, [...(alertsByTime.get(bucket) ?? []), alert]);
  });

  return data.map((point, index) => {
    const windowStart = Math.max(0, index - 2);
    const windowValues = values
      .slice(windowStart, index + 1)
      .filter((value) => Number.isFinite(value));
    const rollingAverage =
      windowValues.length > 0
        ? windowValues.reduce((sum, value) => sum + value, 0) / windowValues.length
        : null;
    const time = parseTime(point.timestamp);
    const alertBucket = Number.isNaN(time) ? null : Math.round(time / 60_000);
    const nearbyAlert = alertBucket
      ? alertsByTime.get(alertBucket)?.[0] ??
        alerts.find((alert) => {
          const alertTime = parseTime(alert.openedAt);
          return !Number.isNaN(alertTime) && Math.abs(alertTime - time) <= 30 * 60_000;
        })
      : null;

    return {
      ...point,
      rollingAverage,
      trendValue: trend.intercept + trend.slope * index,
      movingMin: windowValues.length ? Math.min(...windowValues) : null,
      movingMax: windowValues.length ? Math.max(...windowValues) : null,
      alertSeverity: nearbyAlert?.severity ?? null,
      alertMessage: nearbyAlert?.message ?? null,
    };
  });
};

export const calculateStatistics = (
  data: AnalyticsPoint[],
  options: CalculateStatisticsOptions = {},
): ChartStatistics => {
  const { thresholds } = options;
  const alertsCount =
    options.alertsCount ??
    data.filter((point) => Boolean(point.alertSeverity || point.alertMessage)).length;
  const values = data.map((point) => point.value).filter((value) => Number.isFinite(value));
  if (values.length === 0) {
    return {
      current: null,
      min: null,
      max: null,
      avg: null,
      trend: "none",
      rollingAvg: null,
      alertsCount,
      durationAboveThreshold: 0,
    };
  }

  const first = values[0];
  const last = values[values.length - 1];
  const slope = regression(values).slope;
  const durationAboveThreshold = data.filter((point) => {
    return (
      (typeof thresholds?.max === "number" && point.value > thresholds.max) ||
      (typeof thresholds?.min === "number" && point.value < thresholds.min)
    );
  }).length;

  return {
    current: last,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((sum, value) => sum + value, 0) / values.length,
    trend: Math.abs(slope) < 0.01 ? "flat" : last >= first ? "up" : "down",
    rollingAvg: data[data.length - 1]?.rollingAverage ?? null,
    alertsCount,
    durationAboveThreshold,
  };
};

export const createDataUpdateMarker = (
  timestamp?: string | number | Date | null,
): EventMarkerData[] => {
  if (!timestamp) return [];
  return [
    {
      id: `data-update-${timestamp}`,
      timestamp,
      label: "Latest data update",
      type: "data-update",
    },
  ];
};

export const thresholdsFromAlertEvents = (
  alerts: AlertEventItemResponse[] = [],
): SensorThresholds | undefined => {
  const alertWithThreshold = alerts.find(
    (alert) => alert.thresholdMin !== null || alert.thresholdMax !== null,
  );

  if (!alertWithThreshold) return undefined;

  return {
    min: alertWithThreshold.thresholdMin ?? undefined,
    max: alertWithThreshold.thresholdMax ?? undefined,
  };
};
