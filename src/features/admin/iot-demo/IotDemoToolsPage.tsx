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

function validateScenarioPayload(payload: ScenarioRequest) {
  if (!payload.deviceUid) return "Device UID is required.";
  if (payload.count == null || Number.isNaN(payload.count) || payload.count <= 0) {
    return "Count must be greater than 0.";
  }
  if (payload.targetValue == null || Number.isNaN(payload.targetValue)) {
    return "Target value must be a number.";
  }
  return null;
}

function validateConfigAckPayload(payload: ConfigAckScenarioRequest) {
  if (!payload.deviceUid) return "Device UID is required.";
  if (payload.configVersion != null && Number.isNaN(payload.configVersion)) {
    return "Config version must be a number.";
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
  const running = isSimulationRunning(status);

  return (
    <SectionCard
      icon={<Gauge className="w-5 h-5" />}
      title="Simulation status"
      description="Current live simulation state from iot-test-data-service"
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
                ? "Loading"
                : isError
                  ? "Unavailable"
                  : running
                    ? "Running"
                    : "Stopped"}
            </span>
          </div>
          <ActionButton
            isPending={isFetching}
            onClick={onRefresh}
            variant="secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh status
          </ActionButton>
        </div>

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            Could not load simulation status.
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
    const error = validateScenarioPayload(payload);
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
      title="Alert anomaly scenarios"
      description="Use after Bootstrap minimal/full. Default device UID works for minimal seed."
    >
      <div className="space-y-4">
        <TextInput
          label="Device UID"
          value={deviceUid}
          onChange={setDeviceUid}
          placeholder="prod-minimal-device-1"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumberInput
            label="Count"
            value={count}
            onChange={setCount}
            min={1}
          />
          <NumberInput
            label="High temperature target"
            value={highTemperatureTarget}
            onChange={setHighTemperatureTarget}
            step="0.1"
          />
          <NumberInput
            label="Low soil moisture target"
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
            Trigger high temperature
          </ActionButton>
          <ActionButton
            isPending={lowSoilMoisturePending}
            onClick={() => submit("low-soil-moisture")}
          >
            Trigger low soil moisture
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
  const [deviceUid, setDeviceUid] = useState("prod-minimal-device-1");
  const [configVersion, setConfigVersion] = useState("");
  const [error, setError] = useState("Simulated config apply failure");
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
    const validation = validateConfigAckPayload(payload);
    setValidationError(validation);
    if (validation) return;
    if (kind === "success") onSuccess(payload);
    else onFailure(payload);
  }

  return (
    <SectionCard
      icon={<Settings2 className="w-5 h-5" />}
      title="Config ACK scenarios"
      description="Use after triggering config push from collector/device config page."
    >
      <div className="space-y-4">
        <TextInput
          label="Device UID"
          value={deviceUid}
          onChange={setDeviceUid}
          placeholder="prod-minimal-device-1"
        />
        <NumberInput
          label="Config version"
          value={configVersion}
          onChange={setConfigVersion}
          min={1}
          placeholder="Leave blank to let backend/test service use current/default version"
        />
        <TextInput
          label="Error"
          value={error}
          onChange={setError}
          placeholder="Simulated config apply failure"
        />
        {validationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {validationError}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <ActionButton isPending={successPending} onClick={() => submit("success")}>
            Send ACK success
          </ActionButton>
          <ActionButton
            isPending={failurePending}
            onClick={() => submit("failure")}
            variant="danger"
          >
            Send ACK failure
          </ActionButton>
        </div>
      </div>
    </SectionCard>
  );
}

export function IotDemoToolsPage() {
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
          IoT Demo Tools
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Trigger iot-test-data-service seed and simulation endpoints.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">Dev/admin-only tool</p>
            <p className="mt-1">
              This calls iot-test-data-service directly. Actions mutate IoT demo
              data. Do not enable in production.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionCard
          icon={<Server className="w-5 h-5" />}
          title="Service config"
          description="Direct connection settings for the test-data service"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Base URL</span>
              <span className="font-mono text-xs font-semibold text-slate-800">
                {getIotDemoBaseUrl()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Feature flag</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isIotDemoToolsEnabled()
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isIotDemoToolsEnabled() ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Local dev uses the Vite proxy path /iot-test-data to avoid browser
              CORS. The proxy target should point to iot-test-data-service on
              localhost:8099.
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
          title="Bootstrap actions"
          description="Create the baseline IoT demo dataset"
        >
          <div className="flex flex-wrap gap-2">
            <ActionButton
              isPending={bootstrapMinimal.isPending}
              onClick={() =>
                void runAction("Bootstrap minimal", () =>
                  bootstrapMinimal.mutateAsync(),
                )
              }
            >
              Bootstrap minimal
            </ActionButton>
            <ActionButton
              isPending={bootstrapFull.isPending}
              onClick={() =>
                void runAction("Bootstrap full", () =>
                  bootstrapFull.mutateAsync(),
                )
              }
            >
              Bootstrap full
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard
          icon={<History className="w-5 h-5" />}
          title="Historical seed actions"
          description="Backfill telemetry history for dashboard and charts"
        >
          <div className="flex flex-wrap gap-2">
            <ActionButton
              isPending={seedHistory7d.isPending}
              onClick={() =>
                void runAction("Seed last 7 days", () =>
                  seedHistory7d.mutateAsync(),
                )
              }
            >
              Seed last 7 days
            </ActionButton>
            <ActionButton
              isPending={seedHistory30d.isPending}
              onClick={() =>
                void runAction("Seed last 30 days", () =>
                  seedHistory30d.mutateAsync(),
                )
              }
            >
              Seed last 30 days
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard
          icon={<Play className="w-5 h-5" />}
          title="Simulation controls"
          description="Start or stop live telemetry simulation"
        >
          <div className="flex flex-wrap gap-2">
            <ActionButton
              isPending={startSimulation.isPending}
              onClick={() =>
                void runAction("Start simulation", () =>
                  startSimulation.mutateAsync(),
                )
              }
            >
              <Play className="w-4 h-4" />
              Start simulation
            </ActionButton>
            <ActionButton
              isPending={stopSimulation.isPending}
              onClick={() =>
                void runAction("Stop simulation", () =>
                  stopSimulation.mutateAsync(),
                )
              }
              variant="danger"
            >
              <Square className="w-4 h-4" />
              Stop simulation
            </ActionButton>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AlertAnomalyScenarios
          highTemperaturePending={highTemperatureScenario.isPending}
          lowSoilMoisturePending={lowSoilMoistureScenario.isPending}
          onHighTemperature={(payload) =>
            void runAction("High temperature anomaly", () =>
              highTemperatureScenario.mutateAsync(payload),
            )
          }
          onLowSoilMoisture={(payload) =>
            void runAction("Low soil moisture anomaly", () =>
              lowSoilMoistureScenario.mutateAsync(payload),
            )
          }
        />
        <ConfigAckScenarios
          successPending={configAckSuccess.isPending}
          failurePending={configAckFailure.isPending}
          onSuccess={(payload) =>
            void runAction("Config ACK success", () =>
              configAckSuccess.mutateAsync(payload),
            )
          }
          onFailure={(payload) =>
            void runAction("Config ACK failure", () =>
              configAckFailure.mutateAsync(payload),
            )
          }
        />
      </div>

      <SectionCard
        icon={<TerminalSquare className="w-5 h-5" />}
        title="Latest response"
        description="Last action response or error payload"
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
          <p className="text-sm text-slate-500">No action has run yet.</p>
        )}
      </SectionCard>

      <SectionCard
        icon={<RefreshCw className="w-5 h-5" />}
        title="Quick links"
        description="Open the main IoT screens used to verify demo data"
      >
        <div className="flex flex-wrap gap-2">
          <Link
            to={ROUTES.DASHBOARD.ROOT}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <Link
            to={ROUTES.DASHBOARD.DEVICE_ONBOARDING}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Device onboarding
          </Link>
          <Link
            to={ROUTES.DASHBOARD.ALERTS}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Alert Center
          </Link>
          <Link
            to={ROUTES.DASHBOARD.ALERT_RULES}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Alert Rules
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
