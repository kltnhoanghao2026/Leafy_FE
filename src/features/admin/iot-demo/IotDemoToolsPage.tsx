import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  History,
  Loader2,
  Play,
  RefreshCw,
  Server,
  Settings2,
  Square,
  TerminalSquare,
  ThermometerSun,
  XCircle,
} from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { useTranslation } from "../../../i18n";
import type { TFunction } from "../../../i18n/context";
import {
  getIotDemoBaseUrl,
  isIotDemoToolsEnabled,
  toIotDemoErrorPayload,
} from "./iotDemo.api";
import {
  useBootstrapFullMutation,
  useBootstrapMinimalMutation,
  useConfigAckFailureMutation,
  useConfigAckSuccessMutation,
  useTriggerHighTemperatureMutation,
  useTriggerLowSoilMoistureMutation,
  useSeedHistory7dMutation,
  useSeedHistory30dMutation,
  useSimulationStatusQuery,
  useStartSimulationMutation,
  useStopSimulationMutation,
} from "./iotDemo.queries";
import type {
  IotDemoActionResult,
  IotDemoJson,
  ConfigAckScenarioRequest,
  ScenarioRequest,
  SimulationStatusResponse,
} from "./iotDemo.types";

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ActionButton({
  children,
  isPending,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  isPending: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary:
      "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
  min,
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </label>
  );
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function buildScenarioPayload({
  deviceUid,
  count,
  targetValue,
}: {
  deviceUid: string;
  count: string;
  targetValue: string;
}): ScenarioRequest {
  return {
    deviceUid: deviceUid.trim(),
    ...(optionalNumber(count) != null && { count: optionalNumber(count) }),
    ...(optionalNumber(targetValue) != null && {
      targetValue: optionalNumber(targetValue),
    }),
  };
}

function validateScenarioPayload(payload: ScenarioRequest, t: TFunction) {
  if (!payload.deviceUid) return t("iot.demo.validationDeviceUidRequired");
  if (payload.count == null || Number.isNaN(payload.count) || payload.count <= 0) {
    return t("iot.demo.validationCountPositive");
  }
  if (payload.targetValue == null || Number.isNaN(payload.targetValue)) {
    return t("iot.demo.validationTargetNumber");
  }
  return null;
}

function validateConfigAckPayload(payload: ConfigAckScenarioRequest, t: TFunction) {
  if (!payload.deviceUid) return t("iot.demo.validationDeviceUidRequired");
  if (payload.configVersion != null && Number.isNaN(payload.configVersion)) {
    return t("iot.demo.validationConfigVersionNumber");
  }
  return null;
}

function formatJson(value: IotDemoJson | SimulationStatusResponse | null) {
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}

function isSimulationRunning(status: SimulationStatusResponse | undefined) {
  if (!status) return false;
  if (typeof status.running === "boolean") return status.running;
  if (typeof status.active === "boolean") return status.active;
  return status.status?.toLowerCase() === "running";
}

function SimulationStatusCard({
  status,
  isLoading,
  isError,
  isFetching,
  onRefresh,
}: {
  status: SimulationStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const running = isSimulationRunning(status);

  return (
    <SectionCard
      icon={<Gauge className="w-5 h-5" />}
      title={t("iot.demo.simulationStatus")}
      description={t("iot.demo.simulationStatusDescription")}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : isError ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : running ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
            <span className="text-sm font-semibold text-slate-800">
              {isLoading
                ? t("iot.demo.loading")
                : isError
                  ? t("iot.demo.unavailable")
                  : running
                    ? t("iot.demo.running")
                    : t("iot.demo.stopped")}
            </span>
          </div>
          <ActionButton
            isPending={isFetching}
            onClick={onRefresh}
            variant="secondary"
          >
            <RefreshCw className="w-4 h-4" />
            {t("iot.demo.refreshStatus")}
          </ActionButton>
        </div>

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {t("iot.demo.statusError")}
          </div>
        )}

        {status && (
          <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
            {formatJson(status)}
          </pre>
        )}
      </div>
    </SectionCard>
  );
}

