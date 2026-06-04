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
  AdminCameraUploadResponse,
  DeviceCameraScheduleRequest,
  DeviceCameraScheduleResponse,
  DeviceMediaAnalysisResponse,
  DiseaseDetectRequest,
  ChartRange,
  ClaimDeviceRequest,
  ConnectDeviceRequest,
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
  UpdateDeviceRequest,
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

const isNotFoundError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("404") || message.toLowerCase().includes("not found");
};

export const collectorApi = {
  getDashboardOverview: (farmPlotId: string) =>
    apiClient.get<DashboardOverviewResponse>(
      API_ENDPOINTS.IOT.DASHBOARD_OVERVIEW,
      {
        params: { farmPlotId },
        headers: currentUserHeaders(),
      },
    ),

  getZoneOverview: (zoneId: string) =>
    apiClient.get<ZoneOverviewResponse>(
      API_ENDPOINTS.IOT.FARM_ZONE_OVERVIEW(zoneId),
      { headers: currentUserHeaders() },
    ),

  getZoneChart: (zoneId: string, sensorCode: string, range: ChartRange) =>
    apiClient.get<SensorChartResponse>(
      API_ENDPOINTS.IOT.FARM_ZONE_CHARTS(zoneId),
      {
        params: { sensorCode, range },
        headers: currentUserHeaders(),
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
      { headers: currentUserHeaders() },
    ),

  getDeviceLatestReadings: (deviceId: string, zoneId?: string) =>
    apiClient.get<LatestReadingItemResponse[]>(
      API_ENDPOINTS.IOT.DEVICE_LATEST_READINGS(deviceId),
      {
        params: cleanParams({ zoneId }),
        headers: currentUserHeaders(),
      },
    ),

  getDeviceChart: (
    deviceId: string,
    sensorCode: string,
    range: ChartRange,
    zoneId?: string,
  ) =>
    apiClient.get<SensorChartResponse>(API_ENDPOINTS.IOT.DEVICE_CHARTS(deviceId), {
      params: cleanParams({ sensorCode, range, zoneId }),
      headers: currentUserHeaders(),
    }),

  getDeviceConfig: (deviceId: string) =>
    apiClient.get<DeviceConfigResponse>(
      API_ENDPOINTS.IOT.DEVICE_CONFIG(deviceId),
      { headers: currentUserHeaders() },
    ),

  updateDeviceConfig: (deviceId: string, payload: UpdateDeviceConfigRequest) =>
    apiClient.put<DeviceConfigResponse>(
      API_ENDPOINTS.IOT.DEVICE_CONFIG(deviceId),
      payload,
    ),

  updateDevice: (deviceId: string, payload: UpdateDeviceRequest) =>
    apiClient.patch<DeviceResponse>(API_ENDPOINTS.IOT.DEVICE(deviceId), payload, {
      headers: currentUserHeaders(),
    }),

  releaseDevice: (deviceId: string) =>
    apiClient.post<DeviceResponse>(
      `${API_ENDPOINTS.IOT.DEVICE(deviceId)}/release`,
      undefined,
      {
        headers: currentUserHeaders(),
      },
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

  getDeviceMedia: (deviceId: string, zoneId?: string) =>
    apiClient.get<DeviceMediaEventResponse[]>(
      API_ENDPOINTS.IOT.DEVICE_MEDIA(deviceId),
      { params: cleanParams({ zoneId }) },
    ),

  deleteDeviceMedia: (mediaEventId: string) =>
    apiClient.delete<void>(API_ENDPOINTS.IOT.MEDIA_EVENT(mediaEventId), {
      headers: currentUserHeaders(),
    }),

  getCameraSchedules: () =>
    apiClient.get<DeviceCameraScheduleResponse[]>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULES,
    ),

  getDeviceSchedules: (deviceUid: string) =>
    apiClient.get<DeviceCameraScheduleResponse[]>(
      API_ENDPOINTS.IOT.DEVICE_CAMERA_CAPTURE_SCHEDULE(deviceUid),
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

  runScheduledCameraForDevice: (deviceUid: string) =>
    apiClient.post<DeviceCameraScheduleResponse>(
      API_ENDPOINTS.IOT.ADMIN_CAMERA_RUN_SCHEDULED(deviceUid),
    ),

  createDeviceCameraSchedule: (
    deviceUid: string,
    payload: Pick<DeviceCameraScheduleRequest, "enabled" | "timeOfDay" | "recurrence" | "resolution" | "quality" | "uploadEndpoint">,
  ) =>
    apiClient.post<DeviceCameraScheduleResponse>(
      API_ENDPOINTS.IOT.DEVICE_CAMERA_CAPTURE_SCHEDULE(deviceUid),
      payload,
    ),

  updateDeviceSchedule: (
    deviceUid: string,
    scheduleId: string,
    payload: Pick<DeviceCameraScheduleRequest, "enabled" | "timeOfDay" | "recurrence" | "resolution" | "quality" | "uploadEndpoint">,
  ) =>
    apiClient.put<DeviceCameraScheduleResponse>(
      API_ENDPOINTS.IOT.DEVICE_CAMERA_CAPTURE_SCHEDULE_ITEM(deviceUid, scheduleId),
      payload,
    ),

  deleteDeviceSchedule: (deviceUid: string, scheduleId: string) =>
    apiClient.delete<void>(
      API_ENDPOINTS.IOT.DEVICE_CAMERA_CAPTURE_SCHEDULE_ITEM(deviceUid, scheduleId),
    ),

  runScheduledCamera: (deviceUid: string, scheduleId: string) =>
    apiClient.post<DeviceCameraScheduleResponse>(
      API_ENDPOINTS.IOT.DEVICE_CAMERA_RUN_SCHEDULED(deviceUid, scheduleId),
    ),

  detectCameraDisease: (deviceUid: string, payload: DiseaseDetectRequest) =>
    apiClient.post<DeviceMediaAnalysisResponse>(
      API_ENDPOINTS.IOT.DEVICE_CAMERA_DETECT(deviceUid),
      payload,
    ),

  uploadCameraFolder: ({
    files,
    deviceUid,
    autoDetect,
  }: {
    files: File[];
    deviceUid: string;
    autoDetect: boolean;
  }) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return apiClient.post<AdminCameraUploadResponse>(
      API_ENDPOINTS.IOT.ADMIN_CAMERA_UPLOAD_FOLDER,
      formData,
      {
        params: { deviceUid, autoDetect },
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },

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

  connectDevice: async (payload: ConnectDeviceRequest) => {
    try {
      return await apiClient.post<DeviceResponse>(
        API_ENDPOINTS.IOT.DEVICE_CONNECT,
        payload,
        { headers: currentUserHeaders() },
      );
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const provisioned = await collectorApi.provisionDevice(payload);
      const claimCode = await collectorApi.generateClaimCode(provisioned.data.id);
      return collectorApi.claimDevice({
        deviceUid: provisioned.data.deviceUid,
        claimCode: claimCode.data.claimCode,
        farmPlotId: payload.farmPlotId,
        zoneId: payload.zoneId,
      });
    }
  },

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
