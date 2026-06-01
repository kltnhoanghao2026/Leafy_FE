import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '../../../../lib/routes';
import { useTreatmentPlanDetail } from '../queries/plan.queries';
import { useUpdatePlanMutation } from '../queries/plan.queries';
import { PlanForm } from '../components/PlanForm';
import { PageErrorState } from '../../../../components/ui/PageErrorState';

export function EditPlanPage() {
  const { planId = '' } = useParams();
  const navigate = useNavigate();

  const planQuery = useTreatmentPlanDetail(planId);
  const plan = planQuery.data;

  const updatePlan = useUpdatePlanMutation();

  if (planQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#245A34]" />
          <span className="text-sm font-bold text-slate-600">Đang tải kế hoạch...</span>
        </div>
      </div>
    );
  }

  if (planQuery.isError || !plan) {
    return (
      <PageErrorState
        title="Không tìm thấy kế hoạch."
        onRetry={() => void planQuery.refetch()}
      />
    );
  }

  return (
    <PlanForm
      existingPlan={plan}
      onUpdate={async (payload) => {
        await updatePlan.mutateAsync({ planId: plan.id, payload });
        navigate(ROUTES.DASHBOARD.PLAN_DETAIL(plan.id));
      }}
      isSubmitting={updatePlan.isPending}
    />
  );
}
