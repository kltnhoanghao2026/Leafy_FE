import type { TFunction } from "../../../i18n/context";
import type {
  AlertEventItemResponse,
  DeviceCameraScheduleResponse,
  DeviceDetailResponse,
  DeviceMediaAnalysisResponse,
  DeviceMediaEventResponse,
} from "../../../types/iot";
import { compactId, formatDateTime, formatNumber } from "../../metrics-view/utils/format";
import {
  formatAlertStatusLabel,
  formatAlertTypeLabel,
  formatCameraQualityLabel,
  formatCameraResolutionLabel,
  formatCameraTriggerLabel,
  formatMediaAnalysisStatusLabel,
  formatMediaStatusLabel,
  formatScheduleRecurrenceLabel,
  formatSeverityLabel,
} from "./iotTranslation";

export interface DisplayFields {
  primary: string;
  secondary?: string;
  technical?: string;
}

export type DisplayDeviceMediaEvent = DeviceMediaEventResponse & {
  display: {
    status: string;
    triggerType: string;
    capturedAt: string;
    size: string;
    fallbackMessage: string;
    technicalRequestId: string;
    analysis?: ReturnType<typeof formatMediaAnalysisDisplay>;
  };
};

export type DisplayCameraSchedule = DeviceCameraScheduleResponse & {
  display: {
    id: string;
    device: string;
    timeOfDay: string;
    recurrence: string;
    enabled: string;
    resolution: string;
    quality: string;
    endpoint: string;
    nextRunAt: string;
    lastRunAt: string;
    lastMediaStatus: string;
    lastMediaEvent?: DisplayDeviceMediaEvent | null;
  };
};

export type DisplayAlertEvent = AlertEventItemResponse & {
  display: {
    type: string;
    severity: string;
    status: string;
    openedAt: string;
    message: string;
    value: string;
    technicalId: string;
  };
};

export const compactTechnicalId = (value?: string | null) => compactId(value);

export const readableDeviceName = (
  t: TFunction,
  device?: {
    deviceName?: string | null;
    deviceCode?: string | null;
    deviceUid?: string | null;
  } | null,
) =>
  device?.deviceName?.trim() ||
  device?.deviceCode?.trim() ||
  (device?.deviceUid ? t("iot.common.deviceWithId")(compactTechnicalId(device.deviceUid)) : t("iot.devices.defaultName"));

export const formatScheduleTime = (value?: string | null) => {
  if (!value) return "-";
  return value.length >= 5 ? value.slice(0, 5) : value;
};

export const formatEndpointDisplay = (value?: string | null, t?: TFunction) => {
  if (!value) return t?.("iot.cameraSchedules.defaultUpload") ?? "-";
  try {
    const url = new URL(value);
    const internalHosts = ["localhost", "127.0.0.1", "0.0.0.0"];
    if (internalHosts.includes(url.hostname) || url.hostname.includes("file-service")) {
      return t?.("iot.cameraSchedules.defaultUpload") ?? "Default upload";
    }
    return t?.("iot.cameraSchedules.customEndpoint") ?? "Custom endpoint";
  } catch {
    return t?.("iot.cameraSchedules.customEndpoint") ?? "Custom endpoint";
  }
};

export const formatMediaSize = (
  width?: number | null,
  height?: number | null,
  sizeBytes?: number | null,
  t?: TFunction,
) => {
  const dimensions =
    width && height
      ? `${formatNumber(width)}x${formatNumber(height)}`
      : t?.("iot.devices.media.unknownDimensions") ?? "-";
  const size =
    sizeBytes == null
      ? t?.("iot.devices.media.unknownSize") ?? "-"
      : t
        ? t("iot.devices.media.bytes")(formatNumber(sizeBytes))
        : `${formatNumber(sizeBytes)} bytes`;
  return `${dimensions} - ${size}`;
};

