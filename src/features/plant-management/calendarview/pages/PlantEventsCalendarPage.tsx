import { useMemo, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, CalendarRange, Clock, GripVertical } from 'lucide-react';
import { useFarmPlots, useFarmZones } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import {
  usePlantEventsCalendar,
  usePlants,
  useUpdatePlantEventMutation,
} from '../..';
import { PlantEventEditDialog } from '../../calendarview/components/PlantEventEditDialog';
import { CalendarViewPanel } from '../../calendarview/components/CalendarViewPanel';
import { EventListPanel } from '../../calendarview/components/EventListPanel';
import type { CalendarViewPanelProps, HoveredDateRange, ViewType } from '../../calendarview/components/CalendarViewPanel';
import type { EventListPanelProps } from '../../calendarview/components/EventListPanel';
import { Select } from '../../../../components/ui/Select';
import { getEventCategory, CATEGORY_DOT_COLORS } from '../../shared/components/displayUtils';
import { toLocalDateOnly, addLocalDays, startOfLocalWeek } from '../../shared/utils/dateOnly';
import type { PlantEventResponse } from '../../shared/types';

const VIEW_TABS: { id: ViewType; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'month',    label: 'Tháng',   Icon: CalendarDays },
  { id: 'week',     label: 'Tuần',    Icon: CalendarRange },
  { id: 'timeline', label: 'Dòng TG', Icon: Clock },
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


// ── PlantEventsCalendarPage ───────────────────────────────────────────────────

