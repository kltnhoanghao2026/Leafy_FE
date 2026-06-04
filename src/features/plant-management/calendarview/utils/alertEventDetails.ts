import type { PlantEventResponse, PlantEventType } from "../../shared/types";
import type { TFunction } from "../../../../i18n/context";
import {
  formatAlertTypeLabel,
  formatSensorLabel,
  formatSeverityLabel,
} from "../../../iot/utils/iotTranslation";

export type AlertEventDetailField = {
  label: string;
  value: string;
  tone?: "danger" | "warning" | "info";
};

export type AlertEventDetails = {
  title: string;
  message?: string;
  fields: AlertEventDetailField[];
};

const TECHNICAL_KEYS = new Set([
  "alertEventId",
  "alertRuleId",
  "ruleId",
  "deviceId",
  "farmPlotId",
  "farmZoneId",
  "plantId",
  "planApplyId",
]);

const SENSOR_UNITS: Record<string, string> = {
  AIR_TEMP: "°C",
  AIR_HUMIDITY: "%",
  SOIL_MOISTURE: "%",
  LIGHT_INTENSITY: " lux",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toReadableLabel = (value?: string | null) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizeValue = (value: unknown) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const formatNumber = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return Number.isInteger(numeric) ? String(numeric) : String(Number(numeric.toFixed(2)));
};

const sensorUnit = (sensorCode?: string | null) =>
  sensorCode ? SENSOR_UNITS[sensorCode] ?? "" : "";

const formatMetricValue = (value: string, sensorCode?: string | null) => {
  if (!value) return "";
  const unit = sensorUnit(sensorCode);
  return `${formatNumber(value)}${unit}`;
};

const parseKeyValuePayload = (description: string) => {
  const result: Record<string, string> = {};
  description.split(/[;\n]/).forEach(part => {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) return;
    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key && value) result[key] = value;
  });
  return result;
};

const parseDescriptionPayload = (description: string): Record<string, string> => {
  const trimmed = description.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isRecord(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed)
            .map(([key, value]) => [key, normalizeValue(value)])
            .filter(([, value]) => value),
        );
      }
    } catch {
      return parseKeyValuePayload(trimmed);
    }
  }

  return parseKeyValuePayload(trimmed);
};

const isAlertPayload = (eventType: PlantEventType, payload: Record<string, string>) =>
  eventType === "ALERT_TRIGGERED" ||
  Boolean(payload.alertEventId || payload.alertType || payload.sensorTypeCode || payload.triggerValue);

const formatMessage = (
  t: TFunction,
  message: string | undefined,
  sensorCode: string | undefined,
  triggerValue?: string,
  thresholdMin?: string,
  thresholdMax?: string,
) => {
  const sensor = formatSensorLabel(t, sensorCode);
  const value = triggerValue ? formatMetricValue(triggerValue, sensorCode) : "";
  const min = thresholdMin ? formatMetricValue(thresholdMin, sensorCode) : "";
  const max = thresholdMax ? formatMetricValue(thresholdMax, sensorCode) : "";

  if (value && max && Number(triggerValue) > Number(thresholdMax)) {
    return (t("iot.alerts.message.thresholdHigh") as (sensor: string, threshold: string) => string)(sensor, max);
  }

  if (value && min && Number(triggerValue) < Number(thresholdMin)) {
    return (t("iot.alerts.message.thresholdLow") as (sensor: string, threshold: string) => string)(sensor, min);
  }

  if (value && min && max) {
    return (t("iot.alerts.message.thresholdRange") as (sensor: string, min: string, max: string) => string)(sensor, min, max);
  }

  if (!message) return (t("iot.alerts.message.conditionTriggered") as (sensor: string) => string)(sensor);

  const unit = sensorUnit(sensorCode);
  const highMatch = message.match(/^([A-Z_]+)\s+exceeded max threshold:\s*([\d.]+)\s*>\s*([\d.]+)/i);
  if (highMatch) {
    return (t("iot.alerts.message.thresholdHigh") as (sensor: string, threshold: string) => string)(
      sensor || formatSensorLabel(t, highMatch[1]),
      `${formatNumber(highMatch[3])}${unit}`,
    );
  }

  const lowMatch = message.match(/^([A-Z_]+)\s+(?:fell|dropped) below min threshold:\s*([\d.]+)\s*<\s*([\d.]+)/i);
  if (lowMatch) {
    return (t("iot.alerts.message.thresholdLow") as (sensor: string, threshold: string) => string)(
      sensor || formatSensorLabel(t, lowMatch[1]),
      `${formatNumber(lowMatch[3])}${unit}`,
    );
  }

  return sensorCode ? message.replaceAll(sensorCode, sensor || sensorCode) : message;
};

