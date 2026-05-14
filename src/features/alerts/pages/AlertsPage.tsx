import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  useAcknowledgeAlert,
  useAlertEvents,
  useResolveAlert,
} from "../queries";
import { useAlertScopeOptions } from "../hooks/useAlertScopeOptions";
import type {
  AlertEventsParams,
  AlertSeverity,
  AlertStatus,
} from "../../../types/iot";
import {
  compactId,
  formatDateTime,
  formatNumber,
} from "../../metrics-view/utils/format";
import { Select } from "../../../components/ui/Select";
import { useTranslation } from "../../../i18n";
import {
  formatAlertStatusLabel,
  formatAlertTypeLabel,
  formatSeverityLabel,
} from "../../iot/utils/iotTranslation";
import {
  alertSeverityClasses,
  alertStatusClasses,
} from "../utils/alertLabels";

type TimeRange = "all" | "24h" | "7d" | "30d";

const severityOptions: AlertSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusOptions: AlertStatus[] = [
  "OPEN",
  "ACKNOWLEDGED",
  "RESOLVED",
  "CLOSED",
];

const timeRangeToIsoWindow = (range: TimeRange) => {
  if (range === "all") {
    return {};
  }

  const now = new Date();
  const from = new Date(now);
  const daysByRange: Record<Exclude<TimeRange, "all" | "24h">, number> = {
    "7d": 7,
    "30d": 30,
  };

  if (range === "24h") {
    from.setHours(from.getHours() - 24);
  } else {
    from.setDate(from.getDate() - daysByRange[range]);
  }

  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
};

