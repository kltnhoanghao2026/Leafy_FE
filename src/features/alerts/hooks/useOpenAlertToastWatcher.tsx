import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n";
import { collectorApi } from "../../../lib/api/collectorApi";
import { ROUTES } from "../../../lib/routes";
import type { AlertEventItemResponse } from "../../../types/iot";
import { formatSeverityLabel } from "../../iot/utils/iotTranslation";
import { IOT_POLLING_INTERVALS } from "../../iot/utils/iotPolling";
import { hasRecentlyNotifiedAlert } from "../../notifications/utils/fcmNotifications";
import { alertKeys } from "../queries/keys";

const RECENT_OPEN_ALERT_PARAMS = {
  status: "OPEN",
  page: 0,
  size: 5,
  sortBy: "openedAt",
  sortDir: "desc",
} as const;

type OpenAlertToastWatcherOptions = {
  enabled?: boolean;
  intervalMs?: number;
};

export function getNewOpenAlerts(
  alerts: AlertEventItemResponse[],
  seenAlertIds: Set<string>,
  initialized: boolean,
) {
  if (!initialized) return [];
  return alerts.filter(
    (alert) => !seenAlertIds.has(alert.id) && !hasRecentlyNotifiedAlert(alert.id),
  );
}

function sortNewestFirst(alerts: AlertEventItemResponse[]) {
  return [...alerts].sort((left, right) => {
    const leftTime = left.openedAt ? Date.parse(left.openedAt) : 0;
    const rightTime = right.openedAt ? Date.parse(right.openedAt) : 0;
    return rightTime - leftTime;
  });
}

function alertRoute(alertId: string) {
  return `${ROUTES.DASHBOARD.ALERTS}?alertId=${encodeURIComponent(alertId)}`;
}

export function useOpenAlertToastWatcher({
  enabled = true,
  intervalMs = IOT_POLLING_INTERVALS.openAlertWatcher,
}: OpenAlertToastWatcherOptions = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const initializedRef = useRef(false);
  const seenAlertIdsRef = useRef<Set<string>>(new Set());

  const { data: alerts = [] } = useQuery({
    queryKey: alertKeys.recentOpenWatcher(),
    queryFn: async () => {
      const response = await collectorApi.getAlertEvents(RECENT_OPEN_ALERT_PARAMS);
      return response.data.items;
    },
    enabled,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!enabled) {
      initializedRef.current = false;
      seenAlertIdsRef.current = new Set();
      return;
    }

    const currentAlerts = sortNewestFirst(alerts);
    const currentIds = currentAlerts.map((alert) => alert.id);

    if (!initializedRef.current) {
      seenAlertIdsRef.current = new Set(currentIds);
      initializedRef.current = true;
      return;
    }

    const newAlerts = getNewOpenAlerts(
      currentAlerts,
      seenAlertIdsRef.current,
      initializedRef.current,
    );

    if (newAlerts.length === 0) {
      currentIds.forEach((id) => seenAlertIdsRef.current.add(id));
      return;
    }

    newAlerts.forEach((alert) => seenAlertIdsRef.current.add(alert.id));
    currentIds.forEach((id) => seenAlertIdsRef.current.add(id));

    queryClient.invalidateQueries({ queryKey: alertKeys.all() });

    if (newAlerts.length === 1) {
      const alert = newAlerts[0];
      const severity = formatSeverityLabel(t, alert.severity);
      const message = alert.message?.trim() || t("iot.alerts.messageFallback");

      toast(
        (toastItem) => (
          <button
            type="button"
            className="block max-w-sm text-left"
            onClick={() => {
              toast.dismiss(toastItem.id);
              navigate(alertRoute(alert.id));
            }}
          >
            <span className="block text-sm font-black text-slate-900">
              {t("iot.alerts.realtime.newAlertTitle")}
            </span>
            <span className="mt-1 block text-sm font-semibold text-slate-600">
              {severity} · {message}
            </span>
            <span className="mt-2 block text-xs font-black text-emerald-700">
              {t("iot.alerts.realtime.viewAlert")}
            </span>
          </button>
        ),
        {
          id: `iot-alert-${alert.id}`,
          duration: 8_000,
        },
      );
      return;
    }

    toast(
      (toastItem) => (
        <button
          type="button"
          className="block max-w-sm text-left"
          onClick={() => {
            toast.dismiss(toastItem.id);
            navigate(ROUTES.DASHBOARD.ALERTS);
          }}
        >
          <span className="block text-sm font-black text-slate-900">
            {t("iot.alerts.realtime.newAlertTitle")}
          </span>
          <span className="mt-1 block text-sm font-semibold text-slate-600">
            {t("iot.alerts.realtime.newAlertSummary")(newAlerts.length)}
          </span>
          <span className="mt-2 block text-xs font-black text-emerald-700">
            {t("iot.alerts.realtime.viewAlerts")}
          </span>
        </button>
      ),
      {
        id: "iot-alert-batch",
        duration: 8_000,
      },
    );
  }, [alerts, enabled, navigate, queryClient, t]);
}
