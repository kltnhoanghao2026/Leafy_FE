import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ModalShell } from "../../../components/ui/ModalShell";
import {
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
  useUpdateAlertRule,
  useUpdateAlertRuleEnabled,
} from "../queries";
import { useAlertScopeOptions } from "../../alerts/hooks/useAlertScopeOptions";
import { useInferredSensorTypeOptions } from "../../alerts/hooks/useInferredSensorTypeOptions";
import { useFarmZones } from "../../farm-management/queries";
import type {
  AlertRuleResponse,
  AlertRulesParams,
  AlertSeverity,
  CreateAlertRuleRequest,
} from "../../../types/iot";
import {
  compactId,
  formatDateTime,
  formatNumber,
} from "../../metrics-view/utils/format";

type EnabledFilter = "all" | "true" | "false";

interface RuleFormState {
  sensorTypeId: string;
  deviceId: string;
  zoneId: string;
  farmPlotId: string;
  minThreshold: string;
  maxThreshold: string;
  severity: AlertSeverity;
  cooldownMinutes: string;
  notifyWeb: boolean;
  notifyMobile: boolean;
  enabled: boolean;
}

const emptyRuleForm: RuleFormState = {
  sensorTypeId: "",
  deviceId: "",
  zoneId: "",
  farmPlotId: "",
  minThreshold: "",
  maxThreshold: "",
  severity: "HIGH",
  cooldownMinutes: "0",
  notifyWeb: true,
  notifyMobile: false,
  enabled: true,
};

const severityClasses: Record<AlertSeverity, string> = {
  LOW: "bg-blue-50 text-blue-600 border-blue-100",
  MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-100",
  HIGH: "bg-orange-50 text-orange-700 border-orange-100",
  CRITICAL: "bg-red-50 text-red-600 border-red-100",
};

const enabledClasses = {
  true: "bg-green-50 text-green-700 border-green-100",
  false: "bg-slate-50 text-slate-600 border-slate-100",
};

const toFormState = (rule: AlertRuleResponse): RuleFormState => ({
  sensorTypeId: rule.sensorTypeId,
  deviceId: rule.deviceId ?? "",
  zoneId: rule.zoneId ?? "",
  farmPlotId: rule.farmPlotId ?? "",
  minThreshold:
    rule.minThreshold === null || rule.minThreshold === undefined
      ? ""
      : String(rule.minThreshold),
  maxThreshold:
    rule.maxThreshold === null || rule.maxThreshold === undefined
      ? ""
      : String(rule.maxThreshold),
  severity: rule.severity,
  cooldownMinutes:
    rule.cooldownMinutes === null || rule.cooldownMinutes === undefined
      ? ""
      : String(rule.cooldownMinutes),
  notifyWeb: Boolean(rule.notifyWeb),
  notifyMobile: Boolean(rule.notifyMobile),
  enabled: rule.enabled !== false,
});

const optionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
};

const optionalString = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const buildPayload = (form: RuleFormState): CreateAlertRuleRequest => ({
  sensorTypeId: form.sensorTypeId.trim(),
  deviceId: optionalString(form.deviceId),
  zoneId: optionalString(form.zoneId),
  farmPlotId: optionalString(form.farmPlotId),
  minThreshold: optionalNumber(form.minThreshold),
  maxThreshold: optionalNumber(form.maxThreshold),
  severity: form.severity,
  cooldownMinutes: optionalNumber(form.cooldownMinutes),
  notifyWeb: form.notifyWeb,
  notifyMobile: form.notifyMobile,
  enabled: form.enabled,
});

const validatePayload = (payload: CreateAlertRuleRequest): string | null => {
  if (!payload.sensorTypeId) return "Sensor type ID is required.";
  if (payload.minThreshold == null && payload.maxThreshold == null) {
    return "At least one threshold is required.";
  }
  if (
    payload.minThreshold != null &&
    payload.maxThreshold != null &&
    payload.minThreshold >= payload.maxThreshold
  ) {
    return "Minimum threshold must be lower than maximum threshold.";
  }
  if (!payload.deviceId && !payload.zoneId && !payload.farmPlotId) {
    return "Select at least one scope: farm plot, zone, or device.";
  }
  if (
    payload.cooldownMinutes !== null &&
    payload.cooldownMinutes !== undefined &&
    payload.cooldownMinutes < 0
  ) {
    return "Cooldown must be greater than or equal to 0.";
  }

  return null;
};

interface RuleFormDialogProps {
  form: RuleFormState;
  editingRule: AlertRuleResponse | null;
  isSubmitting: boolean;
  validationMessage: string | null;
  requestFailed: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (updater: (current: RuleFormState) => RuleFormState) => void;
}

