import { Eye, FileText } from "lucide-react";
import type { RagTreatmentPlan } from "../types";
import { getPlanStepCount, getPlanTitle } from "../utils/ragResponse";

interface RagTreatmentPlanListProps {
  plans: RagTreatmentPlan[];
  onView: (plan: RagTreatmentPlan) => void;
}

const formatDate = (value?: string) => {
  if (!value) return "Không rõ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function RagTreatmentPlanList({ plans, onView }: RagTreatmentPlanListProps) {
  if (!plans.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-slate-300" strokeWidth={2.5} />
        <h3 className="mt-4 text-xl font-black text-slate-900">
          Chưa có kế hoạch AI nào
        </h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Khi RAG tạo kế hoạch xử lý bệnh, danh sách sẽ hiển thị tại đây.
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
                  {plan.diseaseName || "Vấn đề chưa xác định"}
                </p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-[#245A34]">
                {plan.status || plan.urgency || "AI plan"}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {plan.summary || plan.question || "Kế hoạch được tạo bởi RAG Assistant."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-400">
              <span>{formatDate(plan.createdAt)}</span>
              <span>{stepCount ? `${stepCount} bước/lịch` : "Chưa rõ số bước"}</span>
            </div>
            <button
              type="button"
              onClick={() => onView(plan)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#245A34] bg-white px-4 py-3 text-sm font-bold text-[#245A34] hover:bg-green-50"
            >
              <Eye className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Xem chi tiết
            </button>
          </article>
        );
      })}
    </div>
  );
}
