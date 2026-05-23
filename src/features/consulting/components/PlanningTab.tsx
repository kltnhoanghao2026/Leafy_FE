import { useMemo } from 'react';
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipboardList, Plus, ShieldOff } from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import { useConsultingPlansByFarmer } from '../queries/consulting.queries';
import { formatDate } from '../../plant-management/shared/components/displayUtils';
import type { PrivacySettings } from '../../settings/types';

interface PlanningTabProps {
  farmerProfileId: string;
  privacySettings?: PrivacySettings | null;
}

export function PlanningTab({ farmerProfileId, privacySettings }: PlanningTabProps) {
  const navigate = useNavigate();
  const shared = !!privacySettings?.sharePlansWithConsultants;
  const plansQuery = useConsultingPlansByFarmer(farmerProfileId);
  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);

  const [buttonPressed, setButtonPressed] = React.useState(false);

  const handleCreatePlan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[PlanningTab] Button clicked, farmerProfileId:', farmerProfileId);
    console.log('[PlanningTab] Navigate to:', ROUTES.DASHBOARD.CONSULTING_CREATE_PLAN(farmerProfileId));
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 100);
    navigate(ROUTES.DASHBOARD.CONSULTING_CREATE_PLAN(farmerProfileId));
  };

  if (plansQuery.isLoading) {
    return (
      <div className="space-y-3 pt-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <div className="pt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
        Không tải được danh sách kế hoạch. Vui lòng thử lại.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {!shared && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1">
              <ShieldOff className="w-3 h-3" strokeWidth={2.5} />
              Chưa chia sẻ
            </div>
          )}
          <div>
            <p className="text-sm font-black text-slate-900">Kế hoạch tư vấn</p>
            <p className="text-xs font-semibold text-slate-500">{plans.length} kế hoạch đã tạo</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreatePlan}
          className={`flex items-center gap-1.5 rounded-xl bg-[#245A34] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a4226] ${buttonPressed ? 'ring-4 ring-blue-400' : ''}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Tạo kế hoạch mới
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          {!shared && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1 mb-4">
              <ShieldOff className="w-3 h-3" strokeWidth={2.5} />
              Chưa chia sẻ
            </div>
          )}
          <ClipboardList className="mb-4 h-12 w-12 text-slate-300" strokeWidth={1.5} />
          <p className="font-semibold text-slate-600">Chưa có kế hoạch nào cho nông dân này.</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Nhấn "Tạo kế hoạch mới" để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    to={ROUTES.DASHBOARD.PLAN_DETAIL(plan.id)}
                    className="text-base font-black text-slate-900 hover:text-[#245A34] hover:underline"
                  >
                    {plan.planName || plan.diseaseName || plan.question || 'Kế hoạch điều trị'}
                  </Link>
                  {plan.successIndicators && (
                    <p className="mt-1 text-sm font-semibold text-slate-500 truncate">
                      {plan.successIndicators}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 self-start rounded-full px-3 py-1 text-xs font-black ${(plan.applyCount ?? 0) > 0 ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-slate-100 text-slate-500'}`}
                >
                  {(plan.applyCount ?? 0) > 0 ? `${plan.applyCount} áp dụng` : "Chưa áp dụng"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div>
                  <p className="font-black uppercase tracking-wide text-slate-400">Tạo lúc</p>
                  <p className="mt-0.5 font-bold text-slate-700">{formatDate(plan.createdAt)}</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-wide text-slate-400">Mức độ</p>
                  <p className="mt-0.5 font-bold text-slate-700">{plan.severityLevel || '—'}</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-wide text-slate-400">Khẩn cấp</p>
                  <p className="mt-0.5 font-bold text-slate-700">{plan.urgency || '—'}</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-wide text-slate-400">Chi phí</p>
                  <p className="mt-0.5 font-bold text-slate-700">{plan.estimatedCost || '—'}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
