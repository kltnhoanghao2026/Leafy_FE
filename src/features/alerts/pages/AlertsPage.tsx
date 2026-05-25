import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  alertKeys,
  useAcknowledgeAlert,
  useAlertEvents,
  useResolveAlert,
} from "../queries";
import { useAlertScopeOptions } from "../hooks/useAlertScopeOptions";
import type {
  AlertEventItemResponse,
  AlertEventsParams,
  AlertSeverity,
  AlertStatus,
} from "../../../types/iot";
import { formatDateTime } from "../../metrics-view/utils/format";
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
import { collectorApi } from "../../../lib/api/collectorApi";
import { AlertMessageSummary } from "../components/AlertMessageSummary";

type TimeRange = "all" | "24h" | "7d" | "30d";
type BulkAction = "acknowledge" | "resolve";
type BulkMessageTone = "success" | "warning";

const severityOptions: AlertSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusOptions: AlertStatus[] = [
  "OPEN",
  "ACKNOWLEDGED",
  "RESOLVED",
  "CLOSED",
];

const canAcknowledgeAlert = (alert: AlertEventItemResponse) =>
  alert.status === "OPEN";

const canResolveAlert = (alert: AlertEventItemResponse) =>
  alert.status === "OPEN" || alert.status === "ACKNOWLEDGED";

