import apiClient from "../apiClient";
import { API_ENDPOINTS } from "../routes";
import { useAuthStore } from "../../store/authStore";
import type {
  AlertEventItemResponse,
  AlertEventsParams,
  AlertRuleResponse,
  AlertRulesParams,
  CameraCaptureRequest,
  CameraCaptureResponse,
  DeviceCameraScheduleRequest,
  DeviceCameraScheduleResponse,
  ChartRange,
  ClaimDeviceRequest,
  CreateAlertRuleRequest,
  DashboardOverviewResponse,
  DeviceConfigResponse,
  DeviceDetailResponse,
  DeviceMediaEventResponse,
  DeviceResponse,
  GenerateClaimCodeResponse,
  LatestReadingItemResponse,
  MyDevicesParams,
  PagedResponse,
  ProvisionDeviceRequest,
  SensorChartResponse,
  UpdateAlertRuleEnabledRequest,
  UpdateAlertRuleRequest,
  UpdateDeviceConfigRequest,
  ZoneOverviewResponse,
} from "../../types/iot";

const cleanParams = <T extends object>(params: T): Partial<T> => {
  const entries = Object.entries(params).filter(([, value]) => {
    return value !== undefined && value !== null && value !== "";
  });

  return Object.fromEntries(entries) as Partial<T>;
};

const currentUserHeaders = () => {
  const userId = useAuthStore.getState().user?.id;
  return userId ? { "X-User-Id": userId } : {};
};

