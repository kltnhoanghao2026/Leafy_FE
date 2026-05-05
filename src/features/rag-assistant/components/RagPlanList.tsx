import { Eye, FileText } from "lucide-react";
import type { RagPlan } from "../types";
import { getPlanStepCount, getPlanTitle } from "../utils/ragResponse";

interface RagPlanListProps {
  plans: RagPlan[];
  onView: (plan: RagPlan) => void;
}

const formatDate = (value?: string) => {
  if (!value) return "KhÃÂ´ng rÃÂµ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function RagPlanList({ plans, onView }: RagPlanListProps) {
  if (!plans.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-slate-300" strokeWidth={2.5} />
        <h3 className="mt-4 text-xl font-black text-slate-900">
          ChÃÂ°a cÃÂ³ kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI nÃÂ o
        </h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Khi RAG tÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch xÃ¡Â»Â­ lÃÂ½ bÃ¡Â»â¡nh, danh sÃÂ¡ch sÃ¡ÂºÂ½ hiÃ¡Â»Æn thÃ¡Â»â¹ tÃ¡ÂºÂ¡i ÃâÃÂ¢y.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {plans.map((plan) => {
        const planKey = plan.planId || plan.id || getPlanTitle(plan);
        const stepCount = getPlanStepCount(plan);

        return (
          <article
            key={planKey}
            className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {getPlanTitle(plan)}
                </h3>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {plan.diseaseName || "VÃ¡ÂºÂ¥n ÃâÃ¡Â»Â chÃÂ°a xÃÂ¡c ÃâÃ¡Â»â¹nh"}
                </p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-[#245A34]">
                {plan.status || plan.urgency || "AI plan"}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {plan.summary || plan.question || "KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch ÃâÃÂ°Ã¡Â»Â£c tÃ¡ÂºÂ¡o bÃ¡Â»Å¸i RAG Assistant."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-400">
              <span>{formatDate(plan.createdAt)}</span>
              <span>{stepCount ? `${stepCount} bÃÂ°Ã¡Â»âºc/lÃ¡Â»â¹ch` : "ChÃÂ°a rÃÂµ sÃ¡Â»â bÃÂ°Ã¡Â»âºc"}</span>
            </div>
            <button
              type="button"
              onClick={() => onView(plan)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#245A34] bg-white px-4 py-3 text-sm font-bold text-[#245A34] hover:bg-green-50"
            >
              <Eye className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Xem chi tiÃ¡ÂºÂ¿t
            </button>
          </article>
        );
      })}
    </div>
  );
}
