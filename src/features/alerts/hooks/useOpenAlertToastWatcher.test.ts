import { describe, expect, it } from "vitest";
import type { AlertEventItemResponse } from "../../../types/iot";
import { getNewOpenAlerts } from "./useOpenAlertToastWatcher";

const makeAlert = (id: string): AlertEventItemResponse => ({
  id,
  deviceId: "device-1",
  zoneId: "zone-1",
  sensorTypeId: "sensor-1",
  alertRuleId: "rule-1",
  alertType: "THRESHOLD_EXCEEDED",
  message: "Temperature exceeded threshold",
  severity: "HIGH",
  status: "OPEN",
  triggerValue: 35,
  thresholdMin: null,
  thresholdMax: 30,
  openedAt: "2026-05-25T10:00:00Z",
  acknowledgedAt: null,
  resolvedAt: null,
  pushSent: null,
});

describe("open alert toast watcher helpers", () => {
  it("does not report existing alerts during the initial watcher snapshot", () => {
    expect(getNewOpenAlerts([makeAlert("alert-1")], new Set(), false)).toEqual([]);
  });

  it("detects unseen alerts after initialization", () => {
    const seen = new Set(["alert-1"]);

    expect(getNewOpenAlerts([makeAlert("alert-2"), makeAlert("alert-1")], seen, true))
      .toEqual([makeAlert("alert-2")]);
  });

  it("ignores alerts that have already been seen", () => {
    const seen = new Set(["alert-1", "alert-2"]);

    expect(getNewOpenAlerts([makeAlert("alert-2"), makeAlert("alert-1")], seen, true))
      .toEqual([]);
  });
});
