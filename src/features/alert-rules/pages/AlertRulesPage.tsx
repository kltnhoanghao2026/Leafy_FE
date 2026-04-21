import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
  useUpdateAlertRule,
  useUpdateAlertRuleEnabled,
} from "../queries";
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
  if (
    payload.minThreshold == null &&
    payload.maxThreshold == null
  ) {
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
    return "At least one scope ID is required.";
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

export function AlertRulesPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>("all");
  const [sensorTypeId, setSensorTypeId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [farmPlotId, setFarmPlotId] = useState("");
  const [editingRule, setEditingRule] = useState<AlertRuleResponse | null>(null);
  const [form, setForm] = useState<RuleFormState>(emptyRuleForm);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const params = useMemo<AlertRulesParams>(
    () => ({
      page,
      size,
      sortBy: "updatedAt",
      sortDir: "desc",
      enabled:
        enabledFilter === "all" ? undefined : enabledFilter === "true",
      sensorTypeId: sensorTypeId.trim() || undefined,
      deviceId: deviceId.trim() || undefined,
      zoneId: zoneId.trim() || undefined,
      farmPlotId: farmPlotId.trim() || undefined,
    }),
    [deviceId, enabledFilter, farmPlotId, page, sensorTypeId, size, zoneId],
  );

  const rulesQuery = useAlertRules(params);
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const updateEnabled = useUpdateAlertRuleEnabled();
  const deleteRule = useDeleteAlertRule();

  const pagedRules = rulesQuery.data;
  const rules = pagedRules?.items ?? [];
  const isSubmitting = createRule.isPending || updateRule.isPending;

  const resetToFirstPage = () => setPage(0);

  const resetForm = () => {
    setEditingRule(null);
    setForm(emptyRuleForm);
    setValidationMessage(null);
  };

  const handleEdit = (rule: AlertRuleResponse) => {
    setEditingRule(rule);
    setForm(toFormState(rule));
    setValidationMessage(null);
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

      resetForm();
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

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteRule.mutateAsync(ruleId);
    } catch {
      // Mutation error state is surfaced by TanStack Query state.
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Alert rules
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
            Manage collector alert rules for sensor thresholds and notification
            delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
        >
          <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
          New rule
        </button>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <input
            aria-label="Filter sensor type ID"
            value={sensorTypeId}
            onChange={(event) => {
              setSensorTypeId(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Sensor type ID"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          />
          <input
            aria-label="Filter device ID"
            value={deviceId}
            onChange={(event) => {
              setDeviceId(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Device ID"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          />
          <input
            aria-label="Filter zone ID"
            value={zoneId}
            onChange={(event) => {
              setZoneId(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Zone ID"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          />
          <input
            aria-label="Filter farm plot ID"
            value={farmPlotId}
            onChange={(event) => {
              setFarmPlotId(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Farm plot ID"
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

      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
              {editingRule ? "Edit alert rule" : "Create alert rule"}
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              Provide a sensor type and at least one target scope.
            </p>
          </div>
          {editingRule ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Sensor type ID
              </span>
              <input
                value={form.sensorTypeId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sensorTypeId: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Device ID
              </span>
              <input
                value={form.deviceId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deviceId: event.target.value,
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
                value={form.zoneId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    zoneId: event.target.value,
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
                value={form.farmPlotId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    farmPlotId: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Min threshold
              </span>
              <input
                value={form.minThreshold}
                onChange={(event) =>
                  setForm((current) => ({
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
                value={form.maxThreshold}
                onChange={(event) =>
                  setForm((current) => ({
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
                value={form.severity}
                onChange={(event) =>
                  setForm((current) => ({
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
                value={form.cooldownMinutes}
                onChange={(event) =>
                  setForm((current) => ({
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
                    setForm((current) => ({
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
          {createRule.isError || updateRule.isError ? (
            <p role="alert" className="text-sm font-bold text-red-600">
              Alert rule request failed. Please check the values and try again.
            </p>
          ) : null}

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
        </form>
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
                          Device {compactId(rule.deviceId)} - Zone{" "}
                          {compactId(rule.zoneId)} - Farm{" "}
                          {compactId(rule.farmPlotId)}
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
                            onClick={() => void handleDelete(rule.id)}
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
    </div>
  );
}

export default AlertRulesPage;
