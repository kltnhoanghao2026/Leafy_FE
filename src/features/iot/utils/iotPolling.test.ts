import { describe, expect, it } from "vitest";
import {
  getIotChartRefetchInterval,
  IOT_POLLING_INTERVALS,
} from "./iotPolling";

describe("iot polling policy", () => {
  it("uses short polling for 1h and 1d display ranges", () => {
    expect(getIotChartRefetchInterval("1h")).toBe(
      IOT_POLLING_INTERVALS.chartShort,
    );
    expect(getIotChartRefetchInterval("H1")).toBe(
      IOT_POLLING_INTERVALS.chartShort,
    );
    expect(getIotChartRefetchInterval("1d")).toBe(
      IOT_POLLING_INTERVALS.chartShort,
    );
    expect(getIotChartRefetchInterval("D1")).toBe(
      IOT_POLLING_INTERVALS.chartShort,
    );
  });

  it("uses medium polling for 7d and 30d display ranges", () => {
    expect(getIotChartRefetchInterval("7d")).toBe(
      IOT_POLLING_INTERVALS.chartMedium,
    );
    expect(getIotChartRefetchInterval("D7")).toBe(
      IOT_POLLING_INTERVALS.chartMedium,
    );
    expect(getIotChartRefetchInterval("30d")).toBe(
      IOT_POLLING_INTERVALS.chartMedium,
    );
    expect(getIotChartRefetchInterval("M1")).toBe(
      IOT_POLLING_INTERVALS.chartMedium,
    );
  });

  it("keeps API range aliases aligned with the display range policy", () => {
    expect(getIotChartRefetchInterval("H24")).toBe(
      IOT_POLLING_INTERVALS.chartShort,
    );
    expect(getIotChartRefetchInterval("D30")).toBe(
      IOT_POLLING_INTERVALS.chartMedium,
    );
  });

  it("falls back to short polling for unknown or missing ranges", () => {
    expect(getIotChartRefetchInterval("UNKNOWN")).toBe(
      IOT_POLLING_INTERVALS.chartShort,
    );
    expect(getIotChartRefetchInterval()).toBe(
      IOT_POLLING_INTERVALS.chartShort,
    );
  });
});
