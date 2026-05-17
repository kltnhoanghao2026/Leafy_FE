import type { TFunction } from "../../../i18n/context";
import type {
  AlertSeverity,
  AlertStatus,
  DeviceConfigPushStatus,
  DeviceMediaEventStatus,
  DeviceStatus,
  ProvisioningStatus,
} from "../../../types/iot";

type TranslationKey = Parameters<TFunction>[0];

export type IoTSensorCode =
  | "AIR_TEMP"
  | "AIR_HUMIDITY"
  | "SOIL_MOISTURE"
  | "LIGHT_INTENSITY";

export type IoTAlertType =
  | "THRESHOLD_HIGH"
  | "THRESHOLD_LOW"
  | "THRESHOLD_RANGE"
  | "DEVICE_OFFLINE"
  | "DEVICE_ONLINE";

export type IoTDeviceStatus =
  | DeviceStatus
  | ProvisioningStatus
  | "ERROR";

export type IoTConfigStatus =
  | DeviceConfigPushStatus
  | "APPLIED";

export type IoTMediaStatus = DeviceMediaEventStatus;

export type IoTChartRange = "H1" | "D1" | "D7" | "M1";

export type IoTCameraScheduleRecurrence = "DAILY" | "WEEKLY" | "NONE";

export type IoTDeviceType =
  | "ESP32_CAM_SENSOR"
  | "ESP32_SENSOR"
  | "SENSOR_NODE"
  | "CAMERA_SENSOR";

// IoT UI keys are grouped under iot.*. These helpers centralize backend enum
// labels and deliberately fall back to a readable backend value for new codes.

const sensorLabelKeys = {
  AIR_TEMP: "iot.sensor.AIR_TEMP",
  AIR_HUMIDITY: "iot.sensor.AIR_HUMIDITY",
  SOIL_MOISTURE: "iot.sensor.SOIL_MOISTURE",
  LIGHT_INTENSITY: "iot.sensor.LIGHT_INTENSITY",
} as const satisfies Record<IoTSensorCode, TranslationKey>;

const severityLabelKeys = {
  LOW: "iot.severity.LOW",
  MEDIUM: "iot.severity.MEDIUM",
  HIGH: "iot.severity.HIGH",
  CRITICAL: "iot.severity.CRITICAL",
} as const satisfies Record<AlertSeverity, TranslationKey>;

const alertStatusLabelKeys = {
  OPEN: "iot.alertStatus.OPEN",
  ACKNOWLEDGED: "iot.alertStatus.ACKNOWLEDGED",
  RESOLVED: "iot.alertStatus.RESOLVED",
  CLOSED: "iot.alertStatus.CLOSED",
} as const satisfies Record<AlertStatus, TranslationKey>;

const alertTypeLabelKeys = {
  THRESHOLD_HIGH: "iot.alertType.THRESHOLD_HIGH",
  THRESHOLD_LOW: "iot.alertType.THRESHOLD_LOW",
  THRESHOLD_RANGE: "iot.alertType.THRESHOLD_RANGE",
  DEVICE_OFFLINE: "iot.alertType.DEVICE_OFFLINE",
  DEVICE_ONLINE: "iot.alertType.DEVICE_ONLINE",
} as const satisfies Record<IoTAlertType, TranslationKey>;

const deviceStatusLabelKeys = {
  ONLINE: "iot.deviceStatus.ONLINE",
  OFFLINE: "iot.deviceStatus.OFFLINE",
  PROVISIONED: "iot.deviceStatus.PROVISIONED",
  CLAIMED: "iot.deviceStatus.CLAIMED",
  RETIRED: "iot.deviceStatus.RETIRED",
  ERROR: "iot.deviceStatus.ERROR",
  UNKNOWN: "iot.deviceStatus.UNKNOWN",
} as const satisfies Record<IoTDeviceStatus, TranslationKey>;

const deviceTypeLabelKeys = {
  ESP32_CAM_SENSOR: "iot.deviceType.ESP32_CAM_SENSOR",
  ESP32_SENSOR: "iot.deviceType.ESP32_SENSOR",
  SENSOR_NODE: "iot.deviceType.SENSOR_NODE",
  CAMERA_SENSOR: "iot.deviceType.CAMERA_SENSOR",
} as const satisfies Record<IoTDeviceType, TranslationKey>;

const configStatusLabelKeys = {
  PENDING: "iot.configStatus.PENDING",
  SENT: "iot.configStatus.SENT",
  ACKED: "iot.configStatus.ACKED",
  FAILED: "iot.configStatus.FAILED",
  APPLIED: "iot.configStatus.APPLIED",
} as const satisfies Record<IoTConfigStatus, TranslationKey>;

