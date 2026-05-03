export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type ChartRange = "H24" | "D3" | "D7" | "D30" | "D90";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CLOSED";

export type SortDirection = "asc" | "desc";

export type DeviceStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

export type ProvisioningStatus = "PROVISIONED" | "CLAIMED" | "RETIRED";

export type DeviceConfigPushStatus = "PENDING" | "SENT" | "ACKED" | "FAILED";

export interface DashboardOverviewResponse {
  farmPlotId: string;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalZones: number;
  openAlerts: number;
  lastUpdatedAt: string | null;
}

export interface AlertSummaryResponse {
  openAlerts: number;
  highSeverityAlerts: number;
  criticalAlerts: number;
  latestAlertAt: string | null;
}

export interface DeviceMediaSummaryResponse {
  mediaEventId: string;
  fileId: string;
  mediaType: string;
  triggerType: string;
  capturedAt: string;
  deviceId: string;
  zoneId: string;
}

export type DeviceMediaEventStatus =
  | "REQUESTED"
  | "COMMAND_SENT"
  | "UPLOADING"
  | "UPLOADED"
  | "FAILED"
  | "TIMEOUT";

export interface CameraCaptureRequest {
  quality?: "LOW" | "MEDIUM" | "HIGH";
  resolution?: "QVGA" | "VGA";
}

export interface CameraCaptureResponse {
  requestId: string;
  deviceId: string;
  status: DeviceMediaEventStatus;
  requestedAt: string;
}

export interface DeviceMediaEventResponse {
  id: string;
  requestId: string | null;
  deviceId: string;
  zoneId: string | null;
  fileId: string | null;
  mediaType: string;
  triggerType: string;
  status: DeviceMediaEventStatus | string;
  contentType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  error: string | null;
  requestedAt: string | null;
  commandSentAt: string | null;
  uploadedAt: string | null;
  capturedAt: string | null;
}

export interface DeviceConfigSnapshotResponse {
  configVersion: number | null;
  samplingIntervalSec: number | null;
  publishIntervalSec: number | null;
  offlineTimeoutSec: number | null;
  alertEnabled: boolean | null;
  appliedAt: string | null;
}

export interface DeviceConfigResponse extends DeviceConfigSnapshotResponse {
  deviceId: string;
  lastPushStatus: DeviceConfigPushStatus | null;
  lastAckAt: string | null;
  lastPushError: string | null;
}

export interface UpdateDeviceConfigRequest {
  samplingIntervalSec: number;
  publishIntervalSec: number;
  offlineTimeoutSec: number;
  alertEnabled: boolean;
}

export interface LatestReadingItemResponse {
  sensorTypeId: string;
  sensorCode: string;
  sensorName: string;
  unit: string;
  value: number | null;
  readingTime: string | null;
  qualityStatus: string | null;
}

export interface ZoneOverviewResponse {
  zoneId: string;
  openAlerts: number;
  lastUpdatedAt: string | null;
  alertSummary: AlertSummaryResponse | null;
  latestMedia: DeviceMediaSummaryResponse | null;
  latestReadings: LatestReadingItemResponse[];
}

export interface DeviceDetailResponse {
  deviceId: string;
  deviceUid: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  firmwareVersion: string | null;
  status: DeviceStatus | string;
  provisioningStatus: ProvisioningStatus | string;
  isActive: boolean | null;
  ownerUserId: string | null;
  farmPlotId: string | null;
  zoneId: string | null;
  lastSeenAt: string | null;
  alertSummary: AlertSummaryResponse | null;
  config: DeviceConfigSnapshotResponse | null;
  latestMedia: DeviceMediaSummaryResponse | null;
  latestReadings: LatestReadingItemResponse[];
}

export interface SensorChartPointResponse {
  bucketStart: string;
  bucketEnd: string;
  avgValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  sampleCount: number | null;
}

export interface SensorChartResponse {
  deviceId: string | null;
  zoneId: string | null;
  sensorCode: string;
  sensorName: string;
  unit: string;
  rangeType: ChartRange;
  points: SensorChartPointResponse[];
}

export interface AlertEventItemResponse {
  id: string;
  deviceId: string | null;
  zoneId: string | null;
  sensorTypeId: string | null;
  alertRuleId: string | null;
  alertType: string | null;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggerValue: number | null;
  thresholdMin: number | null;
  thresholdMax: number | null;
  openedAt: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  pushSent: boolean | null;
}

export interface AlertEventsParams {
  zoneId?: string;
  deviceId?: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sortBy?: "openedAt" | "severity" | "status";
  sortDir?: SortDirection;
}

export interface AlertRuleResponse {
  id: string;
  sensorTypeId: string;
  deviceId: string | null;
  zoneId: string | null;
  farmPlotId: string | null;
  ownerUserId: string | null;
  minThreshold: number | null;
  maxThreshold: number | null;
  severity: AlertSeverity;
  cooldownMinutes: number | null;
  notifyWeb: boolean | null;
  notifyMobile: boolean | null;
  enabled: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateAlertRuleRequest {
  sensorTypeId: string;
  deviceId?: string | null;
  zoneId?: string | null;
  farmPlotId?: string | null;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  severity: AlertSeverity;
  cooldownMinutes?: number | null;
  notifyWeb?: boolean;
  notifyMobile?: boolean;
  enabled?: boolean;
}

export type UpdateAlertRuleRequest = CreateAlertRuleRequest;

export interface UpdateAlertRuleEnabledRequest {
  enabled: boolean;
}

export interface AlertRulesParams {
  page?: number;
  size?: number;
  sortBy?: "updatedAt" | "createdAt" | "severity" | "enabled";
  sortDir?: SortDirection;
  sensorTypeId?: string;
  deviceId?: string;
  zoneId?: string;
  farmPlotId?: string;
  enabled?: boolean;
}

export interface ProvisionDeviceRequest {
  deviceUid: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
}

export interface ClaimDeviceRequest {
  deviceUid: string;
  claimCode: string;
  farmPlotId: string;
  zoneId: string;
}

export interface GenerateClaimCodeResponse {
  deviceId: string;
  claimCode: string;
  expiresAt: string;
}

export interface DeviceResponse {
  id: string;
  deviceUid: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  firmwareVersion: string | null;
  isActive: boolean | null;
  status: DeviceStatus | string;
  provisioningStatus: ProvisioningStatus | string;
  ownerUserId: string | null;
  farmPlotId: string | null;
  zoneId: string | null;
  lastSeenAt: string | null;
}

export interface MyDevicesParams {
  page?: number;
  size?: number;
  sortBy?: "createdAt" | "lastSeenAt" | "deviceName" | "status";
  sortDir?: SortDirection;
  status?: DeviceStatus;
  provisioningStatus?: ProvisioningStatus;
  zoneId?: string;
  farmPlotId?: string;
  keyword?: string;
}
