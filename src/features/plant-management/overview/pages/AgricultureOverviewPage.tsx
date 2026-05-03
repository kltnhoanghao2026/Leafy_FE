import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  Sprout,
  Stethoscope,
} from "lucide-react";
import { ROUTES } from '../../../../lib/routes';
import { useDiagnoseRequests } from '../../../disease-diagnosis/queries';
import {
  useMyPlants,
  useMyPlans,
  usePlantEventsCalendar,
} from '../..';
import { EVENT_TYPE_LABELS, formatDate, TREATMENT_STATUS_LABELS } from '../../shared/components/displayUtils';
import type { PlantEventResponse, PlanResponse } from '../../shared/types';

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

const today = new Date();
const todayString = today.toISOString().slice(0, 10);
const nextWeekString = addDays(today, 7);

const activeStatuses = new Set(["PENDING", "ACTIVE"]);

export function AgricultureOverviewPage() {
  const plantsQuery = useMyPlants();
  const plansQuery = useMyPlans();
  const eventsQuery = usePlantEventsCalendar({
    startDate: todayString,
    endDate: nextWeekString,
  });
  const diagnosisQuery = useDiagnoseRequests({ page: 0, size: 5 });

  const plants = plantsQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const diagnosis = diagnosisQuery.data?.content ?? [];
  const activePlans = plans.filter((plan: PlanResponse) => activeStatuses.has(plan.status));

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden">
      {/* Compact header */}
      <header className="shrink-0 flex flex-col gap-3 rounded-2xl bg-[#173F2A] px-6 py-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
            Agriculture command center
          </p>
          <h2 className="mt-0.5 text-xl font-black tracking-tight">
            Tổng quan nông nghiệp thông minh
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["Chẩn đoán bệnh", ROUTES.DASHBOARD.DISEASE_DIAGNOSIS],
              ["Hỏi AI", ROUTES.DASHBOARD.RAG_PANEL],
              ["Xem lịch", ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR],
            ] as [string, string][]
          ).map(([label, path]) => (
            <Link
              key={path}
              to={path}
              className="rounded-xl bg-white/12 px-3 py-2 text-xs font-black text-white ring-1 ring-white/20 hover:bg-white/20"
            >
              {label}
            </Link>
          ))}
        </div>
      </header>

      {/* Compact stats row */}
      <div className="shrink-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={Sprout}
          label="Cây trồng"
          value={plants.length}
          loading={plantsQuery.isLoading}
          error={plantsQuery.isError}
          retry={() => void plantsQuery.refetch()}
        />
        <SummaryCard
          icon={ClipboardList}
          label="Plan đang xử lý"
          value={activePlans.length}
          loading={plansQuery.isLoading}
          error={plansQuery.isError}
          retry={() => void plansQuery.refetch()}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Lịch 7 ngày tới"
          value={events.length}
          loading={eventsQuery.isLoading}
          error={eventsQuery.isError}
          retry={() => void eventsQuery.refetch()}
        />
        <SummaryCard
          icon={Stethoscope}
          label="Chẩn đoán gần đây"
          value={diagnosis.length}
          loading={diagnosisQuery.isLoading}
          error={diagnosisQuery.isError}
          retry={() => void diagnosisQuery.refetch()}
        />
      </div>

      {/* Panels — fill remaining height, each scrollable internally */}
      <div className="flex-1 min-h-0 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Lịch chăm sóc sắp tới" link={ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR}>
          <UpcomingEventsList
            events={events.slice(0, 8)}
            loading={eventsQuery.isLoading}
            error={eventsQuery.isError}
          />
        </Panel>
        <Panel title="Kế hoạch đang xử lý" link={ROUTES.DASHBOARD.PLANS}>
          <ActivePlanList
            plans={activePlans.slice(0, 8)}
            loading={plansQuery.isLoading}
            error={plansQuery.isError}
          />
        </Panel>
        <Panel title="Chẩn đoán gần đây" link={ROUTES.DASHBOARD.DIAGNOSIS_HISTORY}>
          <RecentDiagnosisList
            items={diagnosis}
            loading={diagnosisQuery.isLoading}
            error={diagnosisQuery.isError}
          />
        </Panel>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  loading,
  error,
  retry,
}: {
  icon: typeof Sprout;
  label: string;
  value: number;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-[#245A34]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-900">
          {loading ? "..." : error ? "!" : value}
        </p>
      </div>
      {error ? (
        <button
          type="button"
          onClick={retry}
          className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-600"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  link,
  children,
}: {
  title: string;
  link: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <Link to={link} className="text-sm font-black text-[#245A34]">
          Xem tất cả
        </Link>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}

function UpcomingEventsList({
  events,
  loading,
  error,
}: {
  events: PlantEventResponse[];
  loading: boolean;
  error: boolean;
}) {
  if (loading) return <SkeletonLines />;
  if (error) return <ErrorInline text="Không tải được lịch chăm sóc." />;
  if (!events.length) return <EmptyInline text="Không có lịch trong 7 ngày tới." />;

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Link
          key={event.id}
          to={ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR}
          className="block rounded-2xl bg-slate-50 p-4 hover:bg-emerald-50"
        >
          <p className="text-sm font-black text-slate-900">
            {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {formatDate(event.calculatedStartDate)} · {event.note || event.description || "Không có mô tả"}
          </p>
        </Link>
      ))}
    </div>
  );
}

function ActivePlanList({
  plans,
  loading,
  error,
}: {
  plans: PlanResponse[];
  loading: boolean;
  error: boolean;
}) {
  if (loading) return <SkeletonLines />;
  if (error) return <ErrorInline text="Không tải được kế hoạch điều trị." />;
  if (!plans.length) return <EmptyInline text="Chưa có kế hoạch đang xử lý." />;

  return (
    <div className="space-y-3">
      {plans.map((plan: PlanResponse) => (
        <Link
          key={plan.id}
          to={ROUTES.DASHBOARD.PLAN_DETAIL(plan.id)}
          className="block rounded-2xl bg-slate-50 p-4 hover:bg-emerald-50"
        >
          <p className="text-sm font-black text-slate-900">
            {plan.diseaseName || "Kế hoạch điều trị"}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {(TREATMENT_STATUS_LABELS as any)[plan.status] ?? plan.status} · {formatDate(plan.createdAt)}
          </p>
        </Link>
      ))}
    </div>
  );
}

function RecentDiagnosisList({
  items,
  loading,
  error,
}: {
  items: { diagnoseRequestId: string; imageFileName?: string; timeStamp?: string }[];
  loading: boolean;
  error: boolean;
}) {
  if (loading) return <SkeletonLines />;
  if (error) return <ErrorInline text="Không tải được lịch sử chẩn đoán." />;
  if (!items.length) return <EmptyInline text="Chưa có chẩn đoán gần đây." />;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.diagnoseRequestId} className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">
            {item.imageFileName || "Ảnh chẩn đoán"}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {formatDate(item.timeStamp)}
          </p>
        </div>
      ))}
    </div>
  );
}

function SkeletonLines() {
  return (
    <div className="space-y-3" aria-label="Đang tải">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

function EmptyInline({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
      {text}
    </div>
  );
}

function ErrorInline({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
      {text}
    </div>
  );
}

export default AgricultureOverviewPage;