const mediaStatusLabelKeys = {
  REQUESTED: "iot.devices.media.status.REQUESTED",
  COMMAND_SENT: "iot.devices.media.status.COMMAND_SENT",
  UPLOADING: "iot.devices.media.status.UPLOADING",
  UPLOADED: "iot.devices.media.status.UPLOADED",
  FAILED: "iot.devices.media.status.FAILED",
  TIMEOUT: "iot.devices.media.status.TIMEOUT",
} as const satisfies Record<IoTMediaStatus, TranslationKey>;

const chartRangeLabelKeys = {
  H1: "iot.charts.H1",
  D1: "iot.charts.D1",
  D7: "iot.charts.D7",
  M1: "iot.charts.M1",
} as const satisfies Record<IoTChartRange, TranslationKey>;

const scheduleRecurrenceLabelKeys = {
  DAILY: "iot.cameraSchedules.recurrenceDaily",
  WEEKLY: "iot.cameraSchedules.recurrenceWeekly",
  NONE: "iot.cameraSchedules.recurrenceNone",
} as const satisfies Record<IoTCameraScheduleRecurrence, TranslationKey>;

const fallbackBackendLabel = (value?: string | null) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const translateKnownValue = <
  TKey extends string,
  TMap extends Partial<Record<TKey, TranslationKey>>,
>(
  t: TFunction,
  value: string | null | undefined,
  labelKeys: TMap,
  fallback?: string,
) : string => {
  if (!value) return fallback ?? t("iot.common.unknown");

  const key = labelKeys[value as TKey];
  if (!key) return fallback ?? (fallbackBackendLabel(value) || value);

  const translated = t(key) as string;
  return translated && translated !== key ? translated : fallback ?? value;
};

export const formatSensorLabel = (
  t: TFunction,
  sensorCode?: string | null,
  fallback?: string,
) => translateKnownValue<IoTSensorCode, typeof sensorLabelKeys>(
  t,
  sensorCode,
  sensorLabelKeys,
  fallback,
);

export const formatAlertStatusLabel = (
  t: TFunction,
  status?: string | null,
) => translateKnownValue<AlertStatus, typeof alertStatusLabelKeys>(
  t,
  status,
  alertStatusLabelKeys,
);

export const formatSeverityLabel = (
  t: TFunction,
  severity?: string | null,
) => translateKnownValue<AlertSeverity, typeof severityLabelKeys>(
  t,
  severity,
  severityLabelKeys,
);

export const formatDeviceStatusLabel = (
  t: TFunction,
  status?: string | null,
) => translateKnownValue<IoTDeviceStatus, typeof deviceStatusLabelKeys>(
  t,
  status,
  deviceStatusLabelKeys,
);

export const formatDeviceTypeLabel = (
  t: TFunction,
  deviceType?: string | null,
) => translateKnownValue<IoTDeviceType, typeof deviceTypeLabelKeys>(
  t,
  deviceType,
  deviceTypeLabelKeys,
  deviceType ? undefined : t("iot.devices.defaultName"),
);

export const formatConfigStatusLabel = (
  t: TFunction,
  status?: string | null,
) => translateKnownValue<IoTConfigStatus, typeof configStatusLabelKeys>(
  t,
  status,
  configStatusLabelKeys,
);

export const formatAlertTypeLabel = (
  t: TFunction,
  type?: string | null,
) => translateKnownValue<IoTAlertType, typeof alertTypeLabelKeys>(
  t,
  type,
  alertTypeLabelKeys,
  fallbackBackendLabel(type || "Alert"),
);

export const formatMediaStatusLabel = (
  t: TFunction,
  status?: string | null,
) => translateKnownValue<IoTMediaStatus, typeof mediaStatusLabelKeys>(
  t,
  status,
  mediaStatusLabelKeys,
);

export const formatChartRangeLabel = (
  t: TFunction,
  range?: string | null,
) => translateKnownValue<IoTChartRange, typeof chartRangeLabelKeys>(
  t,
  range,
  chartRangeLabelKeys,
);

export const formatScheduleRecurrenceLabel = (
  t: TFunction,
  recurrence?: string | null,
) => translateKnownValue<IoTCameraScheduleRecurrence, typeof scheduleRecurrenceLabelKeys>(
  t,
  recurrence,
  scheduleRecurrenceLabelKeys,
);
