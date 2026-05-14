import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
  X,
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
import { formatDateTime, formatNumber } from "../../metrics-view/utils/format";
import { Select } from "../../../components/ui/Select";
import { useTranslation } from "../../../i18n";
import type { TFunction } from "../../../i18n/context";
import { formatSeverityLabel } from "../../iot/utils/iotTranslation";
import {
  alertSeverityClasses,
} from "../../alerts/utils/alertLabels";

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

const validatePayload = (
  payload: CreateAlertRuleRequest,
  t: TFunction,
): string | null => {
  if (!payload.sensorTypeId) return t("iot.alertRules.validation.sensorTypeRequired");
  if (payload.minThreshold == null && payload.maxThreshold == null) {
    return t("iot.alertRules.validation.thresholdRequired");
  }
  if (
    payload.minThreshold != null &&
    payload.maxThreshold != null &&
    payload.minThreshold >= payload.maxThreshold
  ) {
    return t("iot.alertRules.validation.minLessThanMax");
  }
  if (!payload.deviceId && !payload.zoneId && !payload.farmPlotId) {
    return t("iot.alertRules.validation.scopeRequired");
  }
  if (
    payload.cooldownMinutes !== null &&
    payload.cooldownMinutes !== undefined &&
    payload.cooldownMinutes < 0
  ) {
    return t("iot.alertRules.validation.cooldownInvalid");
  }

  return null;
};