export function AlertsPage() {
  const { t } = useTranslation();
  const [selectedFarmPlotId, setSelectedFarmPlotId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>("all");
  const [severity, setSeverity] = useState<AlertSeverity | "">("");
  const [status, setStatus] = useState<AlertStatus | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const {
    profileQuery,
    plotsQuery,
    zonesQuery,
    devicesQuery,
    farmPlots,
    zones,
    devices,
    zoneMap,
    deviceMap,
  } = useAlertScopeOptions({
    farmPlotId: selectedFarmPlotId,
    zoneId: selectedZoneId,
  });
  const effectiveSelectedDeviceId =
    devices.length > 0 &&
    selectedDeviceId &&
    !devices.some((device) => device.id === selectedDeviceId)
      ? ""
      : selectedDeviceId;

  const params = useMemo<AlertEventsParams>(() => {
    const timeWindow = timeRangeToIsoWindow(selectedTimeRange);

    return {
      severity: severity || undefined,
      status: status || undefined,
      zoneId: selectedZoneId || undefined,
      deviceId: effectiveSelectedDeviceId || undefined,
      ...timeWindow,
      page,
      size,
      sortBy: "openedAt",
      sortDir: "desc",
    };
  }, [
    page,
    effectiveSelectedDeviceId,
    selectedTimeRange,
    selectedZoneId,
    severity,
    size,
    status,
  ]);

  const alertEventsQuery = useAlertEvents(params);
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const pagedAlerts = alertEventsQuery.data;
  const alerts = pagedAlerts?.items ?? [];

  const resetToFirstPage = () => setPage(0);
  const lifecycleActionError =
    acknowledgeAlert.isError || resolveAlert.isError;

  const timeRangeOptions: Array<{ value: TimeRange; label: string }> = [
    { value: "24h", label: t("iot.alerts.timeRanges.last24h") },
    { value: "7d", label: t("iot.alerts.timeRanges.last7d") },
    { value: "30d", label: t("iot.alerts.timeRanges.last30d") },
    { value: "all", label: t("iot.alerts.timeRanges.all") },
  ];

  const isAcknowledging = (alertId: string) =>
    acknowledgeAlert.isPending && acknowledgeAlert.variables === alertId;

  const isResolving = (alertId: string) =>
    resolveAlert.isPending && resolveAlert.variables === alertId;

  const resolveDeviceLabel = (deviceId: string | null) => {
    if (!deviceId) return t("iot.alerts.scope.noDevice");
    const device = deviceMap.get(deviceId);
    if (!device) return t("iot.alerts.scope.missingDevice");
    return device.deviceName || device.deviceCode || t("iot.alerts.scope.unnamedDevice");
  };

  const resolveZoneLabel = (zoneId: string | null) => {
    if (!zoneId) return t("iot.alerts.scope.noZone");
    const zone = zoneMap.get(zoneId);
    return zone?.zoneName || t("iot.alerts.scope.missingZone");
  };

  const readableAlertValue = (alert: {
    triggerValue: number | null;
    thresholdMin: number | null;
    thresholdMax: number | null;
  }) => {
    const value =
      alert.triggerValue === null || alert.triggerValue === undefined
        ? t("iot.alerts.value.noReading")
        : t("iot.alerts.value.measured")(formatNumber(alert.triggerValue));

    if (alert.thresholdMin !== null && alert.thresholdMax !== null) {
      return `${value}; ${t("iot.alerts.value.safeRange")(
        formatNumber(alert.thresholdMin),
        formatNumber(alert.thresholdMax),
      )}`;
    }

    if (alert.thresholdMax !== null && alert.thresholdMax !== undefined) {
      return `${value}; ${t("iot.alerts.value.maxThreshold")(
        formatNumber(alert.thresholdMax),
      )}`;
    }

    if (alert.thresholdMin !== null && alert.thresholdMin !== undefined) {
      return `${value}; ${t("iot.alerts.value.minThreshold")(
        formatNumber(alert.thresholdMin),
      )}`;
    }

    return value;
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
            {t("iot.alerts.title")}
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
            {t("iot.alerts.description")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void alertEventsQuery.refetch()}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {t("iot.common.refresh")}
        </button>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("iot.alerts.filters.farmPlot")}
            </span>
            <Select
              ariaLabel="Farm plot"
              value={selectedFarmPlotId}
              onChange={(value) => {
                setSelectedFarmPlotId(String(value));
                setSelectedZoneId("");
                setSelectedDeviceId("");
                resetToFirstPage();
              }}
              options={[
                {
                  value: "",
                  label: plotsQuery.isLoading
                    ? t("iot.alerts.filters.loadingFarmPlots")
                    : t("iot.alerts.filters.allFarmPlots"),
                },
                ...farmPlots.map((plot) => ({ value: plot.id, label: plot.name })),
              ]}
              className="mt-2"
              disabled={profileQuery.isLoading || plotsQuery.isLoading}
            />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {t("iot.alerts.filters.farmHint")}
            </p>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("iot.alerts.filters.zone")}
            </span>
            <Select
              ariaLabel="Zone"
              value={selectedZoneId}
              onChange={(value) => {
                setSelectedZoneId(String(value));
                setSelectedDeviceId("");
                resetToFirstPage();
              }}
              options={[
                {
                  value: "",
                  label: !selectedFarmPlotId
                    ? t("iot.alerts.filters.selectFarmFirst")
                    : zonesQuery.isLoading
                      ? t("iot.alerts.filters.loadingZones")
                      : t("iot.alerts.filters.allZones"),
                },
                ...zones.map((zone) => ({ value: zone.id, label: zone.zoneName })),
              ]}
              className="mt-2"
              disabled={!selectedFarmPlotId || zonesQuery.isLoading}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("iot.alerts.filters.device")}
            </span>
            <Select
              ariaLabel="Device"
              value={effectiveSelectedDeviceId}
              onChange={(value) => {
                setSelectedDeviceId(String(value));
                resetToFirstPage();
              }}
              options={[
                {
                  value: "",
                  label: devicesQuery.isLoading
                    ? t("iot.alerts.filters.loadingDevices")
                    : t("iot.alerts.filters.allDevices"),
                },
                ...devices.map((device) => ({
                  value: device.id,
                  label: device.deviceName || device.deviceCode || t("iot.alerts.scope.unnamedDevice"),
                })),
              ]}
              className="mt-2"
              disabled={devicesQuery.isLoading}
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("iot.alerts.filters.timeRange")}
            </span>
            <Select
              ariaLabel="Time range"
              value={selectedTimeRange}
              onChange={(value) => {
                setSelectedTimeRange(value as TimeRange);
                resetToFirstPage();
              }}
              options={timeRangeOptions}
              className="mt-2"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("iot.alerts.filters.severity")}
            </span>
            <Select
              ariaLabel="Severity"
              value={severity}
              onChange={(value) => {
                setSeverity(value as AlertSeverity | "");
                resetToFirstPage();
              }}
              options={[
                { value: "", label: t("iot.alerts.filters.allSeverities") },
                ...severityOptions.map((option) => ({
                  value: option,
                  label: formatSeverityLabel(t, option),
                })),
              ]}
              className="mt-2"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("iot.alerts.filters.status")}
            </span>
            <Select
              ariaLabel="Status"
              value={status}
              onChange={(value) => {
                setStatus(value as AlertStatus | "");
                resetToFirstPage();
              }}
              options={[
                { value: "", label: t("iot.alerts.filters.allStatuses") },
                ...statusOptions.map((option) => ({
                  value: option,
                  label: formatAlertStatusLabel(t, option),
                })),
              ]}
              className="mt-2"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("iot.alerts.filters.pageSize")}
            </span>
            <Select
              ariaLabel="Page size"
              value={size}
              onChange={(value) => {
                setSize(Number(value));
                resetToFirstPage();
              }}
              options={[10, 20, 50].map((option) => ({
                value: option,
                label: `${option} / page`,
              }))}
              className="mt-2"
            />
          </label>
        </div>
      </section>

      {alertEventsQuery.isLoading ? (
        <div
          aria-label={t("iot.alerts.states.loading")}
          className="rounded-[2rem] bg-white border border-slate-100 p-5 shadow-sm"
        >
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 rounded-2xl bg-slate-100 animate-pulse mb-3 last:mb-0"
            />
          ))}
        </div>
      ) : null}

      {alertEventsQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-red-700">
                {t("iot.alerts.states.error")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                {t("iot.alerts.states.errorDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void alertEventsQuery.refetch()}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {t("iot.common.retry")}
            </button>
          </div>
        </div>
      ) : null}

      {lifecycleActionError ? (
        <div
          role="alert"
          className="rounded-[2rem] border border-red-100 bg-red-50 p-5 shadow-sm"
        >
          <h3 className="text-base font-black text-red-700">
            {t("iot.alerts.states.mutationError")}
          </h3>
          <p className="mt-1 text-sm font-semibold text-red-600">
            {t("iot.alerts.states.mutationErrorDescription")}
          </p>
        </div>
      ) : null}

      {pagedAlerts && !alertEventsQuery.isError ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div>
              <p className="text-sm font-black text-slate-800">
                {t("iot.alerts.count")(pagedAlerts.totalItems)}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {t("iot.alerts.page")(
                  pagedAlerts.page + 1,
                  Math.max(pagedAlerts.totalPages, 1),
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={!pagedAlerts.hasPrevious}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!pagedAlerts.hasNext}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="p-10 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-4 text-lg font-black text-slate-800">
                {t("iot.alerts.states.empty")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {t("iot.alerts.states.emptyDescription")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left" aria-label="Alert events">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alerts.table.alert")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alerts.table.severity")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alerts.table.status")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alerts.table.scope")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alerts.table.openedAt")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alerts.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alerts.map((alert) => {
                    const canAcknowledge = alert.status === "OPEN";
                    const canResolve =
                      alert.status === "OPEN" ||
                      alert.status === "ACKNOWLEDGED";
                    const acknowledgePending = isAcknowledging(alert.id);
                    const resolvePending = isResolving(alert.id);
                    const actionPending = acknowledgePending || resolvePending;

                    return (
                      <tr key={alert.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-black text-slate-800">
                            {formatAlertTypeLabel(t, alert.alertType)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {alert.message}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {readableAlertValue(alert)}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                              alertSeverityClasses[alert.severity]
                            }`}
                          >
                            {formatSeverityLabel(t, alert.severity)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                              alertStatusClasses[alert.status]
                            }`}
                          >
                            {formatAlertStatusLabel(t, alert.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-xs font-bold text-slate-600">
                            {resolveDeviceLabel(alert.deviceId)}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {resolveZoneLabel(alert.zoneId)}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top text-sm font-bold text-slate-600">
                          {formatDateTime(alert.openedAt)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => acknowledgeAlert.mutate(alert.id)}
                              disabled={!canAcknowledge || actionPending}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Acknowledge alert ${compactId(
                                alert.id,
                              )}`}
                            >
                              {acknowledgePending
                                ? t("iot.alerts.actions.acknowledging")
                                : t("iot.alerts.actions.acknowledge")}
                            </button>
                            <button
                              type="button"
                              onClick={() => resolveAlert.mutate(alert.id)}
                              disabled={!canResolve || actionPending}
                              className="rounded-full bg-[#245A34] px-3 py-2 text-xs font-black text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Resolve alert ${compactId(alert.id)}`}
                            >
                              {resolvePending
                                ? t("iot.alerts.actions.resolving")
                                : t("iot.alerts.actions.resolve")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default AlertsPage;
