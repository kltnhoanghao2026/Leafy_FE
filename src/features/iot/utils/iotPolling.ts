import type { ChartRange } from "../../../types/iot";

export const IOT_POLLING_INTERVALS = {
  latest: 10_000,
  overview: 10_000,
  dashboard: 15_000,
  openAlertWatcher: 10_000,
  chartShort: 60_000,
  chartMedium: 120_000,
} as const;

export function getIotChartRefetchInterval(
  range?: ChartRange | string | null,
): number | false {
  switch (range) {
    case "1h":
    case "H1":
    case "1d":
    case "D1":
    case "H24":
    case "D3":
      return IOT_POLLING_INTERVALS.chartShort;
    case "7d":
    case "D7":
    case "30d":
    case "M1":
    case "D30":
      return IOT_POLLING_INTERVALS.chartMedium;
    default:
      return IOT_POLLING_INTERVALS.chartShort;
  }
}
