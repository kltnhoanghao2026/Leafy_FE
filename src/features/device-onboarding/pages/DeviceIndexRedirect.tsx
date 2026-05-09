import { Link } from "react-router-dom";
import { Cpu, Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Select } from "../../../components/ui/Select";
import { ROUTES } from "../../../lib/routes";
import type {
  DeviceResponse,
  DeviceStatus,
  MyDevicesParams,
  ProvisioningStatus,
} from "../../../types/iot";
import { formatDateTime } from "../../metrics-view/utils/format";
import { useMyDevices } from "../queries";
import {
  deviceStatusLabel,
  deviceTypeLabel,
  provisioningStatusLabel,
  readableDeviceName,
} from "../utils/deviceLabels";

const DEVICE_STATUSES: Array<{ value: DeviceStatus; label: string }> = [
  { value: "ONLINE", label: "Đang online" },
  { value: "OFFLINE", label: "Đang offline" },
  { value: "UNKNOWN", label: "Chưa rõ trạng thái" },
];

const ALL_OPTION = { value: "", label: "Tất cả" };

const PROVISIONING_STATUSES: Array<{
  value: ProvisioningStatus;
  label: string;
}> = [
  { value: "CLAIMED", label: "Đã liên kết" },
  { value: "PROVISIONED", label: "Chờ liên kết" },
  { value: "RETIRED", label: "Ngừng dùng" },
];

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
}: {
  value?: string | null;
  toneMap: Record<string, string>;
}) {
  const label = value || "UNKNOWN";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
        toneMap[label] || "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {toneMap === provisioningTone
        ? provisioningStatusLabel(label)
        : deviceStatusLabel(label)}
    </span>
  );
}

function DeviceCard({ device }: { device: DeviceResponse }) {
  const deviceName = readableDeviceName(device);

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
                {deviceTypeLabel(device.deviceType)} · {deviceStatusLabel(device.status)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Loại thiết bị
              </p>
              <p className="font-semibold text-slate-700">
                {deviceTypeLabel(device.deviceType)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Vườn
              </p>
              <p className="font-semibold text-slate-700">
                {device.farmPlotId ? "Đã gán vào vườn" : "Chưa gán vườn"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Khu vực
              </p>
              <p className="font-semibold text-slate-700">
                {device.zoneId ? "Đã gán vào khu vực" : "Chưa gán khu vực"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Lần online cuối
              </p>
              <p className="font-semibold text-slate-700">
                {formatDateTime(device.lastSeenAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <StatusBadge value={device.status} toneMap={statusTone} />
            <StatusBadge
              value={device.provisioningStatus}
              toneMap={provisioningTone}
            />
          </div>
          <Link
            to={ROUTES.DASHBOARD.DEVICE_DETAIL(device.id)}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Không tải được danh sách thiết bị. Vui lòng thử lại.";
}

export function DeviceIndexRedirect() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<DeviceStatus | "">("");
  const [provisioningStatus, setProvisioningStatus] = useState<
    ProvisioningStatus | ""
  >("CLAIMED");

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
  const devices = devicesQuery.data?.items ?? [];
  const totalItems = devicesQuery.data?.totalItems ?? 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
            IoT devices
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Quản lý thiết bị IoT
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
            Theo dõi các thiết bị đã kết nối, trạng thái online và mở nhanh
            trang chi tiết để xem readings, chart, cấu hình và cảnh báo.
          </p>
        </div>
        <Link
          to={ROUTES.DASHBOARD.DEVICE_ONBOARDING}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Kết nối thiết bị mới
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Tìm kiếm
            </span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => {
                  setPage(0);
                  setKeyword(event.target.value);
                }}
                placeholder="Tên, mã hoặc UID thiết bị"
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Trạng thái
            </span>
            <Select
              ariaLabel="Trạng thái"
              value={status}
              onChange={(value) => {
                setPage(0);
                setStatus(value as DeviceStatus | "");
              }}
              options={[ALL_OPTION, ...DEVICE_STATUSES]}
              className="mt-2"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Kết nối
            </span>
            <Select
              ariaLabel="Kết nối"
              value={provisioningStatus}
              onChange={(value) => {
                setPage(0);
                setProvisioningStatus(value as ProvisioningStatus | "");
              }}
              options={[ALL_OPTION, ...PROVISIONING_STATUSES]}
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
            Tải lại
          </button>
        </div>
      </div>

      {devicesQuery.isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
          Đang tải danh sách thiết bị...
        </div>
      ) : devicesQuery.isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
          <p className="font-black">Không tải được thiết bị</p>
          <p className="mt-1 text-sm font-semibold">
            {getErrorMessage(devicesQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => devicesQuery.refetch()}
            className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
            <Cpu className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Chưa có thiết bị phù hợp
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
            Nếu bạn vừa bootstrap dữ liệu, hãy kiểm tra user đang đăng nhập và
            trạng thái filter. Bạn cũng có thể kết nối thiết bị mới từ flow
            onboarding.
          </p>
          <Link
            to={ROUTES.DASHBOARD.DEVICE_ONBOARDING}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Kết nối thiết bị mới
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-sm font-bold text-slate-500">
            <span>{totalItems} thiết bị</span>
            {devicesQuery.isFetching ? <span>Đang cập nhật...</span> : null}
          </div>
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={!devicesQuery.data?.hasPrevious || devicesQuery.isFetching}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="text-sm font-bold text-slate-500">
              Trang {(devicesQuery.data?.page ?? page) + 1} /{" "}
              {Math.max(devicesQuery.data?.totalPages ?? 1, 1)}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!devicesQuery.data?.hasNext || devicesQuery.isFetching}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DeviceIndexRedirect;
