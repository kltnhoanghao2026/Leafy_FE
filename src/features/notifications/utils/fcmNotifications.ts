import type { MessagePayload } from "firebase/messaging";
import { ROUTES } from "../../../lib/routes";

const notifiedAlertIds = new Set<string>();

export type IotAlertFcmPayload = {
  alertEventId: string;
  url: string;
  title: string;
  body?: string;
  severity?: string;
};

export function sanitizeNotificationUrl(rawUrl?: string | null) {
  if (!rawUrl || rawUrl.trim() === "") {
    return ROUTES.DASHBOARD.ALERTS;
  }

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return ROUTES.DASHBOARD.ALERTS;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return ROUTES.DASHBOARD.ALERTS;
  }
}

export function parseIotAlertFcmPayload(payload: MessagePayload): IotAlertFcmPayload | null {
  const data = payload.data ?? {};
  const type = data.type ?? data.notificationType;
  const alertEventId = data.alertEventId ?? data.referenceId;

  if (type !== "IOT_ALERT" || !alertEventId) {
    return null;
  }

  return {
    alertEventId,
    url: sanitizeNotificationUrl(data.url ?? `${ROUTES.DASHBOARD.ALERTS}?alertId=${encodeURIComponent(alertEventId)}`),
    title: payload.notification?.title ?? data.title ?? "Cảnh báo IoT",
    body: payload.notification?.body ?? data.message,
    severity: data.severity,
  };
}

export function hasRecentlyNotifiedAlert(alertEventId: string) {
  return notifiedAlertIds.has(alertEventId);
}

export function markAlertRecentlyNotified(alertEventId: string) {
  notifiedAlertIds.add(alertEventId);
}

export function resetRecentlyNotifiedAlertsForTest() {
  notifiedAlertIds.clear();
}
