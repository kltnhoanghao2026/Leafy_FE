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

type TimeRange = "all" | "24h" | "7d" | "30d";

const severityOptions: AlertSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusOptions: AlertStatus[] = [
  "OPEN",
  "ACKNOWLEDGED",
  "RESOLVED",
  "CLOSED",
];

const timeRangeOptions: Array<{ value: TimeRange; label: string }> = [
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const severityClasses: Record<AlertSeverity, string> = {
  LOW: "bg-blue-50 text-blue-600 border-blue-100",
  MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-100",
  HIGH: "bg-orange-50 text-orange-700 border-orange-100",
  CRITICAL: "bg-red-50 text-red-600 border-red-100",
};

const statusClasses: Record<AlertStatus, string> = {
  OPEN: "bg-red-50 text-red-600 border-red-100",
  ACKNOWLEDGED: "bg-yellow-50 text-yellow-700 border-yellow-100",
  RESOLVED: "bg-green-50 text-green-700 border-green-100",
  CLOSED: "bg-slate-50 text-slate-600 border-slate-100",
};

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

  const isAcknowledging = (alertId: string) =>
    acknowledgeAlert.isPending && acknowledgeAlert.variables === alertId;

  const isResolving = (alertId: string) =>
    resolveAlert.isPending && resolveAlert.variables === alertId;

  const resolveDeviceLabel = (deviceId: string | null) => {
    if (!deviceId) return "No device";
    const device = deviceMap.get(deviceId);
    if (!device) return `Device ${compactId(deviceId)}`;
    return device.deviceName || device.deviceCode || compactId(deviceId);
  };

  const resolveZoneLabel = (zoneId: string | null) => {
    if (!zoneId) return "No zone";
    const zone = zoneMap.get(zoneId);
    return zone?.zoneName || `Zone ${compactId(zoneId)}`;
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Alert center
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
            Filter collector alert events by farm context, zone, device,
            severity, status, and time window.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void alertEventsQuery.refetch()}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Refresh
        </button>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Farm plot
            </span>
            <select
              aria-label="Farm plot"
              value={selectedFarmPlotId}
              onChange={(event) => {
                setSelectedFarmPlotId(event.target.value);
                setSelectedZoneId("");
                setSelectedDeviceId("");
                resetToFirstPage();
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              disabled={profileQuery.isLoading || plotsQuery.isLoading}
            >
              <option value="">
                {plotsQuery.isLoading ? "Loading farms..." : "All farm plots"}
              </option>
              {farmPlots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Farm plot narrows zone/device options only. Alert API does not
              support farmPlotId filtering directly.
            </p>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Zone
            </span>
            <select
              aria-label="Zone"
              value={selectedZoneId}
              onChange={(event) => {
                setSelectedZoneId(event.target.value);
                setSelectedDeviceId("");
                resetToFirstPage();
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              disabled={!selectedFarmPlotId || zonesQuery.isLoading}
            >
              <option value="">
                {!selectedFarmPlotId
                  ? "Select farm first"
                  : zonesQuery.isLoading
                    ? "Loading zones..."
                    : "All zones"}
              </option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.zoneName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Device
            </span>
            <select
              aria-label="Device"
              value={effectiveSelectedDeviceId}
              onChange={(event) => {
                setSelectedDeviceId(event.target.value);
                resetToFirstPage();
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              disabled={devicesQuery.isLoading}
            >
              <option value="">
                {devicesQuery.isLoading ? "Loading devices..." : "All devices"}
              </option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.deviceName || device.deviceCode || compactId(device.id)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Time range
            </span>
            <select
              aria-label="Time range"
              value={selectedTimeRange}
              onChange={(event) => {
                setSelectedTimeRange(event.target.value as TimeRange);
                resetToFirstPage();
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Severity
            </span>
            <select
              aria-label="Severity"
              value={severity}
              onChange={(event) => {
                setSeverity(event.target.value as AlertSeverity | "");
                resetToFirstPage();
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
            >
              <option value="">All severities</option>
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Status
            </span>
            <select
              aria-label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AlertStatus | "");
                resetToFirstPage();
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Page size
            </span>
            <select
              aria-label="Page size"
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value));
                resetToFirstPage();
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
            >
              {[10, 20, 50].map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {alertEventsQuery.isLoading ? (
        <div
          aria-label="Loading alert events"
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
                Alert events could not be loaded
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                The collector returned an error for the current filters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void alertEventsQuery.refetch()}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Retry
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
            Alert lifecycle action failed
          </h3>
          <p className="mt-1 text-sm font-semibold text-red-600">
            The collector could not update this alert. Check the alert status
            and try again.
          </p>
        </div>
      ) : null}

      {pagedAlerts && !alertEventsQuery.isError ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div>
              <p className="text-sm font-black text-slate-800">
                {formatNumber(pagedAlerts.totalItems)} alert events
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Page {formatNumber(pagedAlerts.page + 1)} of{" "}
                {formatNumber(Math.max(pagedAlerts.totalPages, 1))}
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
                No alert events
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                The backend returned an empty page for these filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left" aria-label="Alert events">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Alert
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Severity
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Scope
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Opened
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Actions
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
                            {alert.message}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {alert.alertType || "Alert"} - value{" "}
                            {formatNumber(alert.triggerValue)}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                              severityClasses[alert.severity]
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                              statusClasses[alert.status]
                            }`}
                          >
                            {alert.status}
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
                                ? "Acknowledging..."
                                : "Acknowledge"}
                            </button>
                            <button
                              type="button"
                              onClick={() => resolveAlert.mutate(alert.id)}
                              disabled={!canResolve || actionPending}
                              className="rounded-full bg-[#245A34] px-3 py-2 text-xs font-black text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Resolve alert ${compactId(alert.id)}`}
                            >
                              {resolvePending ? "Resolving..." : "Resolve"}
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
