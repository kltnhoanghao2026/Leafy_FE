import { Link } from "react-router-dom";
import { Cpu, LogOut, Plus, RefreshCw, Search, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Select } from "../../../components/ui/Select";
import { useTranslation } from "../../../i18n";
import type { TFunction } from "../../../i18n/context";
import { ROUTES } from "../../../lib/routes";
import type {
  DeviceResponse,
  DeviceStatus,
  MyDevicesParams,
  ProvisioningStatus,
} from "../../../types/iot";
import { formatDateTime } from "../../metrics-view/utils/format";
import {
  formatDeviceStatusLabel,
  formatDeviceTypeLabel,
} from "../../iot/utils/iotTranslation";
import { EditDeviceModal } from "../../device-detail/components/EditDeviceModal";
import { ReleaseDeviceConfirmDialog } from "../../device-detail/components/ReleaseDeviceConfirmDialog";
import {
  useReleaseDeviceMutation,
  useUpdateDeviceMutation,
} from "../../device-detail/queries";
import { useMyDevices } from "../queries";

const DEVICE_STATUSES: DeviceStatus[] = ["ONLINE", "OFFLINE", "UNKNOWN"];

const PROVISIONING_STATUSES: ProvisioningStatus[] = ["CLAIMED", "PROVISIONED", "RETIRED"];

const statusTone: Record<string, string> = {
  ONLINE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OFFLINE: "bg-slate-100 text-slate-600 border-slate-200",
  UNKNOWN: "bg-amber-50 text-amber-700 border-amber-200",
};

const provisioningTone: Record<string, string> = {
  CLAIMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROVISIONED: "bg-violet-50 text-violet-700 border-violet-200",
  RETIRED: "bg-rose-50 text-rose-700 border-rose-200",
};

function StatusBadge({
  value,
  toneMap,
  t,
}: {
  value?: string | null;
  toneMap: Record<string, string>;
  t: TFunction;
}) {
  const label = value || "UNKNOWN";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
        toneMap[label] || "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {formatDeviceStatusLabel(t, label)}
    </span>
  );
}

function readableDeviceName(
  t: TFunction,
  device?: { deviceName?: string | null; deviceCode?: string | null },
) {
  return device?.deviceName?.trim() || device?.deviceCode?.trim() || t("iot.devices.defaultName");
}

