import type { AlertSeverity, AlertStatus } from "../../../types/iot";

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
