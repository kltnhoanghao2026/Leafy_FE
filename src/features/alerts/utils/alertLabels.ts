import type { AlertEventItemResponse, AlertSeverity, AlertStatus } from "../../../types/iot";
import { formatNumber } from "../../metrics-view/utils/format";

const fallbackLabel = (value?: string | null) => {
  if (!value) return "Không rõ";
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const severityLabels: Record<AlertSeverity, string> = {
  LOW: "Nhẹ",
  MEDIUM: "Cần chú ý",
  HIGH: "Quan trọng",
  CRITICAL: "Khẩn cấp",
};

const statusLabels: Record<AlertStatus, string> = {
  OPEN: "Cần xử lý",
  ACKNOWLEDGED: "Đã xác nhận",
  RESOLVED: "Đã xử lý",
  CLOSED: "Đã đóng",
};

const alertTypeLabels: Record<string, string> = {
  THRESHOLD_HIGH: "Vượt ngưỡng cao",
  THRESHOLD_LOW: "Dưới ngưỡng thấp",
  THRESHOLD_RANGE: "Ngoài khoảng an toàn",
  DEVICE_OFFLINE: "Thiết bị mất kết nối",
  DEVICE_ONLINE: "Thiết bị hoạt động trở lại",
};

export const alertSeverityLabel = (severity?: string | null) =>
  severityLabels[severity as AlertSeverity] ?? fallbackLabel(severity);

export const alertStatusLabel = (status?: string | null) =>
  statusLabels[status as AlertStatus] ?? fallbackLabel(status);

export const alertTypeLabel = (alertType?: string | null) =>
  alertTypeLabels[alertType ?? ""] ?? fallbackLabel(alertType ?? "Cảnh báo");

export const alertSeverityClasses: Record<AlertSeverity, string> = {
  LOW: "bg-blue-50 text-blue-600 border-blue-100",
  MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-100",
  HIGH: "bg-orange-50 text-orange-700 border-orange-100",
  CRITICAL: "bg-red-50 text-red-600 border-red-100",
};

export const alertStatusClasses: Record<AlertStatus, string> = {
  OPEN: "bg-red-50 text-red-600 border-red-100",
  ACKNOWLEDGED: "bg-yellow-50 text-yellow-700 border-yellow-100",
  RESOLVED: "bg-green-50 text-green-700 border-green-100",
  CLOSED: "bg-slate-50 text-slate-600 border-slate-100",
};

export const readableAlertValue = (alert: Pick<AlertEventItemResponse, "triggerValue" | "thresholdMin" | "thresholdMax">) => {
  const value =
    alert.triggerValue === null || alert.triggerValue === undefined
      ? "chưa có giá trị đo"
      : `giá trị đo ${formatNumber(alert.triggerValue)}`;

  if (alert.thresholdMin !== null && alert.thresholdMax !== null) {
    return `${value}; khoảng an toàn ${formatNumber(alert.thresholdMin)} - ${formatNumber(alert.thresholdMax)}`;
  }

  if (alert.thresholdMax !== null && alert.thresholdMax !== undefined) {
    return `${value}; ngưỡng tối đa ${formatNumber(alert.thresholdMax)}`;
  }

  if (alert.thresholdMin !== null && alert.thresholdMin !== undefined) {
    return `${value}; ngưỡng tối thiểu ${formatNumber(alert.thresholdMin)}`;
  }

  return value;
};

export const readableRuleThreshold = (minThreshold?: number | null, maxThreshold?: number | null) => {
  if (minThreshold !== null && minThreshold !== undefined && maxThreshold !== null && maxThreshold !== undefined) {
    return `Cảnh báo khi ngoài khoảng ${formatNumber(minThreshold)} - ${formatNumber(maxThreshold)}`;
  }

  if (maxThreshold !== null && maxThreshold !== undefined) {
    return `Cảnh báo khi cao hơn ${formatNumber(maxThreshold)}`;
  }

  if (minThreshold !== null && minThreshold !== undefined) {
    return `Cảnh báo khi thấp hơn ${formatNumber(minThreshold)}`;
  }

  return "Chưa đặt ngưỡng";
};

export const friendlyMissingScope = (scope: "device" | "zone" | "farm") => {
  if (scope === "device") return "Không giới hạn thiết bị";
  if (scope === "zone") return "Không giới hạn khu vực";
  return "Không giới hạn vườn";
};