function DeviceCard({
  device,
  t,
  onEdit,
  onRelease,
  isActionPending,
}: {
  device: DeviceResponse;
  t: TFunction;
  onEdit: (device: DeviceResponse) => void;
  onRelease: (device: DeviceResponse) => void;
  isActionPending?: boolean;
}) {
  const deviceName = readableDeviceName(t, device);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-slate-900">
                {deviceName}
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                {formatDeviceTypeLabel(t, device.deviceType)} · {formatDeviceStatusLabel(t, device.status)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {t("iot.devices.index.deviceType")}
              </p>
              <p className="font-semibold text-slate-700">
                {formatDeviceTypeLabel(t, device.deviceType)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {t("iot.common.farm")}
              </p>
              <p className="font-semibold text-slate-700">
                {device.farmPlotId ? t("iot.devices.index.farmAssigned") : t("iot.devices.index.farmUnassigned")}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {t("iot.common.zone")}
              </p>
              <p className="font-semibold text-slate-700">
                {device.zoneId ? t("iot.devices.index.zoneAssigned") : t("iot.devices.index.zoneUnassigned")}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {t("iot.devices.index.lastSeenAt")}
              </p>
              <p className="font-semibold text-slate-700">
                {formatDateTime(device.lastSeenAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <StatusBadge value={device.status} toneMap={statusTone} t={t} />
            <StatusBadge
              value={device.provisioningStatus}
              toneMap={provisioningTone}
              t={t}
            />
          </div>
          <Link
            to={ROUTES.DASHBOARD.DEVICE_DETAIL(device.id)}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700"
          >
            {t("iot.devices.index.viewDetail")}
          </Link>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => onEdit(device)}
              disabled={isActionPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Settings2 className="h-4 w-4" />
              {t("iot.devices.actions.edit")}
            </button>
            <button
              type="button"
              onClick={() => onRelease(device)}
              disabled={isActionPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {t("iot.devices.actions.release")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function getDeviceManagementErrorMessage(error: unknown, t: TFunction, action: "edit" | "release") {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("403")) return t("iot.devices.release.forbidden");
  if (message.includes("404")) {
    return action === "edit"
      ? t("iot.devices.edit.notFound")
      : t("iot.devices.release.notFound");
  }
  if (message.includes("400")) return t("iot.devices.edit.invalidName");
  return message || (action === "edit" ? t("iot.devices.edit.error") : t("iot.devices.release.error"));
}

export function DeviceIndexRedirect() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<DeviceStatus | "">("");
  const [provisioningStatus, setProvisioningStatus] = useState<
    ProvisioningStatus | ""
  >("CLAIMED");
  const [editingDevice, setEditingDevice] = useState<DeviceResponse | null>(null);
  const [releasingDevice, setReleasingDevice] = useState<DeviceResponse | null>(null);

  const params = useMemo<MyDevicesParams>(
    () => ({
      page,
      size: 10,
      sortBy: "lastSeenAt",
      sortDir: "desc",
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      ...(status ? { status } : {}),
      ...(provisioningStatus ? { provisioningStatus } : {}),
    }),
    [keyword, page, provisioningStatus, status],
  );

  const devicesQuery = useMyDevices(params);
  const updateDeviceMutation = useUpdateDeviceMutation();
  const releaseDeviceMutation = useReleaseDeviceMutation();
  const devices = devicesQuery.data?.items ?? [];
  const totalItems = devicesQuery.data?.totalItems ?? 0;
  const allOption = useMemo(() => ({ value: "", label: t("iot.devices.index.all") }), [t]);
  const statusOptions = useMemo(
    () => [
      allOption,
      ...DEVICE_STATUSES.map((value) => ({
        value,
        label: formatDeviceStatusLabel(t, value),
      })),
    ],
    [allOption, t],
  );
  const provisioningStatusOptions = useMemo(
    () => [
      allOption,
      ...PROVISIONING_STATUSES.map((value) => ({
        value,
        label: formatDeviceStatusLabel(t, value),
      })),
    ],
    [allOption, t],
  );
  const isActionPending =
    updateDeviceMutation.isPending || releaseDeviceMutation.isPending;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
            {t("iot.devices.index.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            {t("iot.devices.index.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
            {t("iot.devices.index.description")}
          </p>
        </div>
        <Link
          to={ROUTES.DASHBOARD.DEVICE_ONBOARDING}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          {t("iot.devices.index.connectNew")}
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("iot.devices.index.search")}
            </span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => {
                  setPage(0);
                  setKeyword(event.target.value);
                }}
                placeholder={t("iot.devices.index.searchPlaceholder")}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("iot.devices.index.status")}
            </span>
            <Select
              ariaLabel={t("iot.devices.index.status")}
              value={status}
              onChange={(value) => {
                setPage(0);
                setStatus(value as DeviceStatus | "");
              }}
              options={statusOptions}
              className="mt-2"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("iot.devices.index.provisioning")}
            </span>
            <Select
              ariaLabel={t("iot.devices.index.provisioning")}
              value={provisioningStatus}
              onChange={(value) => {
                setPage(0);
                setProvisioningStatus(value as ProvisioningStatus | "");
              }}
              options={provisioningStatusOptions}
              className="mt-2"
            />
          </label>

          <button
            type="button"
            onClick={() => devicesQuery.refetch()}
            disabled={devicesQuery.isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                devicesQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            {t("iot.devices.index.refresh")}
          </button>
        </div>
      </div>

      {devicesQuery.isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
          {t("iot.devices.index.loading")}
        </div>
      ) : devicesQuery.isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
          <p className="font-black">{t("iot.devices.index.errorTitle")}</p>
          <p className="mt-1 text-sm font-semibold">
            {getErrorMessage(devicesQuery.error, t("iot.devices.index.errorDescription"))}
          </p>
          <button
            type="button"
            onClick={() => devicesQuery.refetch()}
            className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-700"
          >
            {t("iot.common.retry")}
          </button>
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
            <Cpu className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">
            {t("iot.devices.index.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
            {t("iot.devices.index.emptyDescription")}
          </p>
          <Link
            to={ROUTES.DASHBOARD.DEVICE_ONBOARDING}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            {t("iot.devices.index.connectNew")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-sm font-bold text-slate-500">
            <span>{t("iot.devices.index.count")(totalItems)}</span>
            {devicesQuery.isFetching ? <span>{t("iot.devices.index.updating")}</span> : null}
          </div>
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              t={t}
              onEdit={setEditingDevice}
              onRelease={setReleasingDevice}
              isActionPending={isActionPending}
            />
          ))}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={!devicesQuery.data?.hasPrevious || devicesQuery.isFetching}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("iot.devices.index.previousPage")}
            </button>
            <span className="text-sm font-bold text-slate-500">
              {t("iot.devices.index.page")(
                (devicesQuery.data?.page ?? page) + 1,
                Math.max(devicesQuery.data?.totalPages ?? 1, 1),
              )}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!devicesQuery.data?.hasNext || devicesQuery.isFetching}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("iot.devices.index.nextPage")}
            </button>
          </div>
        </div>
      )}
      <EditDeviceModal
        open={Boolean(editingDevice)}
        device={editingDevice}
        onClose={() => setEditingDevice(null)}
        isSubmitting={updateDeviceMutation.isPending}
        onSubmit={async (payload) => {
          if (!editingDevice) return;
          try {
            await updateDeviceMutation.mutateAsync({
              deviceId: editingDevice.id,
              payload,
            });
            toast.success(t("iot.devices.edit.success"));
            setEditingDevice(null);
            await devicesQuery.refetch();
          } catch (error) {
            toast.error(getDeviceManagementErrorMessage(error, t, "edit"));
            throw error;
          }
        }}
      />
      <ReleaseDeviceConfirmDialog
        open={Boolean(releasingDevice)}
        deviceName={releasingDevice ? readableDeviceName(t, releasingDevice) : undefined}
        onClose={() => setReleasingDevice(null)}
        isSubmitting={releaseDeviceMutation.isPending}
        onConfirm={async () => {
          if (!releasingDevice) return;
          try {
            await releaseDeviceMutation.mutateAsync({ deviceId: releasingDevice.id });
            toast.success(t("iot.devices.release.success"));
            setReleasingDevice(null);
            await devicesQuery.refetch();
          } catch (error) {
            toast.error(getDeviceManagementErrorMessage(error, t, "release"));
          }
        }}
      />
    </section>
  );
}

export default DeviceIndexRedirect;