function AlertAnomalyScenarios({
  highTemperaturePending,
  lowSoilMoisturePending,
  onHighTemperature,
  onLowSoilMoisture,
}: {
  highTemperaturePending: boolean;
  lowSoilMoisturePending: boolean;
  onHighTemperature: (payload: ScenarioRequest) => void;
  onLowSoilMoisture: (payload: ScenarioRequest) => void;
}) {
  const { t } = useTranslation();
  const [deviceUid, setDeviceUid] = useState("prod-minimal-device-1");
  const [count, setCount] = useState("5");
  const [highTemperatureTarget, setHighTemperatureTarget] = useState("44");
  const [lowSoilMoistureTarget, setLowSoilMoistureTarget] = useState("8");
  const [validationError, setValidationError] = useState<string | null>(null);

  function submit(target: "high-temperature" | "low-soil-moisture") {
    const payload = buildScenarioPayload({
      deviceUid,
      count,
      targetValue:
        target === "high-temperature"
          ? highTemperatureTarget
          : lowSoilMoistureTarget,
    });
    const error = validateScenarioPayload(payload, t);
    setValidationError(error);
    if (error) return;
    if (target === "high-temperature") {
      onHighTemperature(payload);
    } else {
      onLowSoilMoisture(payload);
    }
  }

  return (
    <SectionCard
      icon={<ThermometerSun className="w-5 h-5" />}
      title={t("iot.demo.alertScenarios")}
      description={t("iot.demo.alertScenariosDescription")}
    >
      <div className="space-y-4">
        <TextInput
          label={t("iot.demo.deviceUid")}
          value={deviceUid}
          onChange={setDeviceUid}
          placeholder="prod-minimal-device-1"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumberInput
            label={t("iot.demo.count")}
            value={count}
            onChange={setCount}
            min={1}
          />
          <NumberInput
            label={t("iot.demo.highTemperatureTarget")}
            value={highTemperatureTarget}
            onChange={setHighTemperatureTarget}
            step="0.1"
          />
          <NumberInput
            label={t("iot.demo.lowSoilMoistureTarget")}
            value={lowSoilMoistureTarget}
            onChange={setLowSoilMoistureTarget}
            step="0.1"
          />
        </div>
        {validationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {validationError}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <ActionButton
            isPending={highTemperaturePending}
            onClick={() => submit("high-temperature")}
          >
            {t("iot.demo.triggerHighTemperature")}
          </ActionButton>
          <ActionButton
            isPending={lowSoilMoisturePending}
            onClick={() => submit("low-soil-moisture")}
          >
            {t("iot.demo.triggerLowSoilMoisture")}
          </ActionButton>
        </div>
      </div>
    </SectionCard>
  );
}

function ConfigAckScenarios({
  successPending,
  failurePending,
  onSuccess,
  onFailure,
}: {
  successPending: boolean;
  failurePending: boolean;
  onSuccess: (payload: ConfigAckScenarioRequest) => void;
  onFailure: (payload: ConfigAckScenarioRequest) => void;
}) {
  const { t } = useTranslation();
  const [deviceUid, setDeviceUid] = useState("prod-minimal-device-1");
  const [configVersion, setConfigVersion] = useState("");
  const [error, setError] = useState(t("iot.demo.simulatedConfigFailure"));
  const [validationError, setValidationError] = useState<string | null>(null);

  function buildPayload(includeError: boolean): ConfigAckScenarioRequest {
    const version = optionalNumber(configVersion);
    return {
      deviceUid: deviceUid.trim(),
      ...(version != null && { configVersion: version }),
      ...(includeError && error.trim() && { error: error.trim() }),
    };
  }

  function submit(kind: "success" | "failure") {
    const payload = buildPayload(kind === "failure");
    const validation = validateConfigAckPayload(payload, t);
    setValidationError(validation);
    if (validation) return;
    if (kind === "success") onSuccess(payload);
    else onFailure(payload);
  }

  return (
    <SectionCard
      icon={<Settings2 className="w-5 h-5" />}
      title={t("iot.demo.configAckScenarios")}
      description={t("iot.demo.configAckScenariosDescription")}
    >
      <div className="space-y-4">
        <TextInput
          label={t("iot.demo.deviceUid")}
          value={deviceUid}
          onChange={setDeviceUid}
          placeholder="prod-minimal-device-1"
        />
        <NumberInput
          label={t("iot.demo.configVersion")}
          value={configVersion}
          onChange={setConfigVersion}
          min={1}
          placeholder={t("iot.demo.configVersionPlaceholder")}
        />
        <TextInput
          label={t("iot.demo.error")}
          value={error}
          onChange={setError}
          placeholder={t("iot.demo.simulatedConfigFailure")}
        />
        {validationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {validationError}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <ActionButton isPending={successPending} onClick={() => submit("success")}>
            {t("iot.demo.sendAckSuccess")}
          </ActionButton>
          <ActionButton
            isPending={failurePending}
            onClick={() => submit("failure")}
            variant="danger"
          >
            {t("iot.demo.sendAckFailure")}
          </ActionButton>
        </div>
      </div>
    </SectionCard>
  );
}

export function IotDemoToolsPage() {
  const { t } = useTranslation();
  const [latestResult, setLatestResult] = useState<IotDemoActionResult | null>(
    null,
  );
  const simulationStatus = useSimulationStatusQuery();
  const bootstrapMinimal = useBootstrapMinimalMutation();
  const bootstrapFull = useBootstrapFullMutation();
  const seedHistory7d = useSeedHistory7dMutation();
  const seedHistory30d = useSeedHistory30dMutation();
  const startSimulation = useStartSimulationMutation();
  const stopSimulation = useStopSimulationMutation();
  const highTemperatureScenario = useTriggerHighTemperatureMutation();
  const lowSoilMoistureScenario = useTriggerLowSoilMoistureMutation();
  const configAckSuccess = useConfigAckSuccessMutation();
  const configAckFailure = useConfigAckFailureMutation();

  async function runAction(title: string, action: () => Promise<IotDemoJson>) {
    try {
      const data = await action();
      setLatestResult({ ok: true, title, data });
    } catch (error) {
      setLatestResult({
        ok: false,
        title,
        data: toIotDemoErrorPayload(error),
      });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">
          {t("iot.demo.title")}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t("iot.demo.description")}
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">{t("iot.demo.warningTitle")}</p>
            <p className="mt-1">
              {t("iot.demo.warningDescription")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionCard
          icon={<Server className="w-5 h-5" />}
          title={t("iot.demo.serviceConfig")}
          description={t("iot.demo.serviceConfigDescription")}
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">{t("iot.demo.baseUrl")}</span>
              <span className="font-mono text-xs font-semibold text-slate-800">
                {getIotDemoBaseUrl()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">{t("iot.demo.featureFlag")}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isIotDemoToolsEnabled()
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isIotDemoToolsEnabled() ? t("iot.demo.enabled") : t("iot.demo.disabled")}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {t("iot.demo.proxyHelp")}
            </div>
          </div>
        </SectionCard>

        <SimulationStatusCard
          status={simulationStatus.data}
          isLoading={simulationStatus.isLoading}
          isError={simulationStatus.isError}
          isFetching={simulationStatus.isFetching}
          onRefresh={() => void simulationStatus.refetch()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard
          icon={<Database className="w-5 h-5" />}
          title={t("iot.demo.bootstrapActions")}
          description={t("iot.demo.bootstrapActionsDescription")}
        >
          <div className="flex flex-wrap gap-2">
            <ActionButton
              isPending={bootstrapMinimal.isPending}
              onClick={() =>
                void runAction(t("iot.demo.bootstrapMinimalResult"), () =>
                  bootstrapMinimal.mutateAsync(),
                )
              }
            >
              {t("iot.demo.bootstrapMinimal")}
            </ActionButton>
            <ActionButton
              isPending={bootstrapFull.isPending}
              onClick={() =>
                void runAction(t("iot.demo.bootstrapFullResult"), () =>
                  bootstrapFull.mutateAsync(),
                )
              }
            >
              {t("iot.demo.bootstrapFull")}
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard
          icon={<History className="w-5 h-5" />}
          title={t("iot.demo.historyActions")}
          description={t("iot.demo.historyActionsDescription")}
        >
          <div className="flex flex-wrap gap-2">
            <ActionButton
              isPending={seedHistory7d.isPending}
              onClick={() =>
                void runAction(t("iot.demo.seedLast7Days"), () =>
                  seedHistory7d.mutateAsync(),
                )
              }
            >
              {t("iot.demo.seedLast7Days")}
            </ActionButton>
            <ActionButton
              isPending={seedHistory30d.isPending}
              onClick={() =>
                void runAction(t("iot.demo.seedLast30Days"), () =>
                  seedHistory30d.mutateAsync(),
                )
              }
            >
              {t("iot.demo.seedLast30Days")}
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard
          icon={<Play className="w-5 h-5" />}
          title={t("iot.demo.simulationControls")}
          description={t("iot.demo.simulationControlsDescription")}
        >
          <div className="flex flex-wrap gap-2">
            <ActionButton
              isPending={startSimulation.isPending}
              onClick={() =>
                void runAction(t("iot.demo.actionStartSimulation"), () =>
                  startSimulation.mutateAsync(),
                )
              }
            >
              <Play className="w-4 h-4" />
              {t("iot.demo.startSimulation")}
            </ActionButton>
            <ActionButton
              isPending={stopSimulation.isPending}
              onClick={() =>
                void runAction(t("iot.demo.actionStopSimulation"), () =>
                  stopSimulation.mutateAsync(),
                )
              }
              variant="danger"
            >
              <Square className="w-4 h-4" />
              {t("iot.demo.stopSimulation")}
            </ActionButton>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AlertAnomalyScenarios
          highTemperaturePending={highTemperatureScenario.isPending}
          lowSoilMoisturePending={lowSoilMoistureScenario.isPending}
          onHighTemperature={(payload) =>
            void runAction(t("iot.demo.actionHighTemperature"), () =>
              highTemperatureScenario.mutateAsync(payload),
            )
          }
          onLowSoilMoisture={(payload) =>
            void runAction(t("iot.demo.actionLowSoilMoisture"), () =>
              lowSoilMoistureScenario.mutateAsync(payload),
            )
          }
        />
        <ConfigAckScenarios
          successPending={configAckSuccess.isPending}
          failurePending={configAckFailure.isPending}
          onSuccess={(payload) =>
            void runAction(t("iot.demo.actionConfigAckSuccess"), () =>
              configAckSuccess.mutateAsync(payload),
            )
          }
          onFailure={(payload) =>
            void runAction(t("iot.demo.actionConfigAckFailure"), () =>
              configAckFailure.mutateAsync(payload),
            )
          }
        />
      </div>

      <SectionCard
        icon={<TerminalSquare className="w-5 h-5" />}
        title={t("iot.demo.latestResponse")}
        description={t("iot.demo.latestResponseDescription")}
      >
        {latestResult ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {latestResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-bold text-slate-800">
                {latestResult.title}
              </span>
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
              {formatJson(latestResult.data)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t("iot.demo.noActionRun")}</p>
        )}
      </SectionCard>

      <SectionCard
        icon={<RefreshCw className="w-5 h-5" />}
        title={t("iot.demo.quickLinks")}
        description={t("iot.demo.quickLinksDescription")}
      >
        <div className="flex flex-wrap gap-2">
          <Link
            to={ROUTES.DASHBOARD.ROOT}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t("iot.demo.dashboard")}
          </Link>
          <Link
            to={ROUTES.DASHBOARD.DEVICE_ONBOARDING}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t("iot.demo.deviceOnboarding")}
          </Link>
          <Link
            to={ROUTES.DASHBOARD.ALERTS}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t("iot.demo.alertCenter")}
          </Link>
          <Link
            to={ROUTES.DASHBOARD.ALERT_RULES}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t("iot.demo.alertRules")}
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
