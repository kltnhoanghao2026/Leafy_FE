import { describe, expect, it } from "vitest";
import type { TFunction } from "../../../i18n/context";
import { en } from "../../../i18n/locales/en";
import { vi } from "../../../i18n/locales/vi";
import type { TranslationDict } from "../../../i18n/types";
import {
  formatAlertStatusLabel,
  formatAlertTypeLabel,
  formatCameraQualityLabel,
  formatCameraResolutionLabel,
  formatCameraTriggerLabel,
  formatConfigStatusLabel,
  formatDeviceStatusLabel,
  formatDeviceTypeLabel,
  formatMediaAnalysisStatusLabel,
  formatSensorLabel,
  formatSeverityLabel,
} from "./iotTranslation";
import { formatEndpointDisplay, formatMediaAnalysisDisplay, withMediaDisplay } from "./iotDisplay";

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
    expect(formatDeviceStatusLabel(tEn, "RETIRED")).toBe("Retired");
    expect(formatDeviceTypeLabel(tEn, "ESP32_CAM_SENSOR")).toBe("ESP32 camera sensor");
    expect(formatConfigStatusLabel(tEn, "ACKED")).toBe("Acknowledged by device");
    expect(formatMediaAnalysisStatusLabel(tEn, "PROCESSING")).toBe("Analysis in progress");
    expect(formatCameraResolutionLabel(tEn, "HD")).toBe("High definition");
    expect(formatCameraQualityLabel(tVi, "MEDIUM")).toBe("Trung bình");
    expect(formatCameraTriggerLabel(tEn, "SCHEDULED")).toBe("Scheduled capture");
  });

  it("falls back safely for unknown backend values", () => {
    expect(formatSensorLabel(tEn, "CUSTOM_SENSOR")).toBe("Custom Sensor");
    expect(formatAlertTypeLabel(tEn, "VENDOR_ALERT")).toBe("Vendor Alert");
    expect(formatConfigStatusLabel(tEn, null)).toBe("Unknown");
  });

  it("builds display-safe media and analysis labels", () => {
    const media = withMediaDisplay(tEn, {
      id: "media-1",
      requestId: "request-raw-identifier-123456",
      deviceId: "device-1",
      zoneId: "zone-1",
      fileId: null,
      mediaType: "IMAGE",
      triggerType: "SCHEDULED",
      status: "COMMAND_SENT",
      contentType: null,
      sizeBytes: null,
      width: null,
      height: null,
      error: null,
      requestedAt: "2026-05-19T08:29:00Z",
      commandSentAt: "2026-05-19T08:29:01Z",
      uploadedAt: null,
      capturedAt: null,
    });

    expect(media.display.status).toBe("Command sent");
    expect(media.display.fallbackMessage).toBe("Waiting for upload");
    expect(media.display.fallbackMessage).not.toContain("request-raw");
    expect(media.display.technicalRequestId).toBe("request-...3456");
    expect(formatEndpointDisplay("http://file-service/files/upload", tEn)).toBe("Default upload");
  });

  it("summarizes disease analysis without raw backend status", () => {
    const display = formatMediaAnalysisDisplay(tEn, {
      id: "analysis-1",
      mediaEventId: "media-1",
      alertEventId: "alert-1",
      fileId: "file-1",
      deviceUid: "device-uid",
      requestId: null,
      triggerType: "SCHEDULED",
      status: "DISEASE_DETECTED",
      diseaseDetected: true,
      severity: "HIGH",
      diseaseType: "coffee-rust",
      diseaseName: "Coffee rust",
      confidence: 0.86,
      notes: null,
      fileUrl: null,
      capturedAt: null,
      analyzedAt: "2026-05-19T08:31:00Z",
      error: null,
    });

    expect(display.status).toBe("Disease detected");
    expect(display.summary).toBe("Coffee rust - High");
    expect(display.alertBadge).toBe("Alert created");
    expect(display.confidence).toBe("86%");
  });
});
