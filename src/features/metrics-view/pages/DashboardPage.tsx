import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Layers3,
  Leaf,
  MapPinned,
  Pencil,
  Plus,
  RefreshCw,
  Sprout,
  Trash2,
} from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { useMyProfile } from "../../settings/queries";
import {
  useCreateFarmPlot,
  useCreateFarmZone,
  useDeleteFarmPlot,
  useDeleteFarmZone,
  useFarmPlots,
  useFarmZones,
  useUpdateFarmPlot,
  useUpdateFarmZone,
} from "../../farm-management/queries";
import type {
  CreateFarmPlotRequest,
  CreateFarmZoneRequest,
  FarmPlotResponse,
  FarmPlotStatus,
  FarmZoneResponse,
  UpdateFarmPlotRequest,
  UpdateFarmZoneRequest,
} from "../../farm-management/types";
import { ConfirmDeleteDialog } from "../../farm-management/components/ConfirmDeleteDialog";
import { FarmPlotFormDialog } from "../../farm-management/components/FarmPlotFormDialog";
import { FarmZoneFormDialog } from "../../farm-management/components/FarmZoneFormDialog";
import { useMyDevices } from "../../device-onboarding/queries";
import { useDashboardOverview } from "../queries";
import { formatDateTime, formatNumber } from "../utils/format";
import { useTranslation } from "../../../i18n";
import type { TFunction } from "../../../i18n/context";

const STATUS_STYLES: Record<FarmPlotStatus, string> = {
  ACTIVE: "border-emerald-100 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-amber-100 bg-amber-50 text-amber-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-600",
};

const STATUS_KEYS = {
  ACTIVE: "iot.dashboard.status.ACTIVE",
  INACTIVE: "iot.dashboard.status.INACTIVE",
  ARCHIVED: "iot.dashboard.status.ARCHIVED",
} as const;

type PlotDialogState =
  | { mode: "create"; plot?: null }
  | { mode: "edit"; plot: FarmPlotResponse };

type ZoneDialogState =
  | { mode: "create"; zone?: null }
  | { mode: "edit"; zone: FarmZoneResponse };

type DeleteTarget =
  | { type: "plot"; plot: FarmPlotResponse }
  | { type: "zone"; zone: FarmZoneResponse };

