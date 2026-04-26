import { ClipboardList } from "lucide-react";
import type { TreatmentPlanResponse } from "../types";
import { formatDate, TREATMENT_STATUS_LABELS } from "./displayUtils";

interface TreatmentPlanListProps {
  plans: TreatmentPlanResponse[];
  isLoading?: boolean;
  isError?: boolean;
}

export function TreatmentPlanList({
  plans,
  isLoading = false,
  isError = false,
}: TreatmentPlanListProps) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-2xl bg-amber-50 p-3 text-amber-700">
          <ClipboardList className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Kế hoạch điều trị
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            Danh sách kế hoạch đã tạo cho cây trồng này.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label="Đang tải kế hoạch điều trị">
          {[0, 1].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          Không tải được kế hoạch điều trị.
        </div>
      ) : null}

      {!isLoading && !isError && plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
          Chưa có kế hoạch điều trị cho cây này.
        </div>
      ) : null}

      <div className="space-y-3">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {plan.diseaseName || plan.question || "Kế hoạch điều trị"}
                </h4>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {plan.successIndicators || "Chưa có mô tả kết quả mong muốn"}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                {TREATMENT_STATUS_LABELS[plan.status] ?? plan.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="font-black uppercase tracking-wide text-slate-400">
                  Tạo lúc
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {formatDate(plan.createdAt)}
                </p>
              </div>
              <div>
                <p className="font-black uppercase tracking-wide text-slate-400">
                  Mức độ
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {plan.severityLevel || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="font-black uppercase tracking-wide text-slate-400">
                  Chi phí
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {plan.estimatedCost || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="font-black uppercase tracking-wide text-slate-400">
                  Số bước
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {plan.plantEventIds?.length ?? 0}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
