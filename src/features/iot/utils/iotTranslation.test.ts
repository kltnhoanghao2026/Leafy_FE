import { describe, expect, it } from "vitest";
import type { TFunction } from "../../../i18n/context";
import { en } from "../../../i18n/locales/en";
import { vi } from "../../../i18n/locales/vi";
import type { TranslationDict } from "../../../i18n/types";
import {
  formatAlertStatusLabel,
  formatAlertTypeLabel,
  formatConfigStatusLabel,
  formatDeviceStatusLabel,
  formatSensorLabel,
  formatSeverityLabel,
} from "./iotTranslation";

const makeTestT =
  (dict: TranslationDict): TFunction =>
  ((path) => {
    const parts = String(path).split(".");
    let node: unknown = dict;

    for (const part of parts) {
      if (!node || typeof node !== "object") return path;
      node = (node as Record<string, unknown>)[part];
    }

    return (node ?? path) as ReturnType<TFunction>;
  }) as TFunction;

describe("iot translation helpers", () => {
  const tVi = makeTestT(vi);
  const tEn = makeTestT(en);

  it("returns translated labels for known IoT enum values", () => {
    expect(formatSensorLabel(tVi, "AIR_TEMP")).toBe("Nhiệt độ không khí");
    expect(formatSensorLabel(tEn, "AIR_TEMP")).toBe("Air temperature");
    expect(formatSeverityLabel(tEn, "CRITICAL")).toBe("Critical");
    expect(formatAlertStatusLabel(tEn, "ACKNOWLEDGED")).toBe("Acknowledged");
    expect(formatAlertTypeLabel(tEn, "DEVICE_OFFLINE")).toBe("Device offline");
    expect(formatDeviceStatusLabel(tEn, "ONLINE")).toBe("Online");
    expect(formatConfigStatusLabel(tEn, "ACKED")).toBe("Acknowledged by device");
  });

  it("falls back safely for unknown backend values", () => {
    expect(formatSensorLabel(tEn, "CUSTOM_SENSOR")).toBe("Custom Sensor");
    expect(formatAlertTypeLabel(tEn, "VENDOR_ALERT")).toBe("Vendor Alert");
    expect(formatConfigStatusLabel(tEn, null)).toBe("Unknown");
  });
});
