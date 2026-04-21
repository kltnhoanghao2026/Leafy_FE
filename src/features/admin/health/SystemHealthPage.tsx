import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  Server,
} from "lucide-react";
import { useSystemHealth } from "./health.queries";
import type { ServiceHealthStatus, OverallHealthStatus } from "../types";

function StatusIcon({ status }: { status: ServiceHealthStatus }) {
  if (status === "UP")
    return <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={2} />;
  if (status === "DOWN")
    return <XCircle className="w-5 h-5 text-red-500" strokeWidth={2} />;
  return <AlertCircle className="w-5 h-5 text-slate-300" strokeWidth={2} />;
}

function statusLabel(status: ServiceHealthStatus): string {
  if (status === "UP") return "Hoạt động";
  if (status === "DOWN") return "Ngừng hoạt động";
  return "Không xác định";
}

function statusTextColor(status: ServiceHealthStatus): string {
  if (status === "UP") return "text-green-600";
  if (status === "DOWN") return "text-red-500";
  return "text-slate-400";
}

function overallBanner(overallStatus: OverallHealthStatus) {
  if (overallStatus === "UP")
    return {
      bg: "bg-green-50 border-green-200",
      text: "text-green-700",
      dot: "bg-green-500",
      label: "Tất cả dịch vụ hoạt động bình thường",
    };
  if (overallStatus === "DEGRADED")
    return {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
      label: "Một số dịch vụ đang gặp sự cố",
    };
  return {
    bg: "bg-red-50 border-red-200",
    text: "text-red-600",
    dot: "bg-red-500",
    label: "Hệ thống đang gặp sự cố nghiêm trọng",
  };
}

function ServiceRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-2 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-3 bg-slate-200 rounded w-44" />
        <div className="h-2.5 bg-slate-100 rounded w-24" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-slate-200 rounded-full" />
        <div className="h-2.5 bg-slate-200 rounded w-20" />
      </div>
    </div>
  );
}

function formatCheckedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function SystemHealthPage() {
  const { data, isLoading, isError, refetch, isFetching } = useSystemHealth();

  const banner = data ? overallBanner(data.overallStatus) : null;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">
            Sức khỏe hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Trạng thái hoạt động của các microservice
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            strokeWidth={2}
          />
          Làm mới
        </button>
      </div>

      {/* Overall status banner */}
      {!isLoading && !isError && banner && data && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 shrink-0 ${banner.bg}`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${banner.dot}`} />
          <Activity
            className={`w-4 h-4 shrink-0 ${banner.text}`}
            strokeWidth={2}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold ${banner.text}`}>{banner.label}</p>
            <p className={`text-xs mt-0.5 ${banner.text} opacity-75`}>
              Cập nhật lúc: {formatCheckedAt(data.checkedAt)}
            </p>
          </div>
          <div className="flex gap-3 text-xs font-semibold shrink-0">
            <span className="text-green-600">{data.upServices} hoạt động</span>
            <span className="text-slate-400">·</span>
            <span className="text-red-500">{data.downServices} lỗi</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">
              {data.totalServices - data.upServices - data.downServices} không
              rõ
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm gap-3 shrink-0">
          <XCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-slate-600">
            Không thể tải trạng thái dịch vụ
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Service list — 2-col grid, fills remaining height, scrolls internally */}
      {!isError && (
        <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-500" strokeWidth={2} />
              <h2 className="text-sm font-bold text-slate-700">
                Danh sách dịch vụ
              </h2>
            </div>
            {data && (
              <span className="text-xs text-slate-400">
                {data.totalServices} dịch vụ
              </span>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <ServiceRowSkeleton key={i} />
                  ))
                : data?.services.map((svc) => (
                    <div
                      key={svc.serviceId}
                      className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {svc.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-400">
                            {svc.serviceId}
                          </p>
                          {svc.instances > 0 && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-400">
                                {svc.instances}{" "}
                                {svc.instances === 1 ? "instance" : "instances"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {svc.responseTimeMs != null && (
                          <span className="text-xs text-slate-400 tabular-nums">
                            {svc.responseTimeMs}ms
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={svc.status} />
                          <span
                            className={`text-xs font-semibold ${statusTextColor(svc.status)}`}
                          >
                            {statusLabel(svc.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
