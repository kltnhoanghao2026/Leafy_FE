import { AlertTriangle, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAlertEvents } from "../../alerts/queries";
import { ROUTES } from "../../../lib/routes";
import { formatDateTime } from "../utils/format";
import {
  alertSeverityClasses,
  alertSeverityLabel,
  alertStatusLabel,
  alertTypeLabel,
} from "../../alerts/utils/alertLabels";

interface RecentAlertsProps {
  zoneId?: string;
}

export function RecentAlerts({ zoneId }: RecentAlertsProps) {
  const { data, isLoading, isError, refetch } = useAlertEvents(
    {
      zoneId,
      page: 0,
      size: 3,
      sortBy: "openedAt",
      sortDir: "desc",
    },
    !!zoneId,
  );

  const alerts = data?.items ?? [];

  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100/50 mb-6 lg:mb-8">
      <div className="flex items-start justify-between mb-8 gap-4">
        <h3 className="text-[20px] font-bold text-gray-900 tracking-tight leading-sm max-w-[140px]">
          Recent alerts
        </h3>
        <Link
          to={ROUTES.DASHBOARD.ALERTS}
          className="px-3 py-1.5 bg-[#ECFDF5] text-[13px] font-bold text-[#245A34] rounded-full hover:bg-green-100 transition-colors"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label="Loading recent alerts">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-20 rounded-3xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">
            Could not load recent alerts.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 text-sm font-bold text-red-700 underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && alerts.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-center">
          <Bell className="mx-auto h-5 w-5 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-600">
            No alerts for this zone.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-4 p-4 rounded-3xl border ${
                alertSeverityClasses[alert.severity] ?? alertSeverityClasses.LOW
              }`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold truncate leading-tight">
                  {alertTypeLabel(alert.alertType)}
                </h4>
                <p className="text-[12px] font-semibold mt-0.5">
                  {alertStatusLabel(alert.status)} - {alertSeverityLabel(alert.severity)}
                </p>
                <p className="text-[11px] font-semibold mt-0.5 opacity-80 line-clamp-2">
                  {alert.message}
                </p>
                <p className="text-[10px] font-black tracking-wider uppercase mt-1 opacity-75">
                  {formatDateTime(alert.openedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
