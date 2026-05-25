import { describe, expect, it, beforeEach } from "vitest";
import {
  hasRecentlyNotifiedAlert,
  markAlertRecentlyNotified,
  parseIotAlertFcmPayload,
  resetRecentlyNotifiedAlertsForTest,
  sanitizeNotificationUrl,
} from "./fcmNotifications";

describe("fcmNotifications", () => {
  beforeEach(() => {
    resetRecentlyNotifiedAlertsForTest();
  });

  it("parses an IoT alert FCM payload with a safe alert URL", () => {
    const parsed = parseIotAlertFcmPayload({
      data: {
        type: "IOT_ALERT",
        alertEventId: "alert-1",
        referenceId: "alert-1",
        url: "/dashboard/alerts?alertId=alert-1",
        severity: "CRITICAL",
      },
      notification: {
        title: "IoT alert",
        body: "AIR_TEMP exceeded max threshold",
      },
    } as unknown as Parameters<typeof parseIotAlertFcmPayload>[0]);

    expect(parsed).toEqual({
      alertEventId: "alert-1",
      url: "/dashboard/alerts?alertId=alert-1",
      title: "IoT alert",
      body: "AIR_TEMP exceeded max threshold",
      severity: "CRITICAL",
    });
  });

  it("falls back to an alert deep link when URL is missing", () => {
    const parsed = parseIotAlertFcmPayload({
      data: {
        type: "IOT_ALERT",
        referenceId: "alert-2",
      },
    } as unknown as Parameters<typeof parseIotAlertFcmPayload>[0]);

    expect(parsed?.url).toBe("/dashboard/alerts?alertId=alert-2");
  });

  it("rejects external notification URLs", () => {
    expect(sanitizeNotificationUrl("https://example.com/phish")).toBe("/dashboard/alerts");
  });

  it("tracks recently notified alert ids for foreground/polling dedupe", () => {
    expect(hasRecentlyNotifiedAlert("alert-3")).toBe(false);
    markAlertRecentlyNotified("alert-3");
    expect(hasRecentlyNotifiedAlert("alert-3")).toBe(true);
  });
});
