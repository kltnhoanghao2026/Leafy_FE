import { useMemo, useState, useCallback, useRef } from 'react';
import { CalendarDays, CalendarRange, Clock, GripVertical, ShieldOff } from 'lucide-react';
import { useConsultingCalendar } from '../queries/consulting.queries';
import { useToggleTaskMutation } from '../../plant-management';
import { CalendarViewPanel } from '../../plant-management/calendarview/components/CalendarViewPanel';
import { EventListPanel } from '../../plant-management/calendarview/components/EventListPanel';
import {
  toLocalDateOnly,
  addLocalDays,
  startOfLocalWeek,
} from '../../plant-management/shared/utils/dateOnly';
import {
  getEventCategory,
  CATEGORY_DOT_COLORS,
} from '../../plant-management/shared/components/displayUtils';
import type {
  CalendarViewPanelProps,
  HoveredDateRange,
  ViewType,
} from '../../plant-management/calendarview/components/CalendarViewPanel';
import type { EventListPanelProps } from '../../plant-management/calendarview/components/EventListPanel';
import type { PlantEventResponse } from '../../plant-management/shared/types';
import type { PrivacySettings } from '../../settings/types';

interface CalendarTabProps {
  farmerProfileId: string;
  privacySettings?: PrivacySettings | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const todayDate = new Date();
const today = toLocalDateOnly(todayDate);

const VIEW_TABS: {
  id: ViewType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'month', label: 'Tháng', Icon: CalendarDays },
  { id: 'week', label: 'Tuần', Icon: CalendarRange },
  { id: 'timeline', label: 'Dòng TG', Icon: Clock },
];

function getMonthBounds(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth();
  return {
    startDate: toLocalDateOnly(new Date(y, m, 1)),
    endDate: toLocalDateOnly(new Date(y, m + 1, 0)),
  };
}

function getWeekBounds(weekMonday: Date) {
  return {
    startDate: toLocalDateOnly(weekMonday),
    endDate: addLocalDays(weekMonday, 6),
  };
}

// ── CalendarTab ───────────────────────────────────────────────────────────────

export function CalendarTab({ farmerProfileId, privacySettings }: CalendarTabProps) {
  const shared = !!privacySettings?.sharePlantEventsWithConsultants;
  const [activeView, setActiveView] = useState<ViewType>('month');
  const [leftPct, setLeftPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleTask = useToggleTaskMutation();

  const onSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(Math.max(pct, 28), 75));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() =>
    startOfLocalWeek(todayDate),
  );
  const [tlMonth, setTlMonth] = useState(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [hoveredEvent, setHoveredEvent] = useState<PlantEventResponse | null>(null);

  const { startDate, endDate } = useMemo(() => {
    if (activeView === 'month') return getMonthBounds(currentMonth);
    if (activeView === 'week') return getWeekBounds(currentWeekMonday);
    return getMonthBounds(tlMonth);
  }, [activeView, currentMonth, currentWeekMonday, tlMonth]);

  const calendarQuery = useConsultingCalendar(
    farmerProfileId,
    startDate,
    endDate,
    shared && !!farmerProfileId,
  );

  const events = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((evt) => {
      const start = evt.calculatedStartDate;
      if (!start) return false;
      const end = evt.calculatedEndDate ?? start;
      return selectedDate >= start && selectedDate <= end;
    });
  }, [events, selectedDate]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addLocalDays(currentWeekMonday, i)),
    [currentWeekMonday],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PlantEventResponse[]>();
    for (const evt of events) {
      const start = evt.calculatedStartDate;
      const end = evt.calculatedEndDate ?? start;
      if (!start) continue;
      const startD = new Date(start + 'T00:00:00');
      const endD = new Date((end ?? start) + 'T00:00:00');
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = toLocalDateOnly(d);
        if (!map.has(key)) map.set(key, []);
        const list = map.get(key)!;
        if (!list.some((e) => e.id === evt.id)) list.push(evt);
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

  const hoveredDateRange = useMemo<HoveredDateRange | null>(() => {
    if (!hoveredEvent?.calculatedStartDate) return null;
    const category = getEventCategory(hoveredEvent.eventType);
    return {
      start: hoveredEvent.calculatedStartDate,
      end: hoveredEvent.calculatedEndDate ?? hoveredEvent.calculatedStartDate,
      color: CATEGORY_DOT_COLORS[category],
    };
  }, [hoveredEvent]);

  const handlePrevMonth = useCallback(
    () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)),
    [],
  );
  const handleNextMonth = useCallback(
    () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)),
    [],
  );
  const handlePrevWeek = useCallback(
    () =>
      setCurrentWeekMonday((m) => {
        const n = new Date(m);
        n.setDate(n.getDate() - 7);
        return n;
      }),
    [],
  );
  const handleNextWeek = useCallback(
    () =>
      setCurrentWeekMonday((m) => {
        const n = new Date(m);
        n.setDate(n.getDate() + 7);
        return n;
      }),
    [],
  );
  const handleThisWeek = useCallback(
    () => setCurrentWeekMonday(startOfLocalWeek(todayDate)),
    [],
  );
  const handlePrevTlMonth = useCallback(
    () => setTlMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)),
    [],
  );
  const handleNextTlMonth = useCallback(
    () => setTlMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)),
    [],
  );

  const calendarPanelProps: CalendarViewPanelProps = {
    calendarQuery,
    activeView,
    events,
    currentMonth,
    onPrevMonth: handlePrevMonth,
    onNextMonth: handleNextMonth,
    weekDays,
    eventsByDate,
    onPrevWeek: handlePrevWeek,
    onNextWeek: handleNextWeek,
    onThisWeek: handleThisWeek,
    isCurrentWeek,
    weekLabel,
    tlMonth,
    onPrevTlMonth: handlePrevTlMonth,
    onNextTlMonth: handleNextTlMonth,
    selectedDate,
    onSelectDate: setSelectedDate,
    hoveredDateRange,
  };

  const eventListPanelProps: EventListPanelProps = {
    selectedDate,
    selectedDateEvents,
    onEdit: () => {},
    onEventHover: setHoveredEvent,
    onToggleTask: (event, idx) => void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx }),
  };

  return (
    <div className="pt-4 flex flex-1 min-h-0 flex-col gap-3">
      {/* View type switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {!shared && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1">
              <ShieldOff className="w-3 h-3" strokeWidth={2.5} />
              Chưa chia sẻ
            </div>
          )}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Lịch sự kiện cây trồng
          </p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1">
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
                <Icon
                  className={`h-3.5 w-3.5 ${isActive ? 'text-[#2F7F34]' : 'text-slate-400'}`}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: side-by-side with draggable splitter */}
      <div ref={containerRef} className="hidden lg:flex flex-1 min-h-0 gap-0 overflow-hidden">
        <div className="shrink-0 h-full overflow-hidden" style={{ width: `${leftPct}%` }}>
          <CalendarViewPanel {...calendarPanelProps} />
        </div>

        {/* Splitter */}
        <div
          onMouseDown={onSplitterMouseDown}
          className="flex w-3 shrink-0 cursor-col-resize items-center justify-center self-stretch text-slate-300 hover:text-slate-400 select-none"
        >
          <GripVertical className="h-5 w-5" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4">
          <EventListPanel {...eventListPanelProps} />
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="flex lg:hidden flex-col gap-4">
        <CalendarViewPanel {...calendarPanelProps} />
        <div className="rounded-2xl border border-slate-100 bg-white p-4 min-h-32">
          <EventListPanel {...eventListPanelProps} />
        </div>
      </div>
    </div>
  );
}