const parseAlertStatusParam = (value: string | null): AlertStatus | "" =>
  statusOptions.includes(value as AlertStatus) ? (value as AlertStatus) : "";

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
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedAlertId = searchParams.get("alertId");
  const focusedStatus = parseAlertStatusParam(searchParams.get("status"));
  const lastScrolledAlertIdRef = useRef<string | null>(null);
  const [selectedFarmPlotId, setSelectedFarmPlotId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>("all");
  const [severity, setSeverity] = useState<AlertSeverity | "">("");
  const [status, setStatus] = useState<AlertStatus | "">(focusedStatus);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkMessage, setBulkMessage] = useState<{
    tone: BulkMessageTone;
    text: string;
  } | null>(null);

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
  const focusedAlertOnPage = useMemo(
    () =>
      focusedAlertId
        ? alerts.find((alert) => alert.id === focusedAlertId)
        : undefined,
    [alerts, focusedAlertId],
  );
  const focusedAlertMissing =
    Boolean(focusedAlertId) &&
    Boolean(pagedAlerts) &&
    !alertEventsQuery.isFetching &&
    !alertEventsQuery.isError &&
    !focusedAlertOnPage;
  const selectedAlerts = useMemo(
    () => alerts.filter((alert) => selectedAlertIds.has(alert.id)),
    [alerts, selectedAlertIds],
  );
  const selectedCount = selectedAlertIds.size;
  const acknowledgeEligibleAlerts = selectedAlerts.filter(canAcknowledgeAlert);
  const resolveEligibleAlerts = selectedAlerts.filter(canResolveAlert);
  const currentPageAlertIds = useMemo(
    () => alerts.map((alert) => alert.id),
    [alerts],
  );
  const allCurrentPageSelected =
    currentPageAlertIds.length > 0 &&
    currentPageAlertIds.every((id) => selectedAlertIds.has(id));
  const someCurrentPageSelected = currentPageAlertIds.some((id) =>
    selectedAlertIds.has(id),
  );

  const resetToFirstPage = () => setPage(0);
  const lifecycleActionError =
    acknowledgeAlert.isError || resolveAlert.isError;
  const isBulkRunning = bulkAction !== null;

  useEffect(() => {
    setSelectedAlertIds(new Set());
    setBulkMessage(null);
  }, [
    effectiveSelectedDeviceId,
    page,
    selectedFarmPlotId,
    selectedTimeRange,
    selectedZoneId,
    severity,
    size,
    status,
  ]);

  useEffect(() => {
    if (!focusedAlertId || !focusedAlertOnPage) {
      return;
    }

    if (lastScrolledAlertIdRef.current === focusedAlertId) {
      return;
    }

    const element = document.getElementById(`alert-event-${focusedAlertId}`);
    if (typeof element?.scrollIntoView === "function") {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus({ preventScroll: true });
      lastScrolledAlertIdRef.current = focusedAlertId;
    }
  }, [focusedAlertId, focusedAlertOnPage]);

  const clearFocusedAlert = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("alertId");
    setSearchParams(next, { replace: true });
    lastScrolledAlertIdRef.current = null;
  };

  const showAllAlertsForFocus = () => {
    setSelectedFarmPlotId("");
    setSelectedZoneId("");
    setSelectedDeviceId("");
    setSelectedTimeRange("all");
    setSeverity("");
    setStatus("");
    setPage(0);
  };

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

  const clearSelection = () => {
    setSelectedAlertIds(new Set());
    setBulkMessage(null);
  };

  const toggleAlertSelection = (alertId: string) => {
    setSelectedAlertIds((previous) => {
      const next = new Set(previous);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
    setBulkMessage(null);
  };

  const toggleSelectAllCurrentPage = () => {
    setSelectedAlertIds((previous) => {
      const next = new Set(previous);

      if (allCurrentPageSelected) {
        currentPageAlertIds.forEach((id) => next.delete(id));
      } else {
        currentPageAlertIds.forEach((id) => next.add(id));
      }

      return next;
    });
    setBulkMessage(null);
  };

  const runBulkAction = async (action: BulkAction, ids: string[]) => {
    if (ids.length === 0) {
      setBulkMessage({
        tone: "warning",
        text:
          action === "acknowledge"
            ? t("iot.alerts.bulk.noEligibleAck")
            : t("iot.alerts.bulk.noEligibleResolve"),
      });
      return;
    }

    setBulkAction(action);
    setBulkMessage(null);

    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          action === "acknowledge"
            ? collectorApi.acknowledgeAlert(id)
            : collectorApi.resolveAlert(id),
        ),
      );
      const failedIds = ids.filter(
        (_id, index) => results[index]?.status === "rejected",
      );
      const successCount = ids.length - failedIds.length;
      const failedCount = failedIds.length;

      setBulkMessage({
        tone: failedCount > 0 ? "warning" : "success",
        text:
          action === "acknowledge"
            ? failedCount > 0
              ? t("iot.alerts.bulk.partialAck")(successCount, ids.length, failedCount)
              : t("iot.alerts.bulk.ackSuccess")(successCount)
            : failedCount > 0
              ? t("iot.alerts.bulk.partialResolve")(successCount, ids.length, failedCount)
              : t("iot.alerts.bulk.resolveSuccess")(successCount),
      });
      setSelectedAlertIds(new Set(failedIds));

      await queryClient.invalidateQueries({ queryKey: alertKeys.all() });
    } finally {
      setBulkAction(null);
    }
  };

  const handleBulkAcknowledge = () =>
    void runBulkAction(
      "acknowledge",
      acknowledgeEligibleAlerts.map((alert) => alert.id),
    );

  const handleBulkResolve = () =>
    void runBulkAction(
      "resolve",
      resolveEligibleAlerts.map((alert) => alert.id),
    );

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
              ariaLabel={t("iot.alerts.aria.farmPlot")}
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
              ariaLabel={t("iot.alerts.aria.zone")}
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
              ariaLabel={t("iot.alerts.aria.device")}
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
              ariaLabel={t("iot.alerts.aria.timeRange")}
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
              ariaLabel={t("iot.alerts.aria.severity")}
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
              ariaLabel={t("iot.alerts.aria.status")}
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
              ariaLabel={t("iot.alerts.aria.pageSize")}
              value={size}
              onChange={(value) => {
                setSize(Number(value));
                resetToFirstPage();
              }}
              options={[10, 20, 50].map((option) => ({
                value: option,
                label: `${option} / ${t("iot.alerts.filters.pageSize")}`,
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

      {focusedAlertOnPage ? (
        <div
          role="status"
          className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("iot.alerts.focus.highlighted")}</span>
            <button
              type="button"
              onClick={clearFocusedAlert}
              className="w-fit rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
            >
              {t("iot.alerts.focus.clear")}
            </button>
          </div>
        </div>
      ) : null}

      {focusedAlertMissing ? (
        <div
          role="status"
          className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 text-sm font-bold text-amber-800 shadow-sm"
        >
          <p>{t("iot.alerts.focus.notFound")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={showAllAlertsForFocus}
              className="rounded-full bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700"
            >
              {t("iot.alerts.focus.showAll")}
            </button>
            <button
              type="button"
              onClick={clearFocusedAlert}
              className="rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-black text-amber-700 hover:bg-amber-50"
            >
              {t("iot.alerts.focus.clear")}
            </button>
          </div>
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
                aria-label={t("iot.alerts.aria.previousPage")}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!pagedAlerts.hasNext}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t("iot.alerts.aria.nextPage")}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </div>

          {selectedCount > 0 ? (
            <div className="border-b border-slate-100 bg-[#F8FBF8] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black text-[#1f4d2d]">
                    {t("iot.alerts.bulk.selected")(selectedCount)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {[
                      t("iot.alerts.bulk.canAcknowledge")(
                        acknowledgeEligibleAlerts.length,
                      ),
                      t("iot.alerts.bulk.canResolve")(
                        resolveEligibleAlerts.length,
                      ),
                    ].join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleBulkAcknowledge}
                    disabled={
                      isBulkRunning || acknowledgeEligibleAlerts.length === 0
                    }
                    className="rounded-full border border-[#245A34]/20 bg-white px-4 py-2 text-xs font-black text-[#245A34] hover:bg-[#EEF6EF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bulkAction === "acknowledge"
                      ? t("iot.alerts.bulk.acknowledgePending")
                      : t("iot.alerts.bulk.acknowledge")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkResolve}
                    disabled={isBulkRunning || resolveEligibleAlerts.length === 0}
                    className="rounded-full bg-[#245A34] px-4 py-2 text-xs font-black text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bulkAction === "resolve"
                      ? t("iot.alerts.bulk.resolvePending")
                      : t("iot.alerts.bulk.resolve")}
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={isBulkRunning}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("iot.alerts.bulk.clear")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {bulkMessage ? (
            <div
              role="alert"
              className={`border-b p-4 text-sm font-bold ${
                bulkMessage.tone === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-amber-100 bg-amber-50 text-amber-700"
              }`}
            >
              {bulkMessage.text}
            </div>
          ) : null}

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
              <table className="min-w-full text-left" aria-label={t("iot.alerts.table.aria")}>
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-12 px-5 py-3">
                      <input
                        type="checkbox"
                        aria-label={t("iot.alerts.bulk.selectAllPage")}
                        checked={allCurrentPageSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate =
                              someCurrentPageSelected &&
                              !allCurrentPageSelected;
                          }
                        }}
                        onChange={toggleSelectAllCurrentPage}
                        disabled={currentPageAlertIds.length === 0 || isBulkRunning}
                        className="h-4 w-4 rounded border-slate-300 text-[#245A34] focus:ring-[#245A34]"
                      />
                    </th>
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
                    const canAcknowledge = canAcknowledgeAlert(alert);
                    const canResolve = canResolveAlert(alert);
                    const acknowledgePending = isAcknowledging(alert.id);
                    const resolvePending = isResolving(alert.id);
                    const actionPending = acknowledgePending || resolvePending;
                    const alertTypeLabel =
                      alert.display?.type ?? formatAlertTypeLabel(t, alert.alertType);
                    const openedAtLabel =
                      alert.display?.openedAt ?? formatDateTime(alert.openedAt);

                    return (
                      <tr
                        key={alert.id}
                        id={`alert-event-${alert.id}`}
                        tabIndex={focusedAlertId === alert.id ? -1 : undefined}
                        data-focused={focusedAlertId === alert.id ? "true" : undefined}
                        data-testid={focusedAlertId === alert.id ? "focused-alert-row" : undefined}
                        className={`scroll-mt-24 transition-colors ${
                          focusedAlertId === alert.id
                            ? "bg-emerald-50/70 ring-2 ring-inset ring-[#245A34]/25"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td className="px-5 py-4 align-top">
                          <input
                            type="checkbox"
                            aria-label={t("iot.alerts.bulk.selectAlert")(
                              alertTypeLabel,
                              openedAtLabel,
                            )}
                            checked={selectedAlertIds.has(alert.id)}
                            onChange={() => toggleAlertSelection(alert.id)}
                            disabled={isBulkRunning}
                            className="h-4 w-4 rounded border-slate-300 text-[#245A34] focus:ring-[#245A34]"
                          />
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-black text-slate-800">
                            {alertTypeLabel}
                          </p>
                          <AlertMessageSummary alert={alert} />
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                              alertSeverityClasses[alert.severity]
                            }`}
                          >
                            {alert.display?.severity ?? formatSeverityLabel(t, alert.severity)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                              alertStatusClasses[alert.status]
                            }`}
                          >
                            {alert.display?.status ?? formatAlertStatusLabel(t, alert.status)}
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
                          {openedAtLabel}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => acknowledgeAlert.mutate(alert.id)}
                              disabled={!canAcknowledge || actionPending || isBulkRunning}
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={t("iot.alerts.aria.acknowledge")(
                                alertTypeLabel,
                                openedAtLabel,
                              )}
                            >
                              {acknowledgePending
                                ? t("iot.alerts.actions.acknowledging")
                                : t("iot.alerts.actions.acknowledge")}
                            </button>
                            <button
                              type="button"
                              onClick={() => resolveAlert.mutate(alert.id)}
                              disabled={!canResolve || actionPending || isBulkRunning}
                              className="rounded-full bg-[#245A34] px-3 py-2 text-xs font-black text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={t("iot.alerts.aria.resolve")(
                                alertTypeLabel,
                                openedAtLabel,
                              )}
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
