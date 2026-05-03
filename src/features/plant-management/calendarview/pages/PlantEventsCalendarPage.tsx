import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, CalendarRange, Clock, RefreshCw } from 'lucide-react';
import { useFarmPlots, useFarmZones } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import {
  usePlantEventsCalendar,
  usePlants,
  useUpdatePlantEventMutation,
} from '../..';
import { PlantEventEditDialog } from '../../calendarview/components/PlantEventEditDialog';
import { MonthCalendarView } from '../../calendarview/components/MonthCalendarView';
import { WeekStripView } from '../../calendarview/components/WeekStripView';
import { TimelineView } from '../../calendarview/components/TimelineView';
import { Select } from '../../../../components/ui/Select';
import { toLocalDateOnly, addLocalDays, startOfLocalWeek } from '../../shared/utils/dateOnly';
import type { PlantEventResponse } from '../../shared/types';

type ViewType = 'month' | 'week' | 'timeline';

const VIEW_TABS: { id: ViewType; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'month',    label: 'Tháng',   Icon: CalendarDays  },
  { id: 'week',     label: 'Tuần',    Icon: CalendarRange  },
  { id: 'timeline', label: 'Dòng TG', Icon: Clock         },
];

function getMonthBounds(d: Date) {
  const y = d.getFullYear(), m = d.getMonth();
  return {
    startDate: toLocalDateOnly(new Date(y, m, 1)),
    endDate:   toLocalDateOnly(new Date(y, m + 1, 0)),
  };
}
function getWeekBounds(weekMonday: Date) {
  return {
    startDate: toLocalDateOnly(weekMonday),
    endDate:   addLocalDays(weekMonday, 6),
  };
}

const todayDate = new Date();
const today = toLocalDateOnly(todayDate);