const readableRuleThreshold = (
  t: TFunction,
  minThreshold?: number | null,
  maxThreshold?: number | null,
) => {
  if (minThreshold !== null && minThreshold !== undefined && maxThreshold !== null && maxThreshold !== undefined) {
    return t("iot.alertRules.threshold.outsideRange")(
      formatNumber(minThreshold),
      formatNumber(maxThreshold),
    );
  }

  if (maxThreshold !== null && maxThreshold !== undefined) {
    return t("iot.alertRules.threshold.higherThan")(formatNumber(maxThreshold));
  }

  if (minThreshold !== null && minThreshold !== undefined) {
    return t("iot.alertRules.threshold.lowerThan")(formatNumber(minThreshold));
  }

  return t("iot.alertRules.threshold.unset");
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
  const { t } = useTranslation();
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
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[22px] font-black text-slate-900">
              {editingRule
                ? t("iot.alertRules.form.editTitle")
                : t("iot.alertRules.form.createTitle")}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {t("iot.alertRules.form.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label={t("iot.alertRules.form.closeDialog")}
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">
              {t("iot.alertRules.form.scopeSection")}
            </h4>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("iot.alertRules.form.farmPlot")}
                </span>
                <Select
                  ariaLabel="Rule farm plot"
                  value={form.farmPlotId}
                  onChange={(value) => {
                    const farmPlotId = String(value);
                    onFormChange((current) => ({
                      ...current,
                      farmPlotId,
                      zoneId: "",
                      deviceId: "",
                    }));
                  }}
                  options={[
                    {
                      value: "",
                      label: plotsQuery.isLoading
                        ? t("iot.alertRules.filters.loadingFarmPlots")
                        : t("iot.alertRules.form.noFarmLimit"),
                    },
                    ...farmPlots.map((plot) => ({ value: plot.id, label: plot.name })),
                  ]}
                  className="mt-2"
                  disabled={plotsQuery.isLoading}
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("iot.alertRules.form.zone")}
                </span>
                <Select
                  ariaLabel="Rule zone"
                  value={form.zoneId}
                  onChange={(value) => {
                    const zoneId = String(value);
                    onFormChange((current) => ({
                      ...current,
                      zoneId,
                      deviceId: "",
                    }));
                  }}
                  options={[
                    {
                      value: "",
                      label: !form.farmPlotId
                        ? t("iot.alertRules.filters.selectFarmFirst")
                        : zonesQuery.isLoading
                          ? t("iot.alertRules.filters.loadingZones")
                          : t("iot.alertRules.form.noZoneLimit"),
                    },
                    ...zones.map((zone) => ({ value: zone.id, label: zone.zoneName })),
                  ]}
                  className="mt-2"
                  disabled={!form.farmPlotId || zonesQuery.isLoading}
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("iot.alertRules.form.device")}
                </span>
                <Select
                  ariaLabel="Rule device"
                  value={form.deviceId}
                  onChange={(value) =>
                    onFormChange((current) => ({
                      ...current,
                      deviceId: String(value),
                    }))
                  }
                  options={[
                    {
                      value: "",
                      label: devicesQuery.isLoading
                        ? t("iot.alertRules.filters.loadingDevices")
                        : t("iot.alertRules.form.noDeviceLimit"),
                    },
                    ...devices.map((device) => ({
                      value: device.id,
                      label: device.deviceName || device.deviceCode || t("iot.alertRules.scope.unnamedDevice"),
                    })),
                  ]}
                  className="mt-2"
                  disabled={devicesQuery.isLoading}
                />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-amber-700">
              {t("iot.alertRules.form.sensorSection")}
            </h4>
            <p className="mt-2 text-sm font-semibold text-amber-700">
              {t("iot.alertRules.form.sensorHelp")}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-amber-700">
                  {t("iot.alertRules.form.inferredSensorType")}
                </span>
                <Select
                  ariaLabel="Inferred sensor type"
                  value={hasSelectedSensorOption ? form.sensorTypeId : ""}
                  onChange={(value) =>
                    onFormChange((current) => ({
                      ...current,
                      sensorTypeId: String(value),
                    }))
                  }
                  options={[
                    {
                      value: "",
                      label: sensorOptionsLoading
                        ? t("iot.alertRules.form.loadingReadings")
                        : sensorOptions.length === 0
                          ? t("iot.alertRules.form.noInferredSensors")
                          : t("iot.alertRules.form.chooseSensorType"),
                    },
                    ...sensorOptions.map((option) => ({
                      value: option.id,
                      label: `${option.name} (${option.code}${
                        option.unit ? `, ${option.unit}` : ""
                      })`,
                    })),
                  ]}
                  className="mt-2"
                  disabled={sensorOptionsLoading || sensorOptions.length === 0}
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-amber-700">
                  {t("iot.alertRules.form.advancedSensorTypeId")}
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
                  placeholder={t("iot.alertRules.form.sensorTypePlaceholder")}
                  className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
                />
              </label>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t("iot.alertRules.form.minThreshold")}
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
                {t("iot.alertRules.form.maxThreshold")}
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
                {t("iot.alertRules.form.severity")}
              </span>
              <Select
                ariaLabel="Severity"
                value={form.severity}
                onChange={(value) =>
                  onFormChange((current) => ({
                    ...current,
                    severity: value as AlertSeverity,
                  }))
                }
                options={(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as AlertSeverity[]).map(
                  (severity) => ({ value: severity, label: formatSeverityLabel(t, severity) }),
                )}
                className="mt-2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t("iot.alertRules.form.cooldownMinutes")}
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
              ["notifyWeb", t("iot.alertRules.form.notifyWeb")],
              ["notifyMobile", t("iot.alertRules.form.notifyMobile")],
              ["enabled", t("iot.alertRules.form.enabled")],
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
              {t("iot.alertRules.form.requestFailed")}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              {t("iot.alertRules.actions.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? t("iot.alertRules.actions.saving")
                : editingRule
                  ? t("iot.alertRules.actions.save")
                  : t("iot.alertRules.actions.create")}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

export function AlertRulesPage() {
  const { t } = useTranslation();
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
    const validationError = validatePayload(payload, t);
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
    if (!farmPlotId) return t("iot.alertRules.form.noFarmLimit");
    return farmPlotMap.get(farmPlotId)?.name || t("iot.alertRules.scope.missingFarm");
  };

  const resolveZoneLabel = (zoneId: string | null) => {
    if (!zoneId) return t("iot.alertRules.form.noZoneLimit");
    return (
      ruleZoneMap.get(zoneId)?.zoneName ||
      zoneMap.get(zoneId)?.zoneName ||
      t("iot.alertRules.scope.missingZone")
    );
  };

  const resolveDeviceLabel = (deviceId: string | null) => {
    if (!deviceId) return t("iot.alertRules.form.noDeviceLimit");
    const device = deviceMap.get(deviceId);
    return (
      device?.deviceName ||
      device?.deviceCode ||
      t("iot.alertRules.scope.missingDevice")
    );
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
            {t("iot.alertRules.title")}
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
            {t("iot.alertRules.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
        >
          <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {t("iot.alertRules.actions.create")}
        </button>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <Select
            ariaLabel="Filter farm plot"
            value={filterFarmPlotId}
            onChange={(value) => {
              setFilterFarmPlotId(String(value));
              setFilterZoneId("");
              setFilterDeviceId("");
              resetToFirstPage();
            }}
            options={[
              {
                value: "",
                label: plotsQuery.isLoading
                  ? t("iot.alertRules.filters.loadingFarmPlots")
                  : t("iot.alertRules.filters.allFarmPlots"),
              },
              ...farmPlots.map((plot) => ({ value: plot.id, label: plot.name })),
            ]}
            disabled={plotsQuery.isLoading}
          />

          <Select
            ariaLabel="Filter zone"
            value={filterZoneId}
            onChange={(value) => {
              setFilterZoneId(String(value));
              setFilterDeviceId("");
              resetToFirstPage();
            }}
            options={[
              {
                value: "",
                label: !filterFarmPlotId
                  ? t("iot.alertRules.filters.selectFarmFirst")
                  : zonesQuery.isLoading
                    ? t("iot.alertRules.filters.loadingZones")
                    : t("iot.alertRules.filters.allZones"),
              },
              ...zones.map((zone) => ({ value: zone.id, label: zone.zoneName })),
            ]}
            disabled={!filterFarmPlotId || zonesQuery.isLoading}
          />

          <Select
            ariaLabel="Filter device"
            value={effectiveFilterDeviceId}
            onChange={(value) => {
              setFilterDeviceId(String(value));
              resetToFirstPage();
            }}
            options={[
              {
                value: "",
                label: devicesQuery.isLoading
                  ? t("iot.alertRules.filters.loadingDevices")
                  : t("iot.alertRules.filters.allDevices"),
              },
              ...devices.map((device) => ({
                value: device.id,
                label: device.deviceName || device.deviceCode || t("iot.alertRules.scope.unnamedDevice"),
              })),
            ]}
            disabled={devicesQuery.isLoading}
          />

          <input
            aria-label="Advanced filter sensorTypeId"
            value={filterSensorTypeId}
            onChange={(event) => {
              setFilterSensorTypeId(event.target.value);
              resetToFirstPage();
            }}
            placeholder={t("iot.alertRules.filters.sensorTypePlaceholder")}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#245A34]"
          />

          <Select
            ariaLabel="Filter enabled"
            value={enabledFilter}
            onChange={(value) => {
              setEnabledFilter(value as EnabledFilter);
              resetToFirstPage();
            }}
            options={[
              { value: "all", label: t("iot.alertRules.filters.allStatuses") },
              { value: "true", label: t("iot.alertRules.filters.enabledOnly") },
              { value: "false", label: t("iot.alertRules.filters.disabledOnly") },
            ]}
          />
          <Select
            ariaLabel="Rule page size"
            value={size}
            onChange={(value) => {
              setSize(Number(value));
              resetToFirstPage();
            }}
            options={[10, 20, 50].map((option) => ({
              value: option,
              label: `${option} / page`,
            }))}
          />
        </div>
      </section>

      {rulesQuery.isLoading ? (
        <div
          aria-label={t("iot.alertRules.states.loading")}
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
                {t("iot.alertRules.states.error")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                {t("iot.alertRules.states.errorDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void rulesQuery.refetch()}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {t("iot.common.retry")}
            </button>
          </div>
        </div>
      ) : null}

      {deleteRule.isError ? (
        <p role="alert" className="text-sm font-bold text-red-600">
          {t("iot.alertRules.states.deleteError")}
        </p>
      ) : null}

      {pagedRules && !rulesQuery.isError ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div>
              <p className="text-sm font-black text-slate-800">
                {t("iot.alertRules.count")(pagedRules.totalItems)}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {t("iot.alertRules.page")(
                  pagedRules.page + 1,
                  Math.max(pagedRules.totalPages, 1),
                )}
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
                {t("iot.alertRules.states.empty")}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {t("iot.alertRules.states.emptyDescription")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left" aria-label="Alert rules">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alertRules.table.rule")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alertRules.table.condition")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alertRules.table.severity")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alertRules.table.status")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alertRules.table.updatedAt")}
                    </th>
                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("iot.alertRules.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-black text-slate-800">
                          {t("iot.alertRules.table.configuredSensor")}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {resolveDeviceLabel(rule.deviceId)} -{" "}
                          {resolveZoneLabel(rule.zoneId)} -{" "}
                          {resolveFarmLabel(rule.farmPlotId)}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-sm font-bold text-slate-600">
                        {readableRuleThreshold(t, rule.minThreshold, rule.maxThreshold)}
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {t("iot.alertRules.table.cooldownAfterAlert")(
                            formatNumber(rule.cooldownMinutes),
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                            alertSeverityClasses[rule.severity]
                          }`}
                        >
                          {formatSeverityLabel(t, rule.severity)}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                            enabledClasses[String(rule.enabled !== false) as "true" | "false"]
                          }`}
                        >
                          {rule.enabled === false
                            ? t("iot.alertRules.filters.disabledOnly")
                            : t("iot.alertRules.filters.enabledOnly")}
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
                            {rule.enabled === false
                              ? t("iot.alertRules.actions.enable")
                              : t("iot.alertRules.actions.disable")}
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
<<<<<<< HEAD
        <ModalShell
          onClose={() => setDeleteTarget(null)}
          title="Delete alert rule?"
          subtitle={
=======
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">
              {t("iot.alertRules.deleteDialog.title")}
            </h3>
>>>>>>> fb4fe6f67d668c78e6d98d5f490b055a14e52a1c
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {t("iot.alertRules.deleteDialog.description")}
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
                {t("iot.alertRules.deleteDialog.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteRule.isPending}
                className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteRule.isPending
                  ? t("iot.alertRules.actions.deleting")
                  : t("iot.alertRules.deleteDialog.confirm")}
              </button>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

export default AlertRulesPage;