export const formatPlantEventAlertDetails = (
  t: TFunction,
  eventType: PlantEventType,
  description?: string | null,
): AlertEventDetails | null => {
  if (!description) return null;

  const payload = parseDescriptionPayload(description);
  if (!isAlertPayload(eventType, payload)) return null;

  const sensorCode = payload.sensorTypeCode ?? payload.sensorCode;
  const fields: AlertEventDetailField[] = [];

  if (payload.alertType) {
    fields.push({
      label: t("plantManagement.calendar.alertTypeLabel") as string,
      value: formatAlertTypeLabel(t, payload.alertType),
      tone: "danger",
    });
  }

  if (payload.severity) {
    fields.push({
      label: t("plantManagement.calendar.alertSeverityLabel") as string,
      value: formatSeverityLabel(t, payload.severity),
      tone: payload.severity === "HIGH" || payload.severity === "CRITICAL" ? "danger" : "warning",
    });
  }

  if (sensorCode) {
    fields.push({ label: t("plantManagement.calendar.alertSensorLabel") as string, value: formatSensorLabel(t, sensorCode), tone: "info" });
  }

  if (payload.triggerValue) {
    fields.push({
      label: t("plantManagement.calendar.alertMeasuredValueLabel") as string,
      value: formatMetricValue(payload.triggerValue, sensorCode),
      tone: "danger",
    });
  }

  const thresholdMin = payload.thresholdMin ? formatMetricValue(payload.thresholdMin, sensorCode) : "";
  const thresholdMax = payload.thresholdMax ? formatMetricValue(payload.thresholdMax, sensorCode) : "";
  if (thresholdMin || thresholdMax) {
    fields.push({
      label: t("plantManagement.calendar.alertSafeRangeLabel") as string,
      value: thresholdMin && thresholdMax ? `${thresholdMin} - ${thresholdMax}` : thresholdMin || thresholdMax,
      tone: "warning",
    });
  }

  if (payload.deviceUid) {
    fields.push({ label: t("plantManagement.calendar.alertDeviceLabel") as string, value: payload.deviceUid, tone: "info" });
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (!value || TECHNICAL_KEYS.has(key)) return;
    if (["alertType", "severity", "sensorTypeCode", "sensorCode", "triggerValue", "thresholdMin", "thresholdMax", "deviceUid", "message"].includes(key)) return;
    fields.push({ label: toReadableLabel(key), value });
  });

  return {
    title: t("plantManagement.calendar.alertDetailsTitle") as string,
    message: formatMessage(
      t,
      payload.message,
      sensorCode,
      payload.triggerValue,
      payload.thresholdMin,
      payload.thresholdMax,
    ),
    fields,
  };
};

export const getPlantEventDisplayText = (
  t: TFunction,
  event: Pick<PlantEventResponse, "eventType" | "note" | "description">,
) => {
  const alertDetails = formatPlantEventAlertDetails(t, event.eventType, event.description);

  return {
    alertDetails,
    title: alertDetails?.title ?? event.note ?? "",
    subtitle: alertDetails?.message ?? event.note ?? event.description ?? "",
  };
};