export function PlantEventsCalendarPage() {
  const location  = useLocation();
  const routeFilters = (location.state as { filters?: { plantId?: string; farmPlotId?: string; farmZoneId?: string } } | null)?.filters;

  // View
  const [activeView,  setActiveView]  = useState<ViewType>('month');

  // Filter targets
  const [farmPlotId, setFarmPlotId] = useState(routeFilters?.farmPlotId ?? '');
  const [farmZoneId, setFarmZoneId] = useState(routeFilters?.farmZoneId ?? '');
  const [plantId,    setPlantId]    = useState(routeFilters?.plantId    ?? '');

  // Month / Week / Timeline state
  const [currentMonth,      setCurrentMonth]      = useState(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => startOfLocalWeek(todayDate));
  const [tlMonth,           setTlMonth]           = useState(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));


  // Data
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? '';
  const plotsQuery  = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery  = useFarmZones(farmPlotId, !!farmPlotId);
  const plantsQuery = usePlants();
  const updateEvent = useUpdatePlantEventMutation();
  const [editEventTarget, setEditEventTarget] = useState<PlantEventResponse | null>(null);

  // Compute date range for current view
  const { startDate, endDate } = useMemo(() => {
    if (activeView === 'month')    return getMonthBounds(currentMonth);
    if (activeView === 'week')     return getWeekBounds(currentWeekMonday);
    return getMonthBounds(tlMonth);
  }, [activeView, currentMonth, currentWeekMonday, tlMonth]);

  const calendarQuery = usePlantEventsCalendar({
    startDate,
    endDate,
    farmPlotId: farmPlotId || undefined,
    farmZoneId: farmZoneId || undefined,
    plantId:    plantId    || undefined,
  });

  const events = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);

  // Week helpers
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addLocalDays(currentWeekMonday, i)),
    [currentWeekMonday],
  );
  const eventsByDate = useMemo(() => {
    const map = new Map<string, PlantEventResponse[]>();
    for (const evt of events) {
      const key = evt.calculatedStartDate ?? 'unknown';
      if (!map.has(key)) map.set(key, []);
      const list = map.get(key)!;
      if (!list.some(e => e.id === evt.id)) list.push(evt);
    }
    return map;
  }, [events]);

  // Week label
  const weekLabel = useMemo(() => {
    const s = new Date(currentWeekMonday.getTime());
    const e = new Date(s); e.setDate(s.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
    return `${fmt(s)} – ${fmt(e)}`;
  }, [currentWeekMonday]);

  const isCurrentWeek = useMemo(() => {
    const thisMonday = startOfLocalWeek(todayDate);
    return toLocalDateOnly(currentWeekMonday) === toLocalDateOnly(thisMonday);
  }, [currentWeekMonday]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col space-y-6">
      {/* Page header */}
      <header>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">Plant events</p>
        <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">Lịch chăm sóc</h2>
        <p className="mt-2 text-[15px] font-semibold text-slate-500">
          Xem lịch chăm sóc/can thiệp được backend sinh từ treatment plan hoặc ghi nhận cho cây.
        </p>
      </header>

      {/* View tab switcher — mirrors APP's segmented control */}
      <div className="flex rounded-xl bg-slate-100 p-1">
        {VIEW_TABS.map(({ id, label, Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-[#2F7F34] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#2F7F34]' : 'text-slate-400'}`} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Vườn</span>
            <Select
              className="mt-1.5"
              value={farmPlotId}
              onChange={v => { setFarmPlotId(String(v)); setFarmZoneId(''); }}
              placeholder="Tất cả vườn"
              options={[
                { value: '', label: 'Tất cả vườn' },
                ...(plotsQuery.data ?? []).map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Khu vực</span>
            <Select
              className="mt-1.5"
              value={farmZoneId}
              onChange={v => setFarmZoneId(String(v))}
              disabled={!farmPlotId}
              placeholder={farmPlotId ? 'Tất cả khu vực' : 'Chọn vườn trước'}
              options={[
                { value: '', label: farmPlotId ? 'Tất cả khu vực' : 'Chọn vườn trước' },
                ...(zonesQuery.data ?? []).map(z => ({ value: z.id, label: z.zoneName })),
              ]}
            />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Cây</span>
            <Select
              className="mt-1.5"
              value={plantId}
              onChange={v => setPlantId(String(v))}
              placeholder="Tất cả cây"
              options={[
                { value: '', label: 'Tất cả cây' },
                ...(plantsQuery.data ?? []).map(p => ({
                  value: p.id,
                  label: p.nickName || p.plantNumber || p.id,
                })),
              ]}
            />
          </div>
        </div>
      </section>

      {/* Loading / Error */}
      {calendarQuery.isLoading && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm font-bold text-slate-500">
          Đang tải lịch chăm sóc...
        </div>
      )}
      {calendarQuery.isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
          <p className="text-sm font-bold text-red-700">Không tải được lịch chăm sóc.</p>
          <button type="button" onClick={() => void calendarQuery.refetch()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
            <RefreshCw className="h-4 w-4" /> Tải lại
          </button>
        </div>
      )}

      {/* View content */}
      {!calendarQuery.isLoading && !calendarQuery.isError && (
        <>
          {activeView === 'month' && (
            <MonthCalendarView
              events={events}
              month={currentMonth}
              onPrevMonth={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              onNextMonth={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              onEdit={setEditEventTarget}
            />
          )}
          {activeView === 'week' && (
            <WeekStripView
              weekDays={weekDays}
              eventsByDate={eventsByDate}
              onPrevWeek={() => setCurrentWeekMonday(m => { const n = new Date(m); n.setDate(n.getDate() - 7); return n; })}
              onNextWeek={() => setCurrentWeekMonday(m => { const n = new Date(m); n.setDate(n.getDate() + 7); return n; })}
              onThisWeek={() => setCurrentWeekMonday(startOfLocalWeek(todayDate))}
              isCurrentWeek={isCurrentWeek}
              weekLabel={weekLabel}
              onEdit={setEditEventTarget}
            />
          )}
          {activeView === 'timeline' && (
            <TimelineView
              events={events}
              month={tlMonth}
              onPrevMonth={() => setTlMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              onNextMonth={() => setTlMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              onEdit={setEditEventTarget}
            />
          )}
        </>
      )}

      {/* Edit dialog */}
      {editEventTarget && (
        <PlantEventEditDialog
          event={editEventTarget}
          isSubmitting={updateEvent.isPending}
          onClose={() => setEditEventTarget(null)}
          onSubmit={payload =>
            void updateEvent
              .mutateAsync({ eventId: editEventTarget.id, payload })
              .then(() => setEditEventTarget(null))
          }
        />
      )}
    </div>
  );
}

export default PlantEventsCalendarPage;
