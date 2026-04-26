import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { CreateTreatmentPlanFromRagDialog } from "../components/CreateTreatmentPlanFromRagDialog";
import { RagTreatmentPlanList } from "../components/RagTreatmentPlanList";
import { useRagTreatmentPlan, useRagTreatmentPlans } from "../queries";
import type { RagTreatmentPlan } from "../types";
import { getPlanTitle } from "../utils/ragResponse";

const renderPlanItems = (plan: RagTreatmentPlan) => {
  const items = Array.isArray(plan.steps)
    ? plan.steps
    : Array.isArray(plan.schedule)
      ? plan.schedule
      : [];

  if (!items.length) {
    return (
      <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        Kế hoạch này chưa có danh sách bước/lịch ở định dạng có thể hiển thị.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const record =
          item && typeof item === "object" && !Array.isArray(item)
            ? (item as Record<string, unknown>)
            : null;
        const title =
          (record?.title as string | undefined) ||
          (record?.name as string | undefined) ||
          `Bước ${index + 1}`;
        const description =
          (record?.description as string | undefined) ||
          (record?.note as string | undefined) ||
          (typeof item === "string" ? item : "");

        return (
          <div key={`${title}-${index}`} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-800">{title}</p>
            {description ? (
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export function RagTreatmentPlansPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planForCreate, setPlanForCreate] = useState<RagTreatmentPlan | null>(
    null,
  );
  const plansQuery = useRagTreatmentPlans({ page: 0, size: 50 });
  const detailQuery = useRagTreatmentPlan(selectedPlanId);

  const handleView = (plan: RagTreatmentPlan) => {
    setSelectedPlanId(plan.planId || plan.id || null);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to={ROUTES.DASHBOARD.AI_ASSISTANT}
            className="inline-flex items-center text-sm font-bold text-[#245A34]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Quay lại trợ lý AI
          </Link>
          <h2 className="mt-3 text-[32px] font-black tracking-tight text-slate-900">
            Kế hoạch điều trị từ AI
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Xem các treatment plan mà rag-service đã lưu.
          </p>
        </div>
      </header>

      {plansQuery.isLoading ? (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">
          Đang tải kế hoạch AI...
        </div>
      ) : plansQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          Không tải được danh sách kế hoạch AI. Vui lòng thử lại.
        </div>
      ) : (
        <RagTreatmentPlanList
          plans={plansQuery.data ?? []}
          onView={handleView}
        />
      )}

      {selectedPlanId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Chi tiết kế hoạch
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">
                  {detailQuery.data ? getPlanTitle(detailQuery.data) : "Đang tải..."}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanId(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <p className="mt-6 text-sm font-bold text-slate-500">
                Đang tải chi tiết...
              </p>
            ) : detailQuery.isError ? (
              <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                Không tải được chi tiết kế hoạch.
              </p>
            ) : detailQuery.data ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                  <p>
                    <span className="font-black text-slate-800">Bệnh/vấn đề: </span>
                    {detailQuery.data.diseaseName || "Không rõ"}
                  </p>
                  <p>
                    <span className="font-black text-slate-800">Trạng thái: </span>
                    {detailQuery.data.status || detailQuery.data.urgency || "Không rõ"}
                  </p>
                  <p>
                    <span className="font-black text-slate-800">Tóm tắt: </span>
                    {detailQuery.data.summary || detailQuery.data.question || "Không có tóm tắt."}
                  </p>
                </div>
                {renderPlanItems(detailQuery.data)}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPlanForCreate(detailQuery.data)}
                    className="rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
                  >
                    Tạo kế hoạch điều trị
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {planForCreate ? (
        <CreateTreatmentPlanFromRagDialog
          plan={planForCreate}
          onClose={() => setPlanForCreate(null)}
        />
      ) : null}
    </div>
  );
}

export default RagTreatmentPlansPage;
