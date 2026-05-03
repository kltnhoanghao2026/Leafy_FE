import { Link } from "react-router-dom";
import { CalendarDays, FileText } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import type { RagPlan } from "../types";
import { getPlanStepCount, getPlanTitle } from "../utils/ragResponse";

interface PlanPreviewCardProps {
  plan: RagPlan;
  onCreatePlan?: (plan: RagPlan) => void;
}

const summarizeSchedule = (schedule: unknown) => {
  if (!schedule) return null;
  if (typeof schedule === "string") return schedule;
  if (Array.isArray(schedule)) return `${schedule.length} mÃ¡Â»Â¥c trong lÃ¡Â»â¹ch`;
  if (typeof schedule === "object") return "CÃÂ³ lÃ¡Â»â¹ch chÃÆm sÃÂ³c chi tiÃ¡ÂºÂ¿t";
  return null;
};

export function PlanPreviewCard({
  plan,
  onCreatePlan,
}: PlanPreviewCardProps) {
  const stepCount = getPlanStepCount(plan);
  const title = getPlanTitle(plan);
  const scheduleSummary = summarizeSchedule(plan.schedule);

  return (
    <article className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI ÃâÃ¡Â»Â xuÃ¡ÂºÂ¥t
          </p>
          <h4 className="mt-2 text-lg font-black text-slate-900">{title}</h4>
          {plan.diseaseName ? (
            <p className="mt-1 text-sm font-bold text-emerald-800">
              VÃ¡ÂºÂ¥n ÃâÃ¡Â»Â: {plan.diseaseName}
            </p>
          ) : null}
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
          {stepCount ? `${stepCount} bÃÂ°Ã¡Â»âºc` : "KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch nhÃÂ¡p"}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
        {plan.summary ||
          scheduleSummary ||
          "AI ÃâÃÂ£ tÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch xÃ¡Â»Â­ lÃÂ½. BÃ¡ÂºÂ¡n cÃÂ³ thÃ¡Â»Æ review vÃÂ  tÃ¡ÂºÂ¡o treatment plan thÃ¡ÂºÂ­t cho cÃÂ¢y/vÃÂ°Ã¡Â»Ân."}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          to={ROUTES.DASHBOARD.PLANS}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
        >
          <FileText className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Xem kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch
        </Link>
        <button
          type="button"
          onClick={() => onCreatePlan?.(plan)}
          disabled={!onCreatePlan}
          title={
            onCreatePlan
              ? "Review vÃÂ  tÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹"
              : "ChÃÂ°a cÃÂ³ handler tÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch"
          }
          className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#245A34] hover:bg-emerald-100 disabled:text-slate-400 disabled:hover:bg-white"
        >
          TÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹
        </button>
      </div>
    </article>
  );
}
