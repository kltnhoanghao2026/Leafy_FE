import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { CreatePlanFromRagDialog } from "../components/CreatePlanFromRagDialog";
import { RagPlanList } from "../components/RagPlanList";
import { useRagPlan, useRagPlans } from "../queries";
import type { RagPlan } from "../types";
import { getPlanTitle } from "../utils/ragResponse";

const renderPlanItems = (plan: RagPlan) => {
  const items = Array.isArray(plan.steps)
    ? plan.steps
    : Array.isArray(plan.schedule)
      ? plan.schedule
      : [];

  if (!items.length) {
    return (
      <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch nÃÂ y chÃÂ°a cÃÂ³ danh sÃÂ¡ch bÃÂ°Ã¡Â»âºc/lÃ¡Â»â¹ch Ã¡Â»Å¸ ÃâÃ¡Â»â¹nh dÃ¡ÂºÂ¡ng cÃÂ³ thÃ¡Â»Æ hiÃ¡Â»Æn thÃ¡Â»â¹.
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
          `BÃÂ°Ã¡Â»âºc ${index + 1}`;
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

export function RagPlansPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planForCreate, setPlanForCreate] = useState<RagPlan | null>(
    null,
  );
  const plansQuery = useRagPlans({ page: 0, size: 50 });
  const detailQuery = useRagPlan(selectedPlanId);

  const handleView = (plan: RagPlan) => {
    setSelectedPlanId(plan.planId || plan.id || null);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to={ROUTES.DASHBOARD.RAG_PANEL}
            className="inline-flex items-center text-sm font-bold text-[#245A34]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Quay lÃ¡ÂºÂ¡i trÃ¡Â»Â£ lÃÂ½ AI
          </Link>
          <h2 className="mt-3 text-[32px] font-black tracking-tight text-slate-900">
            KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹ tÃ¡Â»Â« AI
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Xem cÃÂ¡c treatment plan mÃÂ  rag-service ÃâÃÂ£ lÃÂ°u.
          </p>
        </div>
      </header>

      {plansQuery.isLoading ? (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">
          ÃÂang tÃ¡ÂºÂ£i kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI...
        </div>
      ) : plansQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          KhÃÂ´ng tÃ¡ÂºÂ£i ÃâÃÂ°Ã¡Â»Â£c danh sÃÂ¡ch kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI. Vui lÃÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i.
        </div>
      ) : (
        <RagPlanList
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
                  Chi tiÃ¡ÂºÂ¿t kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">
                  {detailQuery.data ? getPlanTitle(detailQuery.data) : "ÃÂang tÃ¡ÂºÂ£i..."}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanId(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="ÃÂÃÂ³ng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <p className="mt-6 text-sm font-bold text-slate-500">
                ÃÂang tÃ¡ÂºÂ£i chi tiÃ¡ÂºÂ¿t...
              </p>
            ) : detailQuery.isError ? (
              <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                KhÃÂ´ng tÃ¡ÂºÂ£i ÃâÃÂ°Ã¡Â»Â£c chi tiÃ¡ÂºÂ¿t kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch.
              </p>
            ) : detailQuery.data ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                  <p>
                    <span className="font-black text-slate-800">BÃ¡Â»â¡nh/vÃ¡ÂºÂ¥n ÃâÃ¡Â»Â: </span>
                    {detailQuery.data.diseaseName || "KhÃÂ´ng rÃÂµ"}
                  </p>
                  <p>
                    <span className="font-black text-slate-800">TrÃ¡ÂºÂ¡ng thÃÂ¡i: </span>
                    {detailQuery.data.status || detailQuery.data.urgency || "KhÃÂ´ng rÃÂµ"}
                  </p>
                  <p>
                    <span className="font-black text-slate-800">TÃÂ³m tÃ¡ÂºÂ¯t: </span>
                    {detailQuery.data.summary || detailQuery.data.question || "KhÃÂ´ng cÃÂ³ tÃÂ³m tÃ¡ÂºÂ¯t."}
                  </p>
                </div>
                {renderPlanItems(detailQuery.data)}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPlanForCreate(detailQuery.data)}
                    className="rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
                  >
                    TÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {planForCreate ? (
        <CreatePlanFromRagDialog
          plan={planForCreate}
          onClose={() => setPlanForCreate(null)}
        />
      ) : null}
    </div>
  );
}

export default RagPlansPage;
