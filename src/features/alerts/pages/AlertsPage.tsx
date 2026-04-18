import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
  useAcknowledgeAlert,
  useAlertEvents,
  useResolveAlert,
} from "../queries";
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

const severityOptions: AlertSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusOptions: AlertStatus[] = [
  "OPEN",
  "ACKNOWLEDGED",
  "RESOLVED",
  "CLOSED",
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

export function AlertsPage() {
  const [severity, setSeverity] = useState<AlertSeverity | "">("");
  const [status, setStatus] = useState<AlertStatus | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const params = useMemo<AlertEventsParams>(
    () => ({
      severity: severity || undefined,
      status: status || undefined,
      page,
      size,
      sortBy: "openedAt",
      sortDir: "desc",
    }),
    [page, severity, size, status],
  );

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

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Alert center
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
            Collector alert events with severity, status, pagination, and
            backend lifecycle actions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-100 rounded-3xl p-3 shadow-sm">
          <label className="sr-only" htmlFor="severityFilter">
            Severity
          </label>
          <select
            id="severityFilter"
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value as AlertSeverity | "");
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          >
            <option value="">All severities</option>
            {severityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="statusFilter">
            Status
          </label>
          <select
            id="statusFilter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AlertStatus | "");
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="pageSize">
            Page size
          </label>
          <select
            id="pageSize"
            value={size}
            onChange={(event) => {
              setSize(Number(event.target.value));
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          >
            {[10, 20, 50].map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        </div>
      </div>

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
                            Device {compactId(alert.deviceId)}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Zone {compactId(alert.zoneId)}
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
