import { Link } from "react-router-dom";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Sprout,
} from "lucide-react";
import { ROUTES } from '../../../../lib/routes';
import {
  useMyPlants,
  usePlantEventsCalendar,
} from '../..';
import type { PlantEventResponse } from '../../shared/types';
import { TodayTasksPanel } from '../components/TodayTasksPanel';
import { PlantEventProgressModal } from '../components/PlantEventProgressModal';
import { toLocalDateOnly } from '../../shared/utils/dateOnly';

export function AgricultureOverviewPage() {
  const todayString = toLocalDateOnly(new Date());
  const [selectedEvent, setSelectedEvent] = useState<PlantEventResponse | null>(null);

  const plantsQuery = useMyPlants();
  const todayEventsQuery = usePlantEventsCalendar({
    startDate: todayString,
    endDate: todayString,
  });

  const plants = plantsQuery.data?.content ?? [];
  const todayEvents = todayEventsQuery.data ?? [];

  return (
    <>
    <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            Agriculture command center
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            Tổng quan nông nghiệp
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Theo dõi công việc chăm sóc cây trồng hôm nay.
          </p>
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
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {label}
            </Link>
          ))}
        </div>
      </header>

      {/* Compact stats row */}
      <div className="shrink-0 grid grid-cols-2 gap-3">
        <SummaryCard
          icon={Sprout}
          label="Cây trồng"
          value={plants.length}
          loading={plantsQuery.isLoading}
          error={plantsQuery.isError}
          retry={() => void plantsQuery.refetch()}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Công việc hôm nay"
          value={todayEvents.length}
          loading={todayEventsQuery.isLoading}
          error={todayEventsQuery.isError}
          retry={() => void todayEventsQuery.refetch()}
        />
      </div>

      {/* Tasks panel — full width */}
      <div className="flex-1 min-h-0">
        <Panel title="Công việc hôm nay" link={ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR}>
          <TodayTasksPanel
            events={todayEvents}
            loading={todayEventsQuery.isLoading}
            error={todayEventsQuery.isError}
            onSelectEvent={setSelectedEvent}
          />
        </Panel>
      </div>
    </div>

    {selectedEvent && (
      <PlantEventProgressModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    )}
    </>
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

export default AgricultureOverviewPage;
