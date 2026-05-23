import type { SensorChartType } from "../components/IoTMetricCard";

export const CHART_TYPES: Array<{ value: SensorChartType; label: string }> = [
  { value: "area", label: "Area" },
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "scatter", label: "Dots" },
];

export const CHART_TYPE_LABEL_KEYS = {
  area: "iot.charts.area",
  line: "iot.charts.line",
  bar: "iot.charts.bar",
  scatter: "iot.charts.scatter",
} as const;
