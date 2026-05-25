import type { AlertEventItemResponse } from "../../../types/iot";
import { useTranslation } from "../../../i18n";
import { formatNumber } from "../../metrics-view/utils/format";
import { formatSensorLabel } from "../../iot/utils/iotTranslation";
import { useInferredSensorTypeOptions } from "../hooks/useInferredSensorTypeOptions";

const appendUnit = (value: string, unit?: string) => (unit ? `${value} ${unit}` : value);

const normalizeDiseaseKey = (value: string) =>
  value.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");

const parseDiseaseAlertMessage = (message?: string | null) => {
  if (!message) return null;
  const match = message.match(/disease detected from camera image:\s*(.+?)(?:\s*\(confidence\s*([0-9.]+)\))?$/i);
  if (!match?.[1]) return null;
  return {
    diseaseName: match[1].trim(),
    confidence: match[2] ? Number(match[2]) : null,
  };
};

const formatDiseaseLabel = (
  t: ReturnType<typeof useTranslation>["t"],
  diseaseName?: string | null,
) => {
  if (!diseaseName) return t("iot.alerts.disease.unknown");
  const key = `iot.alerts.disease.names.${normalizeDiseaseKey(diseaseName)}` as Parameters<typeof t>[0];
  const translated = t(key) as string;
  return translated && translated !== key ? translated : diseaseName;
};

const readableAlertDescription = (
  t: ReturnType<typeof useTranslation>["t"],
  alert: AlertEventItemResponse,
  sensorLabel: string,
  unit?: string,
) => {
  const min = alert.thresholdMin != null ? appendUnit(formatNumber(alert.thresholdMin), unit) : "";
  const max = alert.thresholdMax != null ? appendUnit(formatNumber(alert.thresholdMax), unit) : "";

  if (alert.alertType === "DISEASE_DETECTED") {
    const disease = formatDiseaseLabel(t, parseDiseaseAlertMessage(alert.message)?.diseaseName);
    return t("iot.alerts.message.diseaseDetected")(disease);
  }

  if (alert.alertType === "THRESHOLD_HIGH" || (alert.thresholdMax != null && alert.thresholdMin == null)) {
    return t("iot.alerts.message.thresholdHigh")(sensorLabel, max);
  }

  if (alert.alertType === "THRESHOLD_LOW" || (alert.thresholdMin != null && alert.thresholdMax == null)) {
    return t("iot.alerts.message.thresholdLow")(sensorLabel, min);
  }

  if (alert.alertType === "THRESHOLD_RANGE" || (alert.thresholdMin != null && alert.thresholdMax != null)) {
    return t("iot.alerts.message.thresholdRange")(sensorLabel, min, max);
  }

  return t("iot.alerts.message.conditionTriggered")(sensorLabel);
};

export function AlertMessageSummary({
  alert,
  descriptionClassName = "mt-1 text-xs font-semibold text-slate-500",
  detailClassName = "mt-1 text-xs font-semibold text-slate-400",
}: {
  alert: AlertEventItemResponse;
  descriptionClassName?: string;
  detailClassName?: string;
}) {
  const { t } = useTranslation();
  const { sensorOptions, isLoading } = useInferredSensorTypeOptions(
    alert.deviceId ?? "",
    alert.zoneId ?? "",
  );
  const sensor = sensorOptions.find((option) => option.id === alert.sensorTypeId);
  const sensorLabel = sensor
    ? formatSensorLabel(t, sensor.code, sensor.name)
    : t("iot.alerts.value.unknownSensorData");
  const unit = sensor?.unit;
  const diseaseInfo = parseDiseaseAlertMessage(alert.message);
  const isDiseaseAlert = alert.alertType === "DISEASE_DETECTED";

  if (isDiseaseAlert) {
    const disease = formatDiseaseLabel(t, diseaseInfo?.diseaseName);
    const confidence = alert.triggerValue ?? diseaseInfo?.confidence ?? null;

    return (
      <>
        <p className={descriptionClassName}>
          {t("iot.alerts.message.diseaseDetected")(disease)}
        </p>
        <p className={detailClassName}>
          {confidence == null
            ? t("iot.alerts.disease.confidenceUnknown")
            : t("iot.alerts.disease.confidence")(formatNumber(confidence * 100))}
        </p>
      </>
    );
  }

  const measuredValue =
    alert.triggerValue === null || alert.triggerValue === undefined
      ? t("iot.alerts.value.noReading")
      : t("iot.alerts.value.measured")(appendUnit(formatNumber(alert.triggerValue), unit));

  const rangeText =
    alert.thresholdMin !== null && alert.thresholdMax !== null
      ? t("iot.alerts.value.safeRange")(
          appendUnit(formatNumber(alert.thresholdMin), unit),
          appendUnit(formatNumber(alert.thresholdMax), unit),
        )
      : alert.thresholdMax !== null && alert.thresholdMax !== undefined
        ? t("iot.alerts.value.maxThreshold")(appendUnit(formatNumber(alert.thresholdMax), unit))
        : alert.thresholdMin !== null && alert.thresholdMin !== undefined
          ? t("iot.alerts.value.minThreshold")(appendUnit(formatNumber(alert.thresholdMin), unit))
          : "";

  return (
    <>
      <p className={descriptionClassName}>
        {isLoading
          ? t("iot.alerts.message.loadingSensor")
          : readableAlertDescription(t, alert, sensorLabel, unit)}
      </p>
      <p className={detailClassName}>
        {rangeText ? `${measuredValue}; ${rangeText}` : measuredValue}
      </p>
    </>
  );
}