export const collectorApi = {
  getDashboardOverview: (farmPlotId: string) =>
    apiClient.get<DashboardOverviewResponse>(
      API_ENDPOINTS.IOT.DASHBOARD_OVERVIEW,
      {
        params: { farmPlotId },
      },
    ),

  getZoneOverview: (zoneId: string) =>
    apiClient.get<ZoneOverviewResponse>(
      API_ENDPOINTS.IOT.FARM_ZONE_OVERVIEW(zoneId),
    ),

  getZoneChart: (zoneId: string, sensorCode: string, range: ChartRange) =>
    apiClient.get<SensorChartResponse>(
      API_ENDPOINTS.IOT.FARM_ZONE_CHARTS(zoneId),
      {
        params: { sensorCode, range },
      },
    ),

  getAlertEvents: (params: AlertEventsParams = {}) =>
    apiClient.get<PagedResponse<AlertEventItemResponse>>(
      API_ENDPOINTS.IOT.ALERT_EVENTS,
      {
        params: cleanParams(params),
      },
    ),

  getAlertEvent: (alertEventId: string) =>
    apiClient.get<AlertEventItemResponse>(
      API_ENDPOINTS.IOT.ALERT_EVENT(alertEventId),
    ),

  acknowledgeAlert: (alertEventId: string) =>
    apiClient.post<AlertEventItemResponse>(
      API_ENDPOINTS.IOT.ALERT_EVENT_ACKNOWLEDGE(alertEventId),
    ),

  resolveAlert: (alertEventId: string) =>
    apiClient.post<AlertEventItemResponse>(
      API_ENDPOINTS.IOT.ALERT_EVENT_RESOLVE(alertEventId),
    ),

  getDeviceDetail: (deviceId: string) =>
    apiClient.get<DeviceDetailResponse>(
      API_ENDPOINTS.IOT.DEVICE_DETAIL(deviceId),
    ),

  getDeviceLatestReadings: (deviceId: string) =>
    apiClient.get<LatestReadingItemResponse[]>(
      API_ENDPOINTS.IOT.DEVICE_LATEST_READINGS(deviceId),
    ),

  getDeviceChart: (deviceId: string, sensorCode: string, range: ChartRange) =>
    apiClient.get<SensorChartResponse>(API_ENDPOINTS.IOT.DEVICE_CHARTS(deviceId), {
      params: { sensorCode, range },
    }),

  getDeviceConfig: (deviceId: string) =>
    apiClient.get<DeviceConfigResponse>(
      API_ENDPOINTS.IOT.DEVICE_CONFIG(deviceId),
    ),

  updateDeviceConfig: (deviceId: string, payload: UpdateDeviceConfigRequest) =>
    apiClient.put<DeviceConfigResponse>(
      API_ENDPOINTS.IOT.DEVICE_CONFIG(deviceId),
      payload,
    ),

  pushDeviceConfig: (deviceId: string) =>
    apiClient.post<DeviceConfigResponse>(
      API_ENDPOINTS.IOT.DEVICE_CONFIG_PUSH(deviceId),
    ),

  captureDeviceImage: (
    deviceId: string,
    payload: CameraCaptureRequest = { quality: "MEDIUM", resolution: "VGA" },
  ) =>
    apiClient.post<CameraCaptureResponse>(
      API_ENDPOINTS.IOT.DEVICE_CAMERA_CAPTURE(deviceId),
      payload,
    ),

  getDeviceMedia: (deviceId: string) =>
    apiClient.get<DeviceMediaEventResponse[]>(
      API_ENDPOINTS.IOT.DEVICE_MEDIA(deviceId),
    ),

  getCameraSchedules: () =>
    apiClient.get<DeviceCameraScheduleResponse[]>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULES,
    ),

  createCameraSchedule: (payload: DeviceCameraScheduleRequest) =>
    apiClient.post<DeviceCameraScheduleResponse>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULES,
      payload,
    ),

  updateCameraSchedule: (scheduleId: string, payload: DeviceCameraScheduleRequest) =>
    apiClient.put<DeviceCameraScheduleResponse>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULE(scheduleId),
      payload,
    ),

  deleteCameraSchedule: (scheduleId: string) =>
    apiClient.delete<void>(API_ENDPOINTS.IOT.CAMERA_SCHEDULE(scheduleId)),

  runCameraScheduleNow: (scheduleId: string) =>
    apiClient.post<DeviceCameraScheduleResponse>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULE_RUN_NOW(scheduleId),
    ),

  getAlertRules: (params: AlertRulesParams = {}) =>
    apiClient.get<PagedResponse<AlertRuleResponse>>(
      API_ENDPOINTS.IOT.ALERT_RULES,
      {
        params: cleanParams(params),
        headers: currentUserHeaders(),
      },
    ),

  getAlertRule: (ruleId: string) =>
    apiClient.get<AlertRuleResponse>(API_ENDPOINTS.IOT.ALERT_RULE(ruleId), {
      headers: currentUserHeaders(),
    }),

  createAlertRule: (payload: CreateAlertRuleRequest) =>
    apiClient.post<AlertRuleResponse>(API_ENDPOINTS.IOT.ALERT_RULES, payload, {
      headers: currentUserHeaders(),
    }),

  updateAlertRule: (ruleId: string, payload: UpdateAlertRuleRequest) =>
    apiClient.put<AlertRuleResponse>(
      API_ENDPOINTS.IOT.ALERT_RULE(ruleId),
      payload,
      {
        headers: currentUserHeaders(),
      },
    ),

  updateAlertRuleEnabled: (
    ruleId: string,
    payload: UpdateAlertRuleEnabledRequest,
  ) =>
    apiClient.patch<AlertRuleResponse>(
      API_ENDPOINTS.IOT.ALERT_RULE_ENABLED(ruleId),
      payload,
      {
        headers: currentUserHeaders(),
      },
    ),

  deleteAlertRule: (ruleId: string) =>
    apiClient.delete<void>(API_ENDPOINTS.IOT.ALERT_RULE(ruleId), {
      headers: currentUserHeaders(),
    }),

  provisionDevice: (payload: ProvisionDeviceRequest) =>
    apiClient.post<DeviceResponse>(API_ENDPOINTS.IOT.DEVICE_PROVISION, payload),

  generateClaimCode: (deviceId: string) =>
    apiClient.post<GenerateClaimCodeResponse>(
      API_ENDPOINTS.IOT.DEVICE_CLAIM_CODE(deviceId),
    ),

  claimDevice: (payload: ClaimDeviceRequest) =>
    apiClient.post<DeviceResponse>(API_ENDPOINTS.IOT.DEVICE_CLAIM, payload, {
      headers: currentUserHeaders(),
    }),

  getMyDevices: (params: MyDevicesParams = {}) =>
    apiClient.get<PagedResponse<DeviceResponse>>(API_ENDPOINTS.IOT.MY_DEVICES, {
      params: cleanParams(params),
      headers: currentUserHeaders(),
    }),
};