function StatusPill({ status }: { status: FarmPlotStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${STATUS_STYLES[status]}`}
    >
      {t(STATUS_KEYS[status])}
    </span>
  );
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Layers3;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
        </div>
        <div className="rounded-full bg-[#EAF3EA] p-3 text-[#245A34]">
          <Icon className="h-5 w-5" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function formatPlotAddress(plot: FarmPlotResponse, t: TFunction) {
  if (plot.addressLine) {
    return plot.addressLine;
  }

  const addressCodes = [plot.wardCode, plot.districtCode, plot.provinceCode]
    .filter(Boolean)
    .join(" / ");

  return addressCodes ? t("iot.dashboard.addressCode")(addressCodes) : t("iot.dashboard.noAddress");
}

function AreaValue({ value, t }: { value?: number | null; t: TFunction }) {
  return <>{value != null ? `${formatNumber(value)} m²` : t("iot.dashboard.notUpdated")}</>;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const plots = useMemo(() => plotsQuery.data ?? [], [plotsQuery.data]);

  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [selectedPlotSnapshot, setSelectedPlotSnapshot] =
    useState<FarmPlotResponse | null>(null);
  const [plotDialog, setPlotDialog] = useState<PlotDialogState | null>(null);
  const [zoneDialog, setZoneDialog] = useState<ZoneDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const activePlotId = useMemo(() => {
    if (plots.length === 0) {
      return null;
    }

    if (selectedPlotId && plots.some((plot) => plot.id === selectedPlotId)) {
      return selectedPlotId;
    }

    return plots[0].id;
  }, [plots, selectedPlotId]);

  const selectedPlot = useMemo(() => {
    const plotFromList = plots.find((plot) => plot.id === activePlotId) ?? null;
    if (plotFromList) {
      return plotFromList;
    }

    if (selectedPlotSnapshot?.id === activePlotId) {
      return selectedPlotSnapshot;
    }

    return null;
  }, [activePlotId, plots, selectedPlotSnapshot]);

  const zonesQuery = useFarmZones(activePlotId ?? "", !!activePlotId);
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const farmDevicesParams = useMemo(
    () => ({
      page: 0,
      size: 1,
      farmPlotId: activePlotId ?? undefined,
    }),
    [activePlotId],
  );
  const farmDevicesQuery = useMyDevices(farmDevicesParams, Boolean(activePlotId));
  const farmDeviceCount = farmDevicesQuery.data?.totalItems ?? 0;
  const canLoadOverview = Boolean(
    activePlotId &&
      !farmDevicesQuery.isLoading &&
      !farmDevicesQuery.isError &&
      farmDeviceCount > 0,
  );
  const overviewQuery = useDashboardOverview(activePlotId ?? "", canLoadOverview);
  const overview = overviewQuery.data;

  const createPlot = useCreateFarmPlot(ownerProfileId);
  const updatePlot = useUpdateFarmPlot(ownerProfileId);
  const deletePlot = useDeleteFarmPlot(ownerProfileId);
  const createZone = useCreateFarmZone(activePlotId ?? "");
  const updateZone = useUpdateFarmZone(activePlotId ?? "");
  const deleteZone = useDeleteFarmZone(activePlotId ?? "");

  const activePlots = plots.filter((plot) => plot.status === "ACTIVE").length;

  const handleCreatePlot = async (
    payload: CreateFarmPlotRequest | UpdateFarmPlotRequest,
  ) => {
    const createdPlot = await createPlot.mutateAsync(
      payload as CreateFarmPlotRequest,
    );
    setSelectedPlotSnapshot(createdPlot);
    setSelectedPlotId(createdPlot.id);
    setPlotDialog(null);
  };

  const handleUpdatePlot = async (
    payload: CreateFarmPlotRequest | UpdateFarmPlotRequest,
  ) => {
    if (!plotDialog || plotDialog.mode !== "edit") {
      return;
    }

    const updatedPlot = await updatePlot.mutateAsync({
      plotId: plotDialog.plot.id,
      payload: payload as UpdateFarmPlotRequest,
    });
    setSelectedPlotSnapshot(updatedPlot);
    setSelectedPlotId(updatedPlot.id);
    setPlotDialog(null);
  };

  const handleCreateZone = async (
    payload: CreateFarmZoneRequest | UpdateFarmZoneRequest,
  ) => {
    if (!activePlotId) {
      return;
    }

    await createZone.mutateAsync(payload as CreateFarmZoneRequest);
    setZoneDialog(null);
  };

  const handleUpdateZone = async (
    payload: CreateFarmZoneRequest | UpdateFarmZoneRequest,
  ) => {
    if (!zoneDialog || zoneDialog.mode !== "edit") {
      return;
    }

    await updateZone.mutateAsync({
      zoneId: zoneDialog.zone.id,
      payload: payload as UpdateFarmZoneRequest,
    });
    setZoneDialog(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === "plot") {
      await deletePlot.mutateAsync(deleteTarget.plot.id);
      if (deleteTarget.plot.id === selectedPlotId) {
        setSelectedPlotId(null);
        setSelectedPlotSnapshot(null);
      }
    } else {
      await deleteZone.mutateAsync(deleteTarget.zone.id);
    }

    setDeleteTarget(null);
  };

  if (profileQuery.isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label={t("iot.dashboard.loading")}
      >
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-[2rem] bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
        <h3 className="text-lg font-black text-red-700">
          {t("iot.dashboard.profileError")}
        </h3>
        <p className="mt-1 text-sm font-semibold text-red-600">
          {t("iot.dashboard.profileErrorDescription")}
        </p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="mt-4 inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {t("iot.dashboard.reload")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 animate-in fade-in duration-500 flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            {t("iot.dashboard.serviceLabel")}
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            {t("iot.dashboard.title")}
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            {t("iot.dashboard.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPlotDialog({ mode: "create" })}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1b432a]"
        >
          <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {t("iot.dashboard.addFarm")}
        </button>
      </header>

      {plotsQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-red-700">
                {t("iot.dashboard.plotsError")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                {t("iot.dashboard.plotsErrorDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void plotsQuery.refetch()}
              className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {t("iot.dashboard.reload")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label={t("iot.dashboard.totalFarms")}
          value={formatNumber(plots.length)}
          detail={t("iot.dashboard.activeCount")(formatNumber(activePlots))}
          icon={MapPinned}
        />
        <MetricTile
          label={t("iot.dashboard.selectedFarmZones")}
          value={formatNumber(zones.length)}
          detail={
            selectedPlot
              ? t("iot.dashboard.zoneMetricDescription")
              : t("iot.dashboard.noFarmSelected")
          }
          icon={Layers3}
        />
        <MetricTile
          label={t("iot.dashboard.openAlerts")}
          value={formatNumber(overview?.openAlerts ?? 0)}
          detail={selectedPlot ? t("iot.dashboard.overviewForFarm")(selectedPlot.name) : t("iot.dashboard.noFarmSelected")}
          icon={Leaf}
        />
        <MetricTile
          label={t("iot.dashboard.onlineDevices")}
          value={
            overview
              ? `${formatNumber(overview.onlineDevices)} / ${formatNumber(overview.totalDevices)}`
              : "0 / 0"
          }
          detail={
            overview
              ? t("iot.dashboard.offlineDevicesDetail")(formatNumber(overview.offlineDevices))
              : t("iot.dashboard.noCollectorData")
          }
          icon={Sprout}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                {t("iot.dashboard.farmList")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {profileQuery.data.fullName}
              </p>
            </div>
            {plotsQuery.isFetching ? (
              <RefreshCw
                className="h-4 w-4 animate-spin text-slate-400"
                strokeWidth={2.5}
              />
            ) : null}
          </div>

          {plotsQuery.isLoading ? (
            <div className="space-y-3" aria-label={t("iot.dashboard.loadingFarmList")}>
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-[1.5rem] bg-slate-100"
                />
              ))}
            </div>
          ) : null}

          {!plotsQuery.isLoading && !plotsQuery.isError && plots.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-base font-black text-slate-800">
                {t("iot.dashboard.emptyFarms")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {t("iot.dashboard.emptyFarmsDescription")}
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            {plots.map((plot) => {
              const isActive = plot.id === activePlotId;

              return (
                <article
                  key={plot.id}
                  className={`rounded-[1.5rem] border p-4 transition ${
                    isActive
                      ? "border-[#245A34] bg-[#F3F8F3]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        {plot.name}
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {formatPlotAddress(plot, t)}
                      </p>
                    </div>
                    <StatusPill status={plot.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {t("iot.dashboard.area")}
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        <AreaValue value={plot.areaM2} t={t} />
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {t("iot.dashboard.farmCode")}
                      </p>
                      <p className="mt-1 truncate font-bold text-slate-800">
                        {plot.code || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlotId(plot.id)}
                      className={`rounded-xl px-3 py-2 text-sm font-bold ${
                        isActive
                          ? "bg-[#245A34] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      aria-label={t("iot.dashboard.selectFarmAria")(plot.name)}
                    >
                      {t("iot.dashboard.select")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlotDialog({ mode: "edit", plot })}
                      className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <Pencil className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                      {t("iot.dashboard.editFarm")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: "plot", plot })}
                      className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                      {t("iot.dashboard.delete")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          {!selectedPlot ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
              <MapPinned className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-xl font-black text-slate-900">
                {t("iot.dashboard.selectFarmTitle")}
              </h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {t("iot.dashboard.selectFarmDescription")}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-black text-slate-900">
                        {selectedPlot.name}
                      </h3>
                      <StatusPill status={selectedPlot.status} />
                    </div>
                    <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
                      {selectedPlot.description || t("iot.dashboard.noFarmDescription")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPlotDialog({ mode: "edit", plot: selectedPlot })
                      }
                      className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="mr-2 h-4 w-4" strokeWidth={2.5} />
                      {t("iot.dashboard.editFarm")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoneDialog({ mode: "create" })}
                      className="inline-flex items-center rounded-2xl bg-[#245A34] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b432a]"
                    >
                      <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
                      {t("iot.dashboard.addZone")}
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t("iot.dashboard.address")}
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {formatPlotAddress(selectedPlot, t)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t("iot.dashboard.area")}
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      <AreaValue value={selectedPlot.areaM2} t={t} />
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t("iot.dashboard.updatedAt")}
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {formatDateTime(selectedPlot.lastModifiedAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t("iot.dashboard.owner")}
                    </p>
                    <p className="mt-2 truncate text-sm font-bold text-slate-800">
                      {profileQuery.data.fullName}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-[#EAF3EA] bg-[#F6FAF6] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        {t("iot.dashboard.liveOverview")}
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {t("iot.dashboard.liveOverviewDescription")}
                      </p>
                    </div>
                    {overviewQuery.isFetching ? (
                      <RefreshCw
                        className="h-4 w-4 animate-spin text-[#245A34]"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <BarChart3 className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />
                    )}
                  </div>
                  {farmDevicesQuery.isLoading ? (
                    <p className="mt-4 rounded-xl bg-white p-3 text-sm font-bold text-slate-600">
                      {t("iot.dashboard.checkingFarmDevices")}
                    </p>
                  ) : farmDevicesQuery.isError ? (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                      {t("iot.dashboard.farmDevicesCheckError")}
                    </p>
                  ) : farmDeviceCount === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-white p-4">
                      <p className="text-sm font-black text-slate-800">
                        {t("iot.dashboard.noFarmDevices")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {t("iot.dashboard.noFarmDevicesDescription")}
                      </p>
                    </div>
                  ) : overviewQuery.isError ? (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                      {t("iot.dashboard.overviewError")}
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          {t("iot.dashboard.zones")}
                        </p>
                        <p className="mt-2 text-xl font-black text-slate-900">
                          {formatNumber(overview?.totalZones ?? zones.length)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          {t("iot.dashboard.online")}
                        </p>
                        <p className="mt-2 text-xl font-black text-emerald-700">
                          {formatNumber(overview?.onlineDevices ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          {t("iot.dashboard.offline")}
                        </p>
                        <p className="mt-2 text-xl font-black text-amber-700">
                          {formatNumber(overview?.offlineDevices ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          {t("iot.dashboard.alerts")}
                        </p>
                        <p className="mt-2 text-xl font-black text-red-700">
                          {formatNumber(overview?.openAlerts ?? 0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {t("iot.dashboard.zoneList")}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {t("iot.dashboard.zoneListDescription")(selectedPlot.name)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setZoneDialog({ mode: "create" })}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b432a]"
                  >
                    <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
                    {t("iot.dashboard.addZone")}
                  </button>
                </div>

                {zonesQuery.isLoading ? (
                  <div className="space-y-3" aria-label={t("iot.dashboard.loadingZones")}>
                    {[0, 1].map((item) => (
                      <div
                        key={item}
                        className="h-32 animate-pulse rounded-[1.5rem] bg-slate-100"
                      />
                    ))}
                  </div>
                ) : null}

                {zonesQuery.isError ? (
                  <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700">
                      {t("iot.dashboard.zonesError")}
                    </p>
                    <button
                      type="button"
                      onClick={() => void zonesQuery.refetch()}
                      className="mt-3 inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
                      {t("iot.dashboard.reloadZones")}
                    </button>
                  </div>
                ) : null}

                {!zonesQuery.isLoading && !zonesQuery.isError && zones.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-base font-black text-slate-800">
                      {t("iot.dashboard.emptyZones")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {t("iot.dashboard.emptyZonesDescription")}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {zones.map((zone) => (
                    <article
                      key={zone.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-lg font-black text-slate-900">
                              {zone.zoneName}
                            </h4>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {zone.description || zone.zoneCode || t("iot.dashboard.noDescription")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={ROUTES.DASHBOARD.ZONE_METRICS(zone.id)}
                            className="inline-flex items-center rounded-2xl border border-[#245A34] bg-white px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-50"
                          >
                            {t("iot.dashboard.viewMetrics")}
                          </Link>
                          <button
                            type="button"
                            onClick={() => setZoneDialog({ mode: "edit", zone })}
                            className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                          >
                            <Pencil className="mr-2 h-4 w-4" strokeWidth={2.5} />
                            {t("iot.dashboard.editZone")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: "zone", zone })}
                            className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" strokeWidth={2.5} />
                            {t("iot.dashboard.delete")}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {t("iot.dashboard.area")}
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-800">
                            <AreaValue value={zone.areaM2} t={t} />
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {t("iot.dashboard.soilType")}
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-800">
                            {zone.soilType || t("iot.dashboard.notUpdated")}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {t("iot.dashboard.cropType")}
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-800">
                            {zone.cropType || t("iot.dashboard.notUpdated")}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {t("iot.dashboard.plantingDate")}
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-800">
                            {zone.plantingDate || t("iot.dashboard.notUpdated")}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {t("iot.dashboard.zoneCode")}
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-800">
                            {zone.zoneCode || "-"}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {plotDialog ? (
        <FarmPlotFormDialog
          key={
            plotDialog.mode === "edit"
              ? `plot-edit-${plotDialog.plot.id}`
              : "plot-create"
          }
          mode={plotDialog.mode}
          ownerProfileId={ownerProfileId}
          plot={plotDialog.mode === "edit" ? plotDialog.plot : null}
          isSubmitting={
            plotDialog.mode === "create" ? createPlot.isPending : updatePlot.isPending
          }
          onClose={() => setPlotDialog(null)}
          onSubmit={
            plotDialog.mode === "create" ? handleCreatePlot : handleUpdatePlot
          }
        />
      ) : null}

      {zoneDialog ? (
        <FarmZoneFormDialog
          key={
            zoneDialog.mode === "edit"
              ? `zone-edit-${zoneDialog.zone.id}`
              : "zone-create"
          }
          mode={zoneDialog.mode}
          zone={zoneDialog.mode === "edit" ? zoneDialog.zone : null}
          isSubmitting={
            zoneDialog.mode === "create" ? createZone.isPending : updateZone.isPending
          }
          onClose={() => setZoneDialog(null)}
          onSubmit={
            zoneDialog.mode === "create" ? handleCreateZone : handleUpdateZone
          }
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDeleteDialog
          title={
            deleteTarget.type === "plot" ? t("iot.dashboard.deleteFarmTitle") : t("iot.dashboard.deleteZoneTitle")
          }
          description={
            deleteTarget.type === "plot"
              ? t("iot.dashboard.deleteFarmDescription")(deleteTarget.plot.name)
              : t("iot.dashboard.deleteZoneDescription")(deleteTarget.zone.zoneName)
          }
          isDeleting={
            deleteTarget.type === "plot"
              ? deletePlot.isPending
              : deleteZone.isPending
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleConfirmDelete()}
        />
      ) : null}
    </div>
  );
}

export default DashboardPage;
