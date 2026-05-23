import { Link } from "react-router-dom";
import {
  CalendarDays,
  Leaf,
  LayoutGrid,
  TreePine,
  X,
} from "lucide-react";
import type { PlanApplyResponse, TreatmentStatus } from "../../shared/types";
import { ROUTES } from "../../../../lib/routes";
import { formatDate } from "../shared/utils/planUtils";
import { STATUS_CONFIG } from "../schemas/display.schema";

interface PlanApplyCardProps {
  apply: PlanApplyResponse;
  /** Plan name to display — fetched externally by the parent. */
  planName?: string | null;
  variant?: "grid" | "list";
  onStatusChange?: (applyId: string, status: TreatmentStatus) => void;
  /** Callback to trigger cancel flow. When provided and apply is ACTIVE + canCancel, a cancel button appears. */
  onCancelApply?: (apply: PlanApplyResponse) => void;
}

export function PlanApplyCard({
  apply,
  planName,
  variant = "grid",
  onStatusChange,
  onCancelApply,
}: PlanApplyCardProps) {
  const cfg = STATUS_CONFIG[apply.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  const scopeLabel = apply.targetName || (apply.plantId
    ? "Cây cụ thể"
    : apply.farmZoneId
      ? "Khu vực"
      : apply.farmPlotId
        ? "Vườn"
        : "Không rõ");
  const ScopeIcon = apply.plantId
    ? Leaf
    : apply.farmZoneId
      ? LayoutGrid
      : TreePine;
  const scopeId = apply.plantId || apply.farmZoneId || apply.farmPlotId || "—";

  if (variant === "list") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition-all hover:shadow-md">
        {/* Status icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
          <StatusIcon className={`h-5 w-5 ${cfg.text}`} strokeWidth={2.5} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.DASHBOARD.PLAN_APPLY_DETAIL(apply.id)}
              className="truncate text-sm font-black text-slate-900 hover:text-[#245A34] hover:underline"
            >
              {planName || apply.planName || apply.diseaseName || apply.planId}
            </Link>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
              {cfg.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {formatDate(apply.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <ScopeIcon className="h-3 w-3" /> {scopeLabel}
            </span>
            <span>{apply.plantEventIds?.length ?? 0} sự kiện</span>
          </div>
        </div>

        {/* Status change */}
        {onStatusChange && (
          <select
            value={apply.status}
            onChange={(e) => onStatusChange(apply.id, e.target.value as TreatmentStatus)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-[#245A34] focus:ring-1 focus:ring-[#245A34]/20"
          >
            {(Object.keys(STATUS_CONFIG) as TreatmentStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        )}

        {/* Cancel button — only for ACTIVE applies that are cancellable */}
        {onCancelApply && apply.status === "ACTIVE" && apply.canCancel !== false && (
          <button
            type="button"
            onClick={() => onCancelApply(apply)}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            Hủy
          </button>
        )}
      </div>
    );
  }

  // ── Grid card ──
  return (
    <article className="group relative flex flex-col rounded-[1.75rem] overflow-hidden border border-slate-100 bg-white shadow-sm transition-all hover:shadow-lg hover:border-slate-200">
      {/* Top accent */}
      <div className={`h-1.5 w-full shrink-0 ${
        apply.status === "ACTIVE" ? "bg-gradient-to-r from-blue-500 to-cyan-400"
        : apply.status === "COMPLETED" ? "bg-gradient-to-r from-emerald-500 to-green-400"
        : apply.status === "APPLYING" ? "bg-gradient-to-r from-purple-500 to-violet-400"
        : apply.status === "CANCELLED" ? "bg-gradient-to-r from-slate-400 to-slate-300"
        : "bg-gradient-to-r from-amber-400 to-yellow-300"
      }`} />

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              to={ROUTES.DASHBOARD.PLAN_APPLY_DETAIL(apply.id)}
              className="block truncate text-[15px] font-black text-slate-900 group-hover:text-[#245A34] transition-colors"
            >
              {planName || apply.planName || apply.diseaseName || apply.planId}
            </Link>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Áp dụng lúc {formatDate(apply.createdAt)}
            </p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
            <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
            {cfg.label}
          </span>
        </div>

        {/* Scope + date */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phạm vi</p>
            <div className="mt-1 flex items-center gap-1.5">
              <ScopeIcon className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 truncate">{scopeLabel}</span>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bắt đầu</p>
            <div className="mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">{formatDate(apply.startDate)}</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <span className="shrink-0">{apply.plantEventIds?.length ?? 0} sự kiện</span>
          <span className="flex items-center gap-1 min-w-0">
            <span className="shrink-0">ID:</span>
            <span className="font-mono text-[10px] text-slate-500 truncate">{scopeId.slice(0, 8)}…</span>
          </span>
        </div>

        {/* Actions */}
        {onStatusChange && (
          <div className="mt-auto pt-2 border-t border-slate-100">
            <select
              value={apply.status}
              onChange={(e) => onStatusChange(apply.id, e.target.value as TreatmentStatus)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-[#245A34] focus:ring-1 focus:ring-[#245A34]/20"
            >
              {(Object.keys(STATUS_CONFIG) as TreatmentStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Cancel button — only for ACTIVE applies that are cancellable */}
        {onCancelApply && apply.status === "ACTIVE" && apply.canCancel !== false && (
          <div className="mt-auto pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onCancelApply(apply)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              Hủy áp dụng
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