export const formatMediaAnalysisDisplay = (
  t: TFunction,
  analysis?: DeviceMediaAnalysisResponse | null,
) => {
  if (!analysis) {
    return {
      status: t("iot.devices.media.analysis.notAnalyzed"),
      summary: t("iot.devices.media.analysis.notAnalyzed"),
      diseaseName: "-",
      severity: "-",
      confidence: "-",
      analyzedAt: "-",
      alertBadge: "",
      technicalId: "-",
    };
  }

  const diseaseName =
    analysis.diseaseName?.trim() ||
    analysis.diseaseType?.trim() ||
    t("iot.devices.media.analysis.unknownDisease");
  const severity = formatSeverityLabel(t, analysis.severity);
  const status = formatMediaAnalysisStatusLabel(t, analysis.status);
  const confidence =
    analysis.confidence == null
      ? "-"
      : t("iot.devices.media.analysis.confidenceValue")(formatNumber(analysis.confidence * 100));

  return {
    status: analysis.diseaseDetected ? t("iot.devices.media.analysis.diseaseDetected") : status,
    summary: analysis.diseaseDetected
      ? t("iot.devices.media.analysis.diseaseSummary")(diseaseName, severity)
      : status,
    diseaseName,
    severity,
    confidence,
    analyzedAt: formatDateTime(analysis.analyzedAt),
    alertBadge: analysis.alertEventId ? t("iot.devices.media.analysis.alertCreated") : "",
    technicalId: compactTechnicalId(analysis.id),
  };
};

export const withMediaDisplay = (
  t: TFunction,
  event: DeviceMediaEventResponse,
): DisplayDeviceMediaEvent => ({
  ...event,
  display: {
    status: formatMediaStatusLabel(t, event.status),
    triggerType: formatCameraTriggerLabel(t, event.triggerType),
    capturedAt: formatDateTime(event.uploadedAt || event.capturedAt || event.requestedAt),
    size: formatMediaSize(event.width, event.height, event.sizeBytes, t),
    fallbackMessage: event.error || t("iot.devices.media.waitingForUpload"),
    technicalRequestId: compactTechnicalId(event.requestId),
    analysis: formatMediaAnalysisDisplay(t, event.analysis),
  },
});

export const withScheduleDisplay = (
  t: TFunction,
  schedule: DeviceCameraScheduleResponse,
  device?: Pick<DeviceDetailResponse, "deviceName" | "deviceCode" | "deviceUid"> | null,
): DisplayCameraSchedule => {
  const lastMediaEvent = schedule.lastMediaEvent
    ? withMediaDisplay(t, schedule.lastMediaEvent)
    : null;

  return {
    ...schedule,
    lastMediaEvent,
    display: {
      id: compactTechnicalId(schedule.scheduleId ?? schedule.id),
      device: readableDeviceName(t, device ?? { deviceUid: schedule.deviceUid }),
      timeOfDay: formatScheduleTime(schedule.timeOfDay),
      recurrence: formatScheduleRecurrenceLabel(t, schedule.recurrence),
      enabled: schedule.enabled ? t("iot.cameraSchedules.enabled") : t("iot.cameraSchedules.disabled"),
      resolution: formatCameraResolutionLabel(t, schedule.resolution),
      quality: formatCameraQualityLabel(t, schedule.quality),
      endpoint: formatEndpointDisplay(schedule.uploadEndpoint, t),
      nextRunAt: formatDateTime(schedule.nextRunAt),
      lastRunAt: formatDateTime(schedule.lastRunAt),
      lastMediaStatus: formatMediaStatusLabel(t, schedule.lastMediaEvent?.status ?? schedule.lastMediaStatus),
      lastMediaEvent,
    },
  };
};

export const withAlertDisplay = (
  t: TFunction,
  alert: AlertEventItemResponse,
): DisplayAlertEvent => {
  const triggerValue =
    alert.triggerValue === null || alert.triggerValue === undefined
      ? t("iot.alerts.value.noReading")
      : t("iot.alerts.value.measured")(formatNumber(alert.triggerValue));

  let threshold = "";
  if (alert.thresholdMin !== null && alert.thresholdMax !== null) {
    threshold = t("iot.alerts.value.safeRange")(
      formatNumber(alert.thresholdMin),
      formatNumber(alert.thresholdMax),
    );
  } else if (alert.thresholdMax !== null && alert.thresholdMax !== undefined) {
    threshold = t("iot.alerts.value.maxThreshold")(formatNumber(alert.thresholdMax));
  } else if (alert.thresholdMin !== null && alert.thresholdMin !== undefined) {
    threshold = t("iot.alerts.value.minThreshold")(formatNumber(alert.thresholdMin));
  }

  return {
    ...alert,
    display: {
      type: formatAlertTypeLabel(t, alert.alertType),
      severity: formatSeverityLabel(t, alert.severity),
      status: formatAlertStatusLabel(t, alert.status),
      openedAt: formatDateTime(alert.openedAt),
      message: alert.message || t("iot.alerts.messageFallback"),
      value: threshold ? `${triggerValue}; ${threshold}` : triggerValue,
      technicalId: compactTechnicalId(alert.id),
    },
  };
};
