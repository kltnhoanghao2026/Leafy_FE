import axios, { AxiosError } from "axios";
import type {
  ConfigAckScenarioRequest,
  IotDemoJson,
  ScenarioRequest,
  SimulationStatusResponse,
} from "./iotDemo.types";

export const isIotDemoToolsEnabled = () =>
  import.meta.env.VITE_ENABLE_IOT_DEMO_TOOLS === "true";

export const getIotDemoBaseUrl = () =>
  import.meta.env.VITE_IOT_TEST_DATA_BASE_URL || "/iot-test-data";

const iotDemoClient = axios.create({
  baseURL: getIotDemoBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

const unwrap = <T>(promise: Promise<{ data: T }>) =>
  promise.then((response) => response.data);

export const iotDemoApi = {
  bootstrapMinimal: () =>
    unwrap(iotDemoClient.post<IotDemoJson>("/seed/bootstrap/minimal")),

  bootstrapFull: () =>
    unwrap(iotDemoClient.post<IotDemoJson>("/seed/bootstrap/full")),

  seedHistory7d: () =>
    unwrap(iotDemoClient.post<IotDemoJson>("/seed/history/last-7d")),

  seedHistory30d: () =>
    unwrap(iotDemoClient.post<IotDemoJson>("/seed/history/last-30d")),

  startSimulation: () =>
    unwrap(iotDemoClient.post<IotDemoJson>("/seed/simulation/start")),

  stopSimulation: () =>
    unwrap(iotDemoClient.post<IotDemoJson>("/seed/simulation/stop")),

  getSimulationStatus: () =>
    unwrap(iotDemoClient.get<SimulationStatusResponse>("/seed/simulation/status")),

  triggerHighTemperature: (payload: ScenarioRequest) =>
    unwrap(
      iotDemoClient.post<IotDemoJson>(
        "/seed/scenarios/high-temperature",
        payload,
      ),
    ),

  triggerLowSoilMoisture: (payload: ScenarioRequest) =>
    unwrap(
      iotDemoClient.post<IotDemoJson>(
        "/seed/scenarios/low-soil-moisture",
        payload,
      ),
    ),

  sendConfigAckSuccess: (payload: ConfigAckScenarioRequest) =>
    unwrap(
      iotDemoClient.post<IotDemoJson>(
        "/seed/scenarios/config-ack-success",
        toBackendConfigAckPayload(payload),
      ),
    ),

  sendConfigAckFailure: (payload: ConfigAckScenarioRequest) =>
    unwrap(
      iotDemoClient.post<IotDemoJson>(
        "/seed/scenarios/config-ack-failure",
        toBackendConfigAckPayload(payload),
      ),
    ),
};

function toBackendConfigAckPayload(payload: ConfigAckScenarioRequest) {
  return {
    deviceUid: payload.deviceUid,
    ...(payload.configVersion != null && {
      configVersion: payload.configVersion,
    }),
    ...(payload.error && { errorMessage: payload.error }),
  };
}

export function toIotDemoErrorPayload(error: unknown): IotDemoJson {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<IotDemoJson>;
    return (
      axiosError.response?.data ?? {
        message: axiosError.message,
        status: axiosError.response?.status ?? null,
      }
    );
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unknown error" };
}

export function toIotDemoErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const message = data.message;
      if (typeof message === "string") return message;
    }
    return error.message;
  }

  return error instanceof Error ? error.message : "Unknown error";
}
