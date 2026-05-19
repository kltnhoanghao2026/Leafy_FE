import { AlertTriangle, Banknote, BarChart2, Bot, Check, Clock, Globe, MapPin, Play, Sprout, Trash2, UserCheck } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFarmZones } from "../../../farm-management/queries";
import type { PlanResponse, TreatmentStatus } from "../../shared/types";
import { formatDate } from "../../shared/components/displayUtils";
import { usePlantManagementLabels } from "../../shared/components/useDisplayLabels";
import { useTranslation } from "../../../../i18n";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 ring-amber-200",
  APPLYING:  "bg-purple-50 text-purple-700 ring-purple-200",
  ACTIVE:    "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-emerald-50 text-[#245A34] ring-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const SEVERITY_STYLE: Record<string, string> = {
  LOW: "text-blue-700 bg-blue-50 ring-1 ring-blue-200/50 rounded-full px-2 py-0.5",
  MEDIUM: "text-amber-700 bg-amber-50 ring-1 ring-amber-200/50 rounded-full px-2 py-0.5",
  HIGH: "text-red-700 bg-red-50 ring-1 ring-red-200/50 rounded-full px-2 py-0.5",
  CRITICAL: "text-rose-700 bg-rose-50 ring-1 ring-rose-200/50 rounded-full px-2 py-0.5",
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
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onDelete?: (plan: PlanResponse) => void;
  onStatusChange?: (planId: string, status: TreatmentStatus) => void;
  /** Called when the user clicks "Áp dụng" on a public plan card */
  onApply?: () => void;
  detailUrl: string;
  variant?: "grid" | "list";
  /** When true, renders owner info and hides delete/select controls */
  isPublicView?: boolean;
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
  const { t } = useTranslation();
  const zonesQuery = useFarmZones(farmPlotId ?? "", Boolean(farmPlotId));
  const zoneName = farmZoneId
    ? (zonesQuery.data ?? []).find((z) => z.id === farmZoneId)?.zoneName ?? farmZoneId
    : t('plantManagement.plan.noZone');

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="font-black uppercase tracking-wide text-slate-400">{t('plantManagement.plan.zoneLabel')}</p>
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
  selected = false,
  onToggleSelect,
  onDelete,
  onStatusChange,
  onApply,
  detailUrl,
  isPublicView = false,
}: PlanCardProps) {
  const { t } = useTranslation();
  const { treatmentStatusLabel, severityLabel } = usePlantManagementLabels();
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
        {!isPublicView && onToggleSelect && (
          <SelectCheckbox checked={selected} onClick={() => onToggleSelect(plan.id)} />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-black text-slate-900">
            {plan.planName || plan.diseaseName || t('plantManagement.plan.unknownPlan')}
          </h3>
          {plan.planName && plan.diseaseName && (
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {plan.diseaseName}
            </p>
          )}
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400">
            {plan.successIndicators || t('plantManagement.plan.aiDisclaimer')}
          </p>
          {plan.sourceType === 'CONSULTED' && plan.creatorInfo && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-emerald-700">
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              {plan.creatorInfo.fullName ?? t('plantManagement.plan.expert')}
            </p>
          )}
          {plan.sourceType === 'RAG_GEN' && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-purple-600">
              <Bot className="h-3.5 w-3.5 shrink-0" />
              AI tạo
            </p>
          )}
          {isPublicView && plan.ownerInfo && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-blue-600">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              {plan.ownerInfo.fullName ?? "Nông dân"}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${(plan.applyCount ?? 0) > 0 ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}
        >
          {(plan.applyCount ?? 0) > 0 ? `${plan.applyCount} áp dụng` : "Chưa áp dụng"}
        </span>
      </div>

      <div className="mx-5 border-t border-slate-100" />

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-xs sm:grid-cols-3">
        {!isPublicView && (
          <>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="font-black uppercase tracking-wide text-slate-400">{t('plantManagement.plan.farmLabel')}</p>
                <p className="truncate font-bold text-slate-800">{plotName || "—"}</p>
              </div>
            </div>
            <ZoneTile farmPlotId={null} farmZoneId={null} />
          </>
        )}
        <div className="flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="font-black uppercase tracking-wide text-slate-400">{t('plantManagement.plan.severityLabel')}</p>
            <p className={`truncate font-bold ${
              SEVERITY_STYLE[plan.severityLevel ?? ""] ?? "text-slate-800"
            }`}>
              {severityLabel(plan.severityLevel)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Banknote className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="font-black uppercase tracking-wide text-slate-400">{t('plantManagement.plan.costLabel')}</p>
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
          {t('plantManagement.common.viewDetail')}
        </Link>
        {isPublicView && onApply && (
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#245A34] px-4 py-2 text-xs font-bold text-[#245A34] hover:bg-emerald-50"
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
            Áp dụng
          </button>
        )}
        <span className="ml-2 flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {formatDate(plan.lastModifiedAt || plan.createdAt)}
        </span>
        {!isPublicView && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(plan)}
            className="ml-auto inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100"
            aria-label={t('plantManagement.common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

// ── List variant ──────────────────────────────────────────────────────────────

function PlanCardList({
  plan,
  plantLabel,
  plotName,
  selected = false,
  onToggleSelect,
  onDelete,
  onStatusChange,
  onApply,
  detailUrl,
  isPublicView = false,
}: PlanCardProps) {
  const { t } = useTranslation();
  const { treatmentStatusLabel, severityLabel } = usePlantManagementLabels();
  const severity = plan.severityLevel ?? "";

  return (
    <article
      className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all ${
        selected
          ? "border-[#245A34] bg-emerald-50/40 ring-1 ring-[#245A34]/20"
          : "border-slate-100"
      }`}
    >
      {!isPublicView && onToggleSelect && (
        <SelectCheckbox checked={selected} onClick={() => onToggleSelect(plan.id)} />
      )}

      {/* Status badge */}
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ring-1 hidden sm:inline-flex ${(plan.applyCount ?? 0) > 0 ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}
      >
        {(plan.applyCount ?? 0) > 0 ? `${plan.applyCount} áp dụng` : "Chưa áp dụng"}
      </span>

      {/* Name / question */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">
          {plan.diseaseName || t('plantManagement.plan.unknownPlan')}
        </p>
        <p className="truncate text-xs font-semibold text-slate-400">
          {plan.successIndicators || "—"}
        </p>
        {plan.sourceType === 'CONSULTED' && plan.creatorInfo && (
          <p className="flex items-center gap-1 truncate text-xs font-semibold text-emerald-700">
            <UserCheck className="h-3 w-3 shrink-0" />
            {plan.creatorInfo.fullName ?? t('plantManagement.plan.expert')}
          </p>
        )}
        {plan.sourceType === 'RAG_GEN' && (
          <p className="flex items-center gap-1 truncate text-xs font-semibold text-purple-600">
            <Bot className="h-3 w-3 shrink-0" />
            AI tạo
          </p>
        )}
        {isPublicView && plan.ownerInfo && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-semibold text-blue-600">
            <Globe className="h-3 w-3 shrink-0" />
            {plan.ownerInfo.fullName ?? "Nông dân"}
          </p>
        )}
      </div>

      {/* Plant */}
      {!isPublicView && (
        <div className="hidden min-w-0 items-center gap-1 lg:flex">
          <Sprout className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate text-xs font-semibold text-slate-600">
            {plantLabel || "—"}
          </span>
        </div>
      )}

      {/* Plot */}
      {!isPublicView && (
        <div className="hidden min-w-0 items-center gap-1 xl:flex">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate text-xs font-semibold text-slate-600">
            {plotName || "—"}
          </span>
        </div>
      )}

      {/* Severity */}
      <span
        className={`hidden shrink-0 text-xs font-bold md:block ${
          SEVERITY_STYLE[severity] ?? "text-slate-500"
        }`}
      >
        {severityLabel(severity || null)}
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
          {t('plantManagement.common.viewShort')}
        </Link>
        {isPublicView && onApply && (
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1 rounded-xl border border-[#245A34] px-3 py-1.5 text-xs font-bold text-[#245A34] hover:bg-emerald-50"
          >
            <Play className="h-3 w-3" strokeWidth={2.5} />
            Áp dụng
          </button>
        )}
        {!isPublicView && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(plan)}
            className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
            aria-label={t('plantManagement.common.delete')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
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