function RuleFormDialog({
  form,
  editingRule,
  isSubmitting,
  validationMessage,
  requestFailed,
  onClose,
  onSubmit,
  onFormChange,
}: RuleFormDialogProps) {
  const {
    farmPlots,
    zones,
    devices,
    plotsQuery,
    zonesQuery,
    devicesQuery,
  } = useAlertScopeOptions({
    farmPlotId: form.farmPlotId,
    zoneId: form.zoneId,
  });
  const { sensorOptions, isLoading: sensorOptionsLoading } =
    useInferredSensorTypeOptions(form.deviceId, form.zoneId);

  const hasSelectedSensorOption = sensorOptions.some(
    (option) => option.id === form.sensorTypeId,
  );

  useEffect(() => {
    if (
      form.deviceId &&
      devices.length > 0 &&
      !devices.some((device) => device.id === form.deviceId)
    ) {
      onFormChange((current) => ({ ...current, deviceId: "" }));
    }
  }, [devices, form.deviceId, onFormChange]);

  return (
    <ModalShell
      onClose={onClose}
      title={editingRule ? "Edit alert rule" : "Create alert rule"}
      subtitle={
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Pick farm, zone, and device where possible. Sensor type requires a real backend UUID.
        </p>
      }
      maxWidth="sm:max-w-5xl"
      backdropColor="bg-slate-950/40"
    >
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">
              Scope
            </h4>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Farm plot
                </span>
                <select
                  aria-label="Rule farm plot"
                  value={form.farmPlotId}
                  onChange={(event) => {
                    const farmPlotId = event.target.value;
                    onFormChange((current) => ({
                      ...current,
                      farmPlotId,
                      zoneId: "",
                      deviceId: "",
                    }));
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                  disabled={plotsQuery.isLoading}
                >
                  <option value="">
                    {plotsQuery.isLoading ? "Loading farms..." : "No farm scope"}
                  </option>
                  {farmPlots.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Zone
                </span>
                <select
                  aria-label="Rule zone"
                  value={form.zoneId}
                  onChange={(event) => {
                    const zoneId = event.target.value;
                    onFormChange((current) => ({
                      ...current,
                      zoneId,
                      deviceId: "",
                    }));
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                  disabled={!form.farmPlotId || zonesQuery.isLoading}
                >
                  <option value="">
                    {!form.farmPlotId
                      ? "Select farm first"
                      : zonesQuery.isLoading
                        ? "Loading zones..."
                        : "No zone scope"}
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
                  aria-label="Rule device"
                  value={form.deviceId}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      deviceId: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
                  disabled={devicesQuery.isLoading}
                >
                  <option value="">
                    {devicesQuery.isLoading
                      ? "Loading devices..."
                      : "No device scope"}
                  </option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.deviceName || device.deviceCode || compactId(device.id)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-amber-700">
              Sensor type
            </h4>
            <p className="mt-2 text-sm font-semibold text-amber-700">
              Alert rules require a real sensorTypeId UUID. The app can infer
              options only from existing readings. A complete picker requires a
              backend sensor type list endpoint.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-amber-700">
                  Inferred sensor type
                </span>
                <select
                  aria-label="Inferred sensor type"
                  value={hasSelectedSensorOption ? form.sensorTypeId : ""}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      sensorTypeId: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
                  disabled={sensorOptionsLoading || sensorOptions.length === 0}
                >
                  <option value="">
                    {sensorOptionsLoading
                      ? "Loading readings..."
                      : sensorOptions.length === 0
                        ? "No inferred sensor types"
                        : "Select sensor type"}
                  </option>
                  {sensorOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} ({option.code}
                      {option.unit ? `, ${option.unit}` : ""})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-amber-700">
                  Advanced sensorTypeId
                </span>
                <input
                  aria-label="Advanced sensorTypeId"
                  value={form.sensorTypeId}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      sensorTypeId: event.target.value,
                    }))
                  }
                  placeholder="Paste sensorTypeId UUID"
                  className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
                />
              </label>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Min threshold
              </span>
              <input
                aria-label="Min threshold"
                value={form.minThreshold}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    minThreshold: event.target.value,
                  }))
                }
                type="number"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Max threshold
              </span>
              <input
                aria-label="Max threshold"
                value={form.maxThreshold}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    maxThreshold: event.target.value,
                  }))
                }
                type="number"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Severity
              </span>
              <select
                aria-label="Severity"
                value={form.severity}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    severity: event.target.value as AlertSeverity,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              >
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as AlertSeverity[]).map(
                  (severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Cooldown minutes
              </span>
              <input
                aria-label="Cooldown minutes"
                value={form.cooldownMinutes}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    cooldownMinutes: event.target.value,
                  }))
                }
                type="number"
                min={0}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              ["notifyWeb", "Notify web"],
              ["notifyMobile", "Notify mobile"],
              ["enabled", "Enabled"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={Boolean(form[key as keyof RuleFormState])}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#245A34]"
                />
                {label}
              </label>
            ))}
          </div>

          {validationMessage ? (
            <p role="alert" className="text-sm font-bold text-red-600">
              {validationMessage}
            </p>
          ) : null}
          {requestFailed ? (
            <p role="alert" className="text-sm font-bold text-red-600">
              Alert rule request failed. Please check the values and try again.
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingRule
                  ? "Save rule"
                  : "Create rule"}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

export function AlertRulesPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>("all");
  const [filterSensorTypeId, setFilterSensorTypeId] = useState("");
  const [filterDeviceId, setFilterDeviceId] = useState("");
  const [filterZoneId, setFilterZoneId] = useState("");
  const [filterFarmPlotId, setFilterFarmPlotId] = useState("");
  const [editingRule, setEditingRule] = useState<AlertRuleResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<RuleFormState>(emptyRuleForm);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AlertRuleResponse | null>(null);

  const {
    farmPlots,
    zones,
    devices,
    farmPlotMap,
    zoneMap,
    deviceMap,
    plotsQuery,
    zonesQuery,
    devicesQuery,
  } = useAlertScopeOptions({
    farmPlotId: filterFarmPlotId,
    zoneId: filterZoneId,
  });
  const effectiveFilterDeviceId =
    devices.length > 0 &&
    filterDeviceId &&
    !devices.some((device) => device.id === filterDeviceId)
      ? ""
      : filterDeviceId;

  const params = useMemo<AlertRulesParams>(
    () => ({
      page,
      size,
      sortBy: "updatedAt",
      sortDir: "desc",
      enabled:
        enabledFilter === "all" ? undefined : enabledFilter === "true",
      sensorTypeId: filterSensorTypeId.trim() || undefined,
      deviceId: effectiveFilterDeviceId || undefined,
      zoneId: filterZoneId || undefined,
      farmPlotId: filterFarmPlotId || undefined,
    }),
    [
      enabledFilter,
      effectiveFilterDeviceId,
      filterFarmPlotId,
      filterSensorTypeId,
      filterZoneId,
      page,
      size,
    ],
  );

  const rulesQuery = useAlertRules(params);
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const updateEnabled = useUpdateAlertRuleEnabled();
  const deleteRule = useDeleteAlertRule();

  const pagedRules = rulesQuery.data;
  const rules = pagedRules?.items ?? [];
  const isSubmitting = createRule.isPending || updateRule.isPending;
  const ruleLookupFarmPlotId =
    filterFarmPlotId || rules.find((rule) => rule.farmPlotId)?.farmPlotId || "";
  const ruleZonesQuery = useFarmZones(ruleLookupFarmPlotId, !!ruleLookupFarmPlotId);
  const ruleZoneMap = useMemo(
    () =>
      new Map(
        [...zones, ...(ruleZonesQuery.data ?? [])].map((zone) => [
          zone.id,
          zone,
        ]),
      ),
    [ruleZonesQuery.data, zones],
  );

  const resetToFirstPage = () => setPage(0);

  const openCreateDialog = () => {
    setEditingRule(null);
    setForm(emptyRuleForm);
    setValidationMessage(null);
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingRule(null);
    setForm(emptyRuleForm);
    setValidationMessage(null);
  };

  const handleEdit = (rule: AlertRuleResponse) => {
    setEditingRule(rule);
    setForm(toFormState(rule));
    setValidationMessage(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload(form);
    const validationError = validatePayload(payload);
    setValidationMessage(validationError);
    if (validationError) return;

    try {
      if (editingRule) {
        await updateRule.mutateAsync({ ruleId: editingRule.id, payload });
      } else {
        await createRule.mutateAsync(payload);
      }

      closeDialog();
    } catch {
      // Mutation error state is rendered below the form.
    }
  };

  const handleToggleEnabled = async (rule: AlertRuleResponse) => {
    try {
      await updateEnabled.mutateAsync({
        ruleId: rule.id,
        enabled: rule.enabled === false,
      });
    } catch {
      // Mutation error state is surfaced by TanStack Query state.
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteRule.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Mutation error state is surfaced by TanStack Query state.
    }
  };

  const resolveFarmLabel = (farmPlotId: string | null) => {
    if (!farmPlotId) return "No farm";
    return farmPlotMap.get(farmPlotId)?.name || `Farm ${compactId(farmPlotId)}`;
  };

  const resolveZoneLabel = (zoneId: string | null) => {
    if (!zoneId) return "No zone";
    return (
      ruleZoneMap.get(zoneId)?.zoneName ||
      zoneMap.get(zoneId)?.zoneName ||
      `Zone ${compactId(zoneId)}`
    );
  };

  const resolveDeviceLabel = (deviceId: string | null) => {
    if (!deviceId) return "No device";
    const device = deviceMap.get(deviceId);
    return (
      device?.deviceName ||
      device?.deviceCode ||
      `Device ${compactId(deviceId)}`
    );
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Alert rules
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
            Manage collector alert rules with farm, zone, device, and sensor
            type context.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
        >
          <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
          New rule
        </button>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <select
            aria-label="Filter farm plot"
            value={filterFarmPlotId}
            onChange={(event) => {
              setFilterFarmPlotId(event.target.value);
              setFilterZoneId("");
              setFilterDeviceId("");
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
            disabled={plotsQuery.isLoading}
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

          <select
            aria-label="Filter zone"
            value={filterZoneId}
            onChange={(event) => {
              setFilterZoneId(event.target.value);
              setFilterDeviceId("");
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
            disabled={!filterFarmPlotId || zonesQuery.isLoading}
          >
            <option value="">
              {!filterFarmPlotId
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

          <select
            aria-label="Filter device"
            value={effectiveFilterDeviceId}
            onChange={(event) => {
              setFilterDeviceId(event.target.value);
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
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

          <input
            aria-label="Advanced filter sensorTypeId"
            value={filterSensorTypeId}
            onChange={(event) => {
              setFilterSensorTypeId(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Advanced sensorTypeId"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          />

          <select
            aria-label="Filter enabled"
            value={enabledFilter}
            onChange={(event) => {
              setEnabledFilter(event.target.value as EnabledFilter);
              resetToFirstPage();
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          >
            <option value="all">All states</option>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
          <select
            aria-label="Rule page size"
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

      {rulesQuery.isLoading ? (
        <div
          aria-label="Loading alert rules"
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

      {rulesQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-red-700">
                Alert rules could not be loaded
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                The collector returned an error for the current filters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void rulesQuery.refetch()}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {deleteRule.isError ? (
        <p role="alert" className="text-sm font-bold text-red-600">
          Alert rule delete failed. Please try again.
        </p>
      ) : null}

      {pagedRules && !rulesQuery.isError ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div>
              <p className="text-sm font-black text-slate-800">
                {formatNumber(pagedRules.totalItems)} alert rules
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Page {formatNumber(pagedRules.page + 1)} of{" "}
                {formatNumber(Math.max(pagedRules.totalPages, 1))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={!pagedRules.hasPrevious}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous alert rules page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!pagedRules.hasNext}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next alert rules page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </div>

          {rules.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-black text-slate-800">
                No alert rules
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                The backend returned an empty rule page for these filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left" aria-label="Alert rules">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Rule
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Threshold
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Severity
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      State
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Updated
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-black text-slate-800">
                          Sensor {compactId(rule.sensorTypeId)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {resolveDeviceLabel(rule.deviceId)} -{" "}
                          {resolveZoneLabel(rule.zoneId)} -{" "}
                          {resolveFarmLabel(rule.farmPlotId)}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-sm font-bold text-slate-600">
                        {rule.minThreshold ?? "-"} to {rule.maxThreshold ?? "-"}
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Cooldown {formatNumber(rule.cooldownMinutes)} min
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                            severityClasses[rule.severity]
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                            enabledClasses[String(rule.enabled !== false) as "true" | "false"]
                          }`}
                        >
                          {rule.enabled === false ? "DISABLED" : "ENABLED"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top text-sm font-bold text-slate-600">
                        {formatDateTime(rule.updatedAt)}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(rule)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                            aria-label={`Edit rule ${rule.id}`}
                          >
                            <Edit3 className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleEnabled(rule)}
                            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                          >
                            {rule.enabled === false ? "Enable" : "Disable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(rule)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-100 text-red-600 hover:bg-red-50"
                            aria-label={`Delete rule ${rule.id}`}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                          </button>
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

      {isFormOpen ? (
        <RuleFormDialog
          form={form}
          editingRule={editingRule}
          isSubmitting={isSubmitting}
          validationMessage={validationMessage}
          requestFailed={createRule.isError || updateRule.isError}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          onFormChange={setForm}
        />
      ) : null}

      {deleteTarget ? (
        <ModalShell
          onClose={() => setDeleteTarget(null)}
          title="Delete alert rule?"
          subtitle={
            <p className="mt-2 text-sm font-semibold text-slate-600">
              This will delete the rule for sensor{" "}
              {compactId(deleteTarget.sensorTypeId)}. Existing alert events may
              remain for history.
            </p>
          }
          maxWidth="max-w-md"
          backdropColor="bg-slate-950/40"
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteRule.isPending}
                className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteRule.isPending ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

export default AlertRulesPage;