export function PlantEventsCalendarPage() {
  const location = useLocation();
  const routeFilters = (location.state as { filters?: { plantId?: string; farmPlotId?: string; farmZoneId?: string } } | null)?.filters;

  const [activeView, setActiveView] = useState<ViewType>('month');

  const [farmPlotId, setFarmPlotId] = useState(routeFilters?.farmPlotId ?? '');
  const [farmZoneId, setFarmZoneId] = useState(routeFilters?.farmZoneId ?? '');
  const [plantId,    setPlantId]    = useState(routeFilters?.plantId    ?? '');

  const [currentMonth,      setCurrentMonth]      = useState(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => startOfLocalWeek(todayDate));
  const [tlMonth,           setTlMonth]           = useState(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));

  const profileQuery   = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? '';
  const plotsQuery     = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery     = useFarmZones(farmPlotId, !!farmPlotId);
  const plantsQuery    = usePlants();
  const updateEvent    = useUpdatePlantEventMutation();

  const [editEventTarget, setEditEventTarget] = useState<PlantEventResponse | null>(null);
  const [selectedDate,    setSelectedDate]    = useState<string | null>(today);
  const [hoveredEvent,    setHoveredEvent]    = useState<PlantEventResponse | null>(null);

  const hoveredDateRange = useMemo<HoveredDateRange | null>(() => {
    if (!hoveredEvent?.calculatedStartDate) return null;
    const category = getEventCategory(hoveredEvent.eventType);
    return {
      start: hoveredEvent.calculatedStartDate,
      end:   hoveredEvent.calculatedEndDate ?? hoveredEvent.calculatedStartDate,
      color: CATEGORY_DOT_COLORS[category],
    };
  }, [hoveredEvent]);

  // ── Splitter ─────────────────────────────────────────────────────────────────
  const [leftPct, setLeftPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(Math.max(pct, 22), 72));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // ── Date range for API query ──────────────────────────────────────────────────
  const { startDate, endDate } = useMemo(() => {
    if (activeView === 'month') return getMonthBounds(currentMonth);
    if (activeView === 'week')  return getWeekBounds(currentWeekMonday);
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

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(evt => {
      const start = evt.calculatedStartDate;
      if (!start) return false;
      const end = evt.calculatedEndDate ?? start;
      return selectedDate >= start && selectedDate <= end;
    });
  }, [events, selectedDate]);

  // ── Week helpers ──────────────────────────────────────────────────────────────
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addLocalDays(currentWeekMonday, i)),
    [currentWeekMonday],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PlantEventResponse[]>();
    for (const evt of events) {
      const start = evt.calculatedStartDate;
      const end   = evt.calculatedEndDate ?? start;
      if (!start) continue;
      const startD = new Date(start + 'T00:00:00');
      const endD   = new Date((end ?? start) + 'T00:00:00');
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = toLocalDateOnly(d);
        if (!map.has(key)) map.set(key, []);
        const list = map.get(key)!;
        if (!list.some(e => e.id === evt.id)) list.push(evt);
      }
    }
    return map;
  }, [events]);

  const weekLabel = useMemo(() => {
    const s = new Date(currentWeekMonday.getTime());
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${fmt(s)} – ${fmt(e)}`;
  }, [currentWeekMonday]);

  const isCurrentWeek = useMemo(() => {
    const thisMonday = startOfLocalWeek(todayDate);
    return toLocalDateOnly(currentWeekMonday) === toLocalDateOnly(thisMonday);
  }, [currentWeekMonday]);

  // ── Navigation callbacks ──────────────────────────────────────────────────────
  const handlePrevMonth   = useCallback(() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)), []);
  const handleNextMonth   = useCallback(() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)), []);
  const handlePrevWeek    = useCallback(() => setCurrentWeekMonday(m => { const n = new Date(m); n.setDate(n.getDate() - 7); return n; }), []);
  const handleNextWeek    = useCallback(() => setCurrentWeekMonday(m => { const n = new Date(m); n.setDate(n.getDate() + 7); return n; }), []);
  const handleThisWeek    = useCallback(() => setCurrentWeekMonday(startOfLocalWeek(todayDate)), []);
  const handlePrevTlMonth = useCallback(() => setTlMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)), []);
  const handleNextTlMonth = useCallback(() => setTlMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)), []);

  // Shared props for the two identical panel instances (desktop + mobile)
  const calendarPanelProps: CalendarViewPanelProps = {
    calendarQuery,
    activeView,
    events,
    currentMonth, onPrevMonth: handlePrevMonth, onNextMonth: handleNextMonth,
    weekDays, eventsByDate, onPrevWeek: handlePrevWeek, onNextWeek: handleNextWeek,
    onThisWeek: handleThisWeek, isCurrentWeek, weekLabel,
    tlMonth, onPrevTlMonth: handlePrevTlMonth, onNextTlMonth: handleNextTlMonth,
    selectedDate, onSelectDate: setSelectedDate, hoveredDateRange,
  };

  const eventListPanelProps: EventListPanelProps = {
    selectedDate,
    selectedDateEvents,
    onEdit: setEditEventTarget,
    onEventHover: setHoveredEvent,
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-hidden">
      {/* Top bar: header + view tabs */}
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#245A34]">Plant events</p>
          <h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">Lịch chăm sóc</h2>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
          {VIEW_TABS.map(({ id, label, Icon }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                className={`flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-[#2F7F34] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#2F7F34]' : 'text-slate-400'}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="shrink-0 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Vườn</span>
          <Select
            className="mt-1"
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
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Khu vực</span>
          <Select
            className="mt-1"
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
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Cây</span>
          <Select
            className="mt-1"
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

      {/* Desktop: split layout (lg+) */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden hidden lg:flex flex-row gap-0">
        <div className="shrink-0 overflow-y-auto" style={{ width: `${leftPct}%` }}>
          <CalendarViewPanel {...calendarPanelProps} />
        </div>

        {/* Drag splitter */}
        <div
          onMouseDown={onSplitterMouseDown}
          className="group relative flex w-3 shrink-0 cursor-col-resize items-center justify-center"
        >
          <div className="h-full w-px bg-slate-200 transition-colors group-hover:bg-emerald-400" />
          <div className="absolute flex h-8 w-5 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-emerald-300 group-hover:bg-emerald-50">
            <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500" />
          </div>
        </div>

        <div className="min-h-0 flex-1 flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <EventListPanel {...eventListPanelProps} />
          </div>
        </div>
      </div>

      {/* Mobile: stacked layout (< lg) */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 lg:hidden">
        <div className="shrink-0">
          <CalendarViewPanel {...calendarPanelProps} />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <EventListPanel {...eventListPanelProps} />
        </div>
      </div>

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
