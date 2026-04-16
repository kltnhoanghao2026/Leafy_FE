import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useClaimDevice,
  useGenerateClaimCode,
  useMyDevices,
  useProvisionDevice,
} from "../queries";
import { ROUTES } from "../../../lib/routes";
import type {
  DeviceResponse,
  DeviceStatus,
  GenerateClaimCodeResponse,
  MyDevicesParams,
  ProvisioningStatus,
} from "../../../types/iot";
import {
  compactId,
  formatDateTime,
  formatNumber,
} from "../../metrics-view/utils/format";

type ProvisioningFilter = "all" | ProvisioningStatus;
type DeviceStatusFilter = "all" | DeviceStatus;

interface ProvisionFormState {
  deviceUid: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
}

interface ClaimFormState {
  deviceUid: string;
  claimCode: string;
  farmPlotId: string;
  zoneId: string;
}

const emptyProvisionForm: ProvisionFormState = {
  deviceUid: "",
  deviceCode: "",
  deviceName: "",
  deviceType: "ESP32",
};

const emptyClaimForm: ClaimFormState = {
  deviceUid: "",
  claimCode: "",
  farmPlotId: "",
  zoneId: "",
};

const statusBadgeClass = (status: string) => {
  if (status === "ONLINE" || status === "CLAIMED") {
    return "bg-green-50 text-green-700 border-green-100";
  }
  if (status === "OFFLINE" || status === "RETIRED") {
    return "bg-red-50 text-red-600 border-red-100";
  }
  return "bg-slate-50 text-slate-600 border-slate-100";
};

const trimProvision = (form: ProvisionFormState): ProvisionFormState => ({
  deviceUid: form.deviceUid.trim(),
  deviceCode: form.deviceCode.trim(),
  deviceName: form.deviceName.trim(),
  deviceType: form.deviceType.trim(),
});

const trimClaim = (form: ClaimFormState): ClaimFormState => ({
  deviceUid: form.deviceUid.trim(),
  claimCode: form.claimCode.trim(),
  farmPlotId: form.farmPlotId.trim(),
  zoneId: form.zoneId.trim(),
});

const hasEmptyValue = (values: string[]) =>
  Object.values(values).some((value) => !value.trim());

