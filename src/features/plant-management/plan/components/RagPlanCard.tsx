import { Bot, Clock, FileText, Globe, ShieldAlert, Webhook } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../../lib/routes";
import type { RagPlanResponse } from "../../shared/types";
import { formatDate } from "../shared/utils/planUtils";

export interface RagPlanCardProps {
  plan: RagPlanResponse;
  variant?: "grid" | "list";
  detailUrl?: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LOW:      { bg: "bg-green-50",    text: "text-green-700", border: "border-green-200" },
  MEDIUM:   { bg: "bg-amber-50",   text: "text-amber-700", border: "border-amber-200" },
  HIGH:     { bg: "bg-red-50",     text: "text-red-700",   border: "border-red-200" },
  CRITICAL: { bg: "bg-rose-50",    text: "text-rose-700",  border: "border-rose-200" },
};

function getSeverityStyle(level: string | null) {
  const key = (level ?? "").toUpperCase();
  return SEVERITY_STYLES[key] ?? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
}

function RagPlanCardGrid({ plan, detailUrl }: Omit<RagPlanCardProps, "variant">) {
  const sev = getSeverityStyle(plan.severityLevel);
  const confidence = plan.confidenceScore != null ? Math.round(plan.confidenceScore * 100) : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 shrink-0 text-purple-600" />
            <h3 className="truncate text-base font-black text-slate-900">
              {plan.diseaseName || "Kế hoạch AI"}
            </h3>
          </div>
          {plan.planName && (
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {plan.planName}
            </p>
          )}
          {plan.successIndicators && (
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400">
              {plan.successIndicators}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {confidence != null && (
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-black bg-purple-50 text-purple-700 ring-1 ring-purple-200">
              {confidence}% tin cậy
            </span>
          )}
        </div>
      </div>

      <div className="mx-5 border-t border-slate-100" />

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-xs sm:grid-cols-3">
        {plan.severityLevel && (
          <div className={`rounded-2xl ${sev.bg} p-3`}>
            <p className="font-black uppercase tracking-wide text-slate-400 text-[10px]">Mức độ</p>
            <p className={`mt-1 font-bold ${sev.text}`}>{plan.severityLevel}</p>
          </div>
        )}
        {plan.estimatedCost && (
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="font-black uppercase tracking-wide text-slate-400 text-[10px]">Chi phí</p>
            <p className="mt-1 truncate font-bold text-slate-800">{plan.estimatedCost}</p>
          </div>
        )}
        {plan.schedule && plan.schedule.length > 0 && (
          <div className="rounded-2xl bg-blue-50 p-3">
            <p className="font-black uppercase tracking-wide text-slate-400 text-[10px]">Sự kiện</p>
            <p className="mt-1 font-bold text-blue-700">{plan.schedule.length}</p>
          </div>
        )}
      </div>

      {/* Source counts */}
      <div className="mx-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
        {plan.sourceDocuments && plan.sourceDocuments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            {plan.sourceDocuments.length} tài liệu
          </span>
        )}
        {plan.webSearchResults && plan.webSearchResults.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            {plan.webSearchResults.length} web
          </span>
        )}
        {plan.safetyWarnings && plan.safetyWarnings.length > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <ShieldAlert className="h-3.5 w-3.5" />
            {plan.safetyWarnings.length} cảnh báo
          </span>
        )}
      </div>

      {/* Action bar */}
      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
        <Link
          to={detailUrl ?? ROUTES.DASHBOARD.PLAN_RAG_DETAIL(plan.planId)}
          className="inline-flex items-center justify-center rounded-xl bg-[#245A34] px-4 py-2 text-xs font-bold text-white hover:bg-[#1b432a]"
        >
          Xem chi tiết
        </Link>
        <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {formatDate(plan.lastModifiedAt || plan.createdAt)}
        </span>
      </div>
    </article>
  );
}

function RagPlanCardList({ plan, detailUrl }: Omit<RagPlanCardProps, "variant">) {
  const sev = getSeverityStyle(plan.severityLevel);
  const confidence = plan.confidenceScore != null ? Math.round(plan.confidenceScore * 100) : null;

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md">
      {/* AI badge */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100">
        <Bot className="h-4 w-4 text-purple-700" />
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">
          {plan.diseaseName || "Kế hoạch AI"}
        </p>
        {plan.planName && (
          <p className="truncate text-xs font-semibold text-slate-500">
            {plan.planName}
          </p>
        )}
      </div>

      {/* Confidence */}
      {confidence != null && (
        <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-black text-purple-700">
          {confidence}%
        </span>
      )}

      {/* Severity */}
      {plan.severityLevel && (
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ${sev.bg} ${sev.text}`}
        >
          {plan.severityLevel}
        </span>
      )}

      {/* Source counts */}
      <div className="hidden shrink-0 items-center gap-2 text-xs text-slate-400 lg:flex">
        {plan.sourceDocuments && plan.sourceDocuments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {plan.sourceDocuments.length}
          </span>
        )}
        {plan.webSearchResults && plan.webSearchResults.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Webhook className="h-3 w-3" />
            {plan.webSearchResults.length}
          </span>
        )}
      </div>

      {/* Date */}
      <span className="hidden shrink-0 text-xs font-semibold text-slate-400 lg:block">
        {formatDate(plan.createdAt)}
      </span>

      {/* Action */}
      <Link
        to={detailUrl ?? ROUTES.DASHBOARD.PLAN_RAG_DETAIL(plan.planId)}
        className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#245A34] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1b432a]"
      >
        Chi tiết
      </Link>
    </article>
  );
}

export function RagPlanCard(props: RagPlanCardProps) {
  const { variant = "grid" } = props;
  if (variant === "list") return <RagPlanCardList {...props} />;
  return <RagPlanCardGrid {...props} />;
}
