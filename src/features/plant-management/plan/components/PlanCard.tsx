import { AlertTriangle, Banknote, BarChart2, Check, Clock, MapPin, Sprout, Trash2, UserCheck } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFarmZones } from "../../../farm-management/queries";
import type { PlanResponse, TreatmentStatus } from "../../shared/types";
import { formatDate, TREATMENT_STATUS_LABELS } from "../../shared/components/displayUtils";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 ring-amber-200",
  APPLYING:  "bg-purple-50 text-purple-700 ring-purple-200",
  ACTIVE:    "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-emerald-50 text-[#245A34] ring-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const SEVERITY_LABEL: Record<string, string> = {
  LOW: "Nhẹ",
  MEDIUM: "Trung bình",
  HIGH: "Nghiêm trọng",
  CRITICAL: "Rất nghiêm trọng",
};

const SEVERITY_STYLE: Record<string, string> = {
  LOW:      "text-emerald-600",
  MEDIUM:   "text-amber-600",
  HIGH:     "text-orange-600",
  CRITICAL: "text-red-600",
};

const URGENCY_LABEL: Record<string, string> = {
  LOW:      "Thấp",
  MEDIUM:   "Trung bình",
  HIGH:     "Cao",
  CRITICAL: "Rất khẩn",
};

const URGENCY_STYLE: Record<string, string> = {
  LOW:      "text-emerald-600",
  MEDIUM:   "text-amber-600",
  HIGH:     "text-orange-600",
  CRITICAL: "text-red-600",
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface PlanCardProps {
  plan: PlanResponse;
  plantLabel?: string | null;
  plotName?: string | null;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (plan: PlanResponse) => void;
  onStatusChange: (planId: string, status: TreatmentStatus) => void;
  detailUrl: string;
  variant?: "grid" | "list";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SelectCheckbox({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className={`inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition-all
        ${checked
          ? "border-[#245A34] bg-[#245A34]"
          : "border-slate-300 bg-white hover:border-[#245A34]"
        }`}
    >
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </span>
  );
}

function ZoneTile({
  farmPlotId,
  farmZoneId,
}: {
  farmPlotId?: string | null;
  farmZoneId?: string | null;
}) {
  const zonesQuery = useFarmZones(farmPlotId ?? "", Boolean(farmPlotId));
  const zoneName = farmZoneId
    ? (zonesQuery.data ?? []).find((z) => z.id === farmZoneId)?.zoneName ?? farmZoneId
    : "Chưa gắn khu";

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="font-black uppercase tracking-wide text-slate-400">Khu vực</p>
        <p className="truncate font-bold text-slate-800">{zoneName}</p>
      </div>
    </div>
  );
}

// ── Grid variant ──────────────────────────────────────────────────────────────

function PlanCardGrid({
  plan,
  plantLabel,
  plotName,
  selected,
  onToggleSelect,
  onDelete,
  onStatusChange,
  detailUrl,
}: PlanCardProps) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
        selected
          ? "border-[#245A34] bg-emerald-50/40 ring-1 ring-[#245A34]/20"
          : "border-slate-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <SelectCheckbox checked={selected} onClick={() => onToggleSelect(plan.id)} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-black text-slate-900">
            {plan.planName || plan.diseaseName || "Kế hoạch điều trị"}
          </h3>
          {plan.planName && plan.diseaseName && (
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {plan.diseaseName}
            </p>
          )}
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400">
            {plan.successIndicators || plan.question || "Kế hoạch AI chỉ mang tính hỗ trợ"}
          </p>
          {plan.isConsulted && plan.creatorInfo && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-emerald-700">
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              {plan.creatorInfo.fullName ?? "Chuyên gia"}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${
            STATUS_STYLE[plan.status] ?? "bg-slate-100 text-slate-500 ring-slate-200"
          }`}
        >
          {(TREATMENT_STATUS_LABELS as Record<string, string>)[plan.status] ?? plan.status}
        </span>
      </div>

      <div className="mx-5 border-t border-slate-100" />

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-xs sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="font-black uppercase tracking-wide text-slate-400">Vườn</p>
            <p className="truncate font-bold text-slate-800">{plotName || "—"}</p>
          </div>
        </div>
        <ZoneTile farmPlotId={plan.farmPlotId} farmZoneId={plan.farmZoneId} />
        <div className="flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="font-black uppercase tracking-wide text-slate-400">Mức độ</p>
            <p className={`truncate font-bold ${
              SEVERITY_STYLE[plan.severityLevel ?? ""] ?? "text-slate-800"
            }`}>
              {SEVERITY_LABEL[plan.severityLevel ?? ""] || plan.severityLevel || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="font-black uppercase tracking-wide text-slate-400">Độ khẩn</p>
            <p className={`truncate font-bold ${
              URGENCY_STYLE[plan.urgency ?? ""] ?? "text-slate-800"
            }`}>
              {URGENCY_LABEL[plan.urgency ?? ""] || plan.urgency || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Banknote className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="font-black uppercase tracking-wide text-slate-400">Chi phí</p>
            <p className="truncate font-bold text-slate-800">{plan.estimatedCost || "—"}</p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
        <Link
          to={detailUrl}
          className="inline-flex items-center justify-center rounded-xl bg-[#245A34] px-4 py-2 text-xs font-bold text-white hover:bg-[#1b432a]"
        >
          Xem chi tiết
        </Link>
        <span className="ml-2 flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {formatDate(plan.lastModifiedAt || plan.createdAt)}
        </span>
        <button
          type="button"
          onClick={() => onDelete(plan)}
          className="ml-auto inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100"
          aria-label="Xóa kế hoạch"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

// ── List variant ──────────────────────────────────────────────────────────────

function PlanCardList({
  plan,
  plantLabel,
  plotName,
  selected,
  onToggleSelect,
  onDelete,
  onStatusChange,
  detailUrl,
}: PlanCardProps) {
  const severity = plan.severityLevel ?? "";

  return (
    <article
      className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all ${
        selected
          ? "border-[#245A34] bg-emerald-50/40 ring-1 ring-[#245A34]/20"
          : "border-slate-100"
      }`}
    >
      <SelectCheckbox checked={selected} onClick={() => onToggleSelect(plan.id)} />

      {/* Status badge */}
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ring-1 hidden sm:inline-flex ${
          STATUS_STYLE[plan.status] ?? "bg-slate-100 text-slate-500 ring-slate-200"
        }`}
      >
        {(TREATMENT_STATUS_LABELS as Record<string, string>)[plan.status] ?? plan.status}
      </span>

      {/* Name / question */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">
          {plan.diseaseName || "Kế hoạch điều trị"}
        </p>
        <p className="truncate text-xs font-semibold text-slate-400">
          {plan.question || plan.successIndicators || "—"}
        </p>
        {plan.isConsulted && plan.creatorInfo && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-semibold text-emerald-700">
            <UserCheck className="h-3 w-3 shrink-0" />
            {plan.creatorInfo.fullName ?? "Chuyên gia"}
          </p>
        )}
      </div>

      {/* Plant */}
      <div className="hidden min-w-0 items-center gap-1 lg:flex">
        <Sprout className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate text-xs font-semibold text-slate-600">
          {plantLabel || "—"}
        </span>
      </div>

      {/* Plot */}
      <div className="hidden min-w-0 items-center gap-1 xl:flex">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate text-xs font-semibold text-slate-600">
          {plotName || "—"}
        </span>
      </div>

      {/* Severity */}
      <span
        className={`hidden shrink-0 text-xs font-bold md:block ${
          SEVERITY_STYLE[severity] ?? "text-slate-500"
        }`}
      >
        {SEVERITY_LABEL[severity] || severity || "—"}
      </span>

      {/* Date */}
      <span className="hidden shrink-0 text-xs font-semibold text-slate-400 lg:block">
        {formatDate(plan.createdAt)}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to={detailUrl}
          className="inline-flex items-center justify-center rounded-xl bg-[#245A34] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1b432a]"
        >
          Xem
        </Link>
        <button
          type="button"
          onClick={() => onDelete(plan)}
          className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
          aria-label="Xóa"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function PlanCard(props: PlanCardProps) {
  const { variant = "grid" } = props;
  if (variant === "list") return <PlanCardList {...props} />;
  return <PlanCardGrid {...props} />;
}