export function DeviceOnboardingPage() {
  const [provisionForm, setProvisionForm] =
    useState<ProvisionFormState>(emptyProvisionForm);
  const [claimForm, setClaimForm] = useState<ClaimFormState>(emptyClaimForm);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [claimCodeResult, setClaimCodeResult] =
    useState<GenerateClaimCodeResponse | null>(null);
  const [provisionValidation, setProvisionValidation] = useState<string | null>(
    null,
  );
  const [claimValidation, setClaimValidation] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<DeviceStatusFilter>("all");
  const [provisioningStatus, setProvisioningStatus] =
    useState<ProvisioningFilter>("all");

  const deviceParams = useMemo<MyDevicesParams>(
    () => ({
      page,
      size,
      sortBy: "createdAt",
      sortDir: "desc",
      keyword: keyword.trim() || undefined,
      status: status === "all" ? undefined : status,
      provisioningStatus:
        provisioningStatus === "all" ? undefined : provisioningStatus,
    }),
    [keyword, page, provisioningStatus, size, status],
  );

  const devicesQuery = useMyDevices(deviceParams);
  const provisionDevice = useProvisionDevice();
  const generateClaimCode = useGenerateClaimCode();
  const claimDevice = useClaimDevice();

  const pagedDevices = devicesQuery.data;
  const devices = pagedDevices?.items ?? [];

  const resetToFirstPage = () => setPage(0);

  const handleProvision = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = trimProvision(provisionForm);
    if (hasEmptyValue(Object.values(payload))) {
      setProvisionValidation("All provision fields are required.");
      return;
    }

    setProvisionValidation(null);
    try {
      const response = await provisionDevice.mutateAsync(payload);
      const device = response.data;
      setSelectedDeviceId(device.id);
      setClaimForm((current) => ({ ...current, deviceUid: device.deviceUid }));
    } catch {
      // Mutation error state is rendered under the form.
    }
  };

  const handleGenerateClaimCode = async () => {
    const deviceId = selectedDeviceId.trim();
    if (!deviceId) {
      setProvisionValidation("Device ID is required to generate a claim code.");
      return;
    }

    setProvisionValidation(null);
    try {
      const response = await generateClaimCode.mutateAsync(deviceId);
      setClaimCodeResult(response.data);
      setClaimForm((current) => ({
        ...current,
        claimCode: response.data.claimCode,
      }));
    } catch {
      // Mutation error state is rendered under the form.
    }
  };

  const handleClaim = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = trimClaim(claimForm);
    if (hasEmptyValue(Object.values(payload))) {
      setClaimValidation("Device UID, claim code, farm plot ID, and zone ID are required.");
      return;
    }

    setClaimValidation(null);
    try {
      await claimDevice.mutateAsync(payload);
    } catch {
      // Mutation error state is rendered under the form.
    }
  };

  const selectDevice = (device: DeviceResponse) => {
    setSelectedDeviceId(device.id);
    setClaimForm((current) => ({
      ...current,
      deviceUid: device.deviceUid,
      farmPlotId: device.farmPlotId ?? current.farmPlotId,
      zoneId: device.zoneId ?? current.zoneId,
    }));
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
          Device onboarding
        </h2>
        <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
          Provision devices, generate claim codes, bind devices to a farm and
          zone, and inspect owned devices from the collector.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 lg:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
                Provision device
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                Creates an unclaimed collector device record.
              </p>
            </div>
            <Plus className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />
          </div>

          <form onSubmit={handleProvision} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Device UID
                </span>
                <input
                  value={provisionForm.deviceUid}
                  onChange={(event) =>
                    setProvisionForm((current) => ({
                      ...current,
                      deviceUid: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Device code
                </span>
                <input
                  value={provisionForm.deviceCode}
                  onChange={(event) =>
                    setProvisionForm((current) => ({
                      ...current,
                      deviceCode: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Device name
                </span>
                <input
                  value={provisionForm.deviceName}
                  onChange={(event) =>
                    setProvisionForm((current) => ({
                      ...current,
                      deviceName: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Device type
                </span>
                <input
                  value={provisionForm.deviceType}
                  onChange={(event) =>
                    setProvisionForm((current) => ({
                      ...current,
                      deviceType: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                />
              </label>
            </div>

            {provisionValidation ? (
              <p role="alert" className="text-sm font-bold text-red-600">
                {provisionValidation}
              </p>
            ) : null}
            {provisionDevice.isError || generateClaimCode.isError ? (
              <p role="alert" className="text-sm font-bold text-red-600">
                Device onboarding request failed. Check for duplicate IDs,
                invalid state, or collector validation errors.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={provisionDevice.isPending}
                className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {provisionDevice.isPending ? "Provisioning..." : "Provision"}
              </button>
            </div>
          </form>

          <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Device ID for claim code
              </span>
              <input
                value={selectedDeviceId}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleGenerateClaimCode()}
              disabled={generateClaimCode.isPending}
              className="mt-3 inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <KeyRound className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {generateClaimCode.isPending
                ? "Generating..."
                : "Generate claim code"}
            </button>

            {claimCodeResult ? (
              <div className="mt-4 rounded-2xl bg-white border border-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Claim code
                </p>
                <p className="mt-1 text-2xl font-black text-slate-800">
                  {claimCodeResult.claimCode}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Expires {formatDateTime(claimCodeResult.expiresAt)}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 lg:p-8 shadow-sm">
          <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
            Claim device
          </h3>
          <p className="text-sm font-semibold text-slate-500 mb-6">
            Binds a provisioned device to the current user, farm plot, and zone.
          </p>

          <form onSubmit={handleClaim} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Device UID
                </span>
                <input
                  value={claimForm.deviceUid}
                  onChange={(event) =>
                    setClaimForm((current) => ({
                      ...current,
                      deviceUid: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Claim code
                </span>
                <input
                  value={claimForm.claimCode}
                  onChange={(event) =>
                    setClaimForm((current) => ({
                      ...current,
                      claimCode: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Farm plot ID
                </span>
                <input
                  value={claimForm.farmPlotId}
                  onChange={(event) =>
                    setClaimForm((current) => ({
                      ...current,
                      farmPlotId: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Zone ID
                </span>
                <input
                  value={claimForm.zoneId}
                  onChange={(event) =>
                    setClaimForm((current) => ({
                      ...current,
                      zoneId: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                />
              </label>
            </div>

            {claimValidation ? (
              <p role="alert" className="text-sm font-bold text-red-600">
                {claimValidation}
              </p>
            ) : null}
            {claimDevice.isError ? (
              <p role="alert" className="text-sm font-bold text-red-600">
                Claim failed. Check the claim code, expiry, ownership state, and
                target IDs.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={claimDevice.isPending}
              className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {claimDevice.isPending ? "Claiming..." : "Claim device"}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            aria-label="Device keyword"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Keyword"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          />
          <select
            aria-label="Device status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as DeviceStatusFilter);
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          >
            <option value="all">All statuses</option>
            <option value="ONLINE">ONLINE</option>
            <option value="OFFLINE">OFFLINE</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
          <select
            aria-label="Provisioning status"
            value={provisioningStatus}
            onChange={(event) => {
              setProvisioningStatus(event.target.value as ProvisioningFilter);
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          >
            <option value="all">All provisioning</option>
            <option value="PROVISIONED">PROVISIONED</option>
            <option value="CLAIMED">CLAIMED</option>
            <option value="RETIRED">RETIRED</option>
          </select>
          <select
            aria-label="Device page size"
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
      </section>

      {devicesQuery.isLoading ? (
        <div
          aria-label="Loading my devices"
          className="rounded-[2rem] bg-white border border-slate-100 p-5 shadow-sm"
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-16 rounded-2xl bg-slate-100 animate-pulse mb-3 last:mb-0"
            />
          ))}
        </div>
      ) : null}

      {devicesQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-red-700">
                My devices could not be loaded
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                The collector returned an error for the current filters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void devicesQuery.refetch()}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {pagedDevices && !devicesQuery.isError ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div>
              <p className="text-sm font-black text-slate-800">
                {formatNumber(pagedDevices.totalItems)} devices
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Page {formatNumber(pagedDevices.page + 1)} of{" "}
                {formatNumber(Math.max(pagedDevices.totalPages, 1))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={!pagedDevices.hasPrevious}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous devices page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!pagedDevices.hasNext}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next devices page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-black text-slate-800">No devices</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                The backend returned an empty owned-device page.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left" aria-label="My devices">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Device
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Scope
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Last seen
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devices.map((device) => (
                    <tr key={device.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-black text-slate-800">
                          {device.deviceName}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {device.deviceCode} - {device.deviceUid}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClass(
                              device.status,
                            )}`}
                          >
                            {device.status}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClass(
                              device.provisioningStatus,
                            )}`}
                          >
                            {device.provisioningStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-xs font-bold text-slate-600">
                          Farm {compactId(device.farmPlotId)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          Zone {compactId(device.zoneId)}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-sm font-bold text-slate-600">
                        {formatDateTime(device.lastSeenAt)}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => selectDevice(device)}
                            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                          >
                            Select
                          </button>
                          <Link
                            to={ROUTES.DASHBOARD.DEVICE_DETAIL(device.id)}
                            className="rounded-full bg-[#245A34] px-3 py-2 text-xs font-black text-white hover:bg-[#1b432a]"
                          >
                            Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default DeviceOnboardingPage;
