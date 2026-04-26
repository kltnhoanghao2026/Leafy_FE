import { Link } from "react-router-dom";
import { CalendarDays, FileText } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import type { RagTreatmentPlan } from "../types";
import { getPlanStepCount, getPlanTitle } from "../utils/ragResponse";

interface TreatmentPlanPreviewCardProps {
  plan: RagTreatmentPlan;
  onCreateTreatmentPlan?: (plan: RagTreatmentPlan) => void;
}

const summarizeSchedule = (schedule: unknown) => {
  if (!schedule) return null;
  if (typeof schedule === "string") return schedule;
  if (Array.isArray(schedule)) return `${schedule.length} mục trong lịch`;
  if (typeof schedule === "object") return "Có lịch chăm sóc chi tiết";
  return null;
};

export function TreatmentPlanPreviewCard({
  plan,
  onCreateTreatmentPlan,
}: TreatmentPlanPreviewCardProps) {
  const stepCount = getPlanStepCount(plan);
  const title = getPlanTitle(plan);
  const scheduleSummary = summarizeSchedule(plan.schedule);

  return (
    <article className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Kế hoạch AI đề xuất
          </p>
          <h4 className="mt-2 text-lg font-black text-slate-900">{title}</h4>
          {plan.diseaseName ? (
            <p className="mt-1 text-sm font-bold text-emerald-800">
              Vấn đề: {plan.diseaseName}
            </p>
          ) : null}
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
          {stepCount ? `${stepCount} bước` : "Kế hoạch nháp"}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
        {plan.summary ||
          scheduleSummary ||
          "AI đã tạo kế hoạch xử lý. Bạn có thể review và tạo treatment plan thật cho cây/vườn."}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          to={ROUTES.DASHBOARD.RAG_TREATMENT_PLANS}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
        >
          <FileText className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Xem kế hoạch
        </Link>
        <button
          type="button"
          onClick={() => onCreateTreatmentPlan?.(plan)}
          disabled={!onCreateTreatmentPlan}
          title={
            onCreateTreatmentPlan
              ? "Review và tạo kế hoạch điều trị"
              : "Chưa có handler tạo kế hoạch"
          }
          className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#245A34] hover:bg-emerald-100 disabled:text-slate-400 disabled:hover:bg-white"
        >
          Tạo kế hoạch điều trị
        </button>
      </div>
    </article>
  );
}
