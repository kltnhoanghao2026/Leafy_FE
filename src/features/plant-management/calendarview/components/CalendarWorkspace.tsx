import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarRange, Clock, GripVertical } from 'lucide-react';
import { CalendarViewPanel } from './CalendarViewPanel';
import { EventListPanel } from './EventListPanel';
import { useTranslation } from '../../../../i18n';
import { startOfLocalWeek, toLocalDateOnly, addLocalDays } from '../../shared/utils/dateOnly';
import { CATEGORY_DOT_COLORS, getEventCategory } from '../../shared/components/displayUtils';
import type { PlantEventResponse } from '../../shared/types';
import type { ViewType } from '../schemas/calendar.types';
import type { CalendarViewPanelProps, HoveredDateRange, CalendarDateRange, CalendarWorkspaceProps } from '../schemas/calendar.types';

function getMonthBounds(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth();
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

const STUB_QUERY = { isLoading: false, isError: false, refetch: () => undefined };

const todayDate = new Date();
const today = toLocalDateOnly(todayDate);

export function CalendarWorkspace({
  events,
  calendarQuery,
  onDateRangeChange,
  onEditEvent,
  onToggleComplete,
  onToggleTask,
  onSelectEvent,
  onDelete,
  emptyState,
  renderHeaderLeft,
  splitterRange = [22, 72],
  initialSelectedDate,
  className = '',
}: CalendarWorkspaceProps): React.ReactElement {
  const { t } = useTranslation();
  const VIEW_TABS: { id: ViewType; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'month',    label: t('plantManagement.calendar.viewMonth'),    Icon: CalendarDays },
    { id: 'week',     label: t('plantManagement.calendar.viewWeek'),     Icon: CalendarRange },
    { id: 'timeline', label: t('plantManagement.calendar.viewTimeline'), Icon: Clock },
  ];
  const [activeView, setActiveView] = useState<ViewType>('month');
  const [currentMonth, setCurrentMonth] = useState(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() =>
    startOfLocalWeek(todayDate),
  );
  const [tlMonth, setTlMonth] = useState(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    initialSelectedDate ?? today,
  );
  const [hoveredEvent, setHoveredEvent] = useState<PlantEventResponse | null>(null);


  // ── Splitter ────────────────────────────────────────────────────────────────
  const [leftPct, setLeftPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSplitterMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const [minPct, maxPct] = splitterRange;
      const onMove = (ev: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((ev.clientX - rect.left) / rect.width) * 100;
        setLeftPct(Math.min(Math.max(pct, minPct), maxPct));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [splitterRange],
  );

  // ── Visible date range (drives optional onDateRangeChange) ──────────────────
  const dateRange = useMemo<CalendarDateRange>(() => {
    const bounds =
      activeView === 'month'
        ? getMonthBounds(currentMonth)
        : activeView === 'week'
          ? getWeekBounds(currentWeekMonday)
          : getMonthBounds(tlMonth);
    return { ...bounds, activeView };
  }, [activeView, currentMonth, currentWeekMonday, tlMonth]);

  useEffect(() => {
    onDateRangeChange?.(dateRange);
  }, [dateRange, onDateRangeChange]);

  // ── Derived view-state ──────────────────────────────────────────────────────
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((evt) => {
      const start = evt.calculatedStartDate;
      if (!start) return false;
      const end = evt.durationDays != null && evt.durationDays > 0
        ? addLocalDays(start, evt.durationDays - 1)
        : (evt.calculatedEndDate ?? start);
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
      if (!start) continue;
      const end = evt.durationDays != null && evt.durationDays > 0
        ? addLocalDays(start, evt.durationDays - 1)
        : (evt.calculatedEndDate ?? start);
      const startD = new Date(start + 'T00:00:00');
      const endD = new Date(end + 'T00:00:00');
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
    const end = hoveredEvent.durationDays != null && hoveredEvent.durationDays > 0
      ? addLocalDays(hoveredEvent.calculatedStartDate, hoveredEvent.durationDays - 1)
      : (hoveredEvent.calculatedEndDate ?? hoveredEvent.calculatedStartDate);
    return {
      start: hoveredEvent.calculatedStartDate,
      end,
      color: CATEGORY_DOT_COLORS[category],
    };
  }, [hoveredEvent]);

  // ── Navigation callbacks ────────────────────────────────────────────────────
  const handlePrevMonth   = useCallback(() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)), []);
  const handleNextMonth   = useCallback(() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)), []);
  const handlePrevWeek    = useCallback(() => setCurrentWeekMonday((m) => { const n = new Date(m); n.setDate(n.getDate() - 7); return n; }), []);
  const handleNextWeek    = useCallback(() => setCurrentWeekMonday((m) => { const n = new Date(m); n.setDate(n.getDate() + 7); return n; }), []);
  const handleThisWeek    = useCallback(() => setCurrentWeekMonday(startOfLocalWeek(todayDate)), []);
  const handlePrevTlMonth = useCallback(() => setTlMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)), []);
  const handleNextTlMonth = useCallback(() => setTlMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)), []);

  const calendarPanelProps: CalendarViewPanelProps = {
    calendarQuery: calendarQuery ?? STUB_QUERY,
    activeView,
    events,
    currentMonth, onPrevMonth: handlePrevMonth, onNextMonth: handleNextMonth,
    weekDays, eventsByDate, onPrevWeek: handlePrevWeek, onNextWeek: handleNextWeek,
    onThisWeek: handleThisWeek, isCurrentWeek, weekLabel,
    tlMonth, onPrevTlMonth: handlePrevTlMonth, onNextTlMonth: handleNextTlMonth,
    selectedDate, onSelectDate: setSelectedDate, hoveredDateRange,
  };

  const eventListPanelProps = {
    selectedDate,
    selectedDateEvents,
    onEdit: onEditEvent ?? (() => {}),
    onEventHover: setHoveredEvent,
    onToggleComplete,
    onToggleTask,
    onSelectEvent,
    onDelete,
  };

  // Empty-state takes over the entire workspace when applicable.
  const showEmpty = emptyState != null && events.length === 0 && !calendarQuery?.isLoading;

  return (
    <div className={`flex h-full flex-col gap-3 ${className}`}>
      {/* Header: optional left slot + view tabs */}
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">{renderHeaderLeft?.()}</div>
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

      {showEmpty ? (
        <div className="flex-1 min-h-0">{emptyState}</div>
      ) : (
        <>
          {/* Desktop: split layout (lg+) */}
          <div ref={containerRef} className="hidden lg:flex h-full flex-1 min-h-0 flex-row gap-0">
            <div className="shrink-0 overflow-hidden" style={{ width: `${leftPct}%` }}>
              <div className="h-full overflow-hidden">
                <CalendarViewPanel {...calendarPanelProps} />
              </div>
            </div>

            <div
              onMouseDown={onSplitterMouseDown}
              className="group relative flex w-3 shrink-0 cursor-col-resize items-center justify-center"
            >
              <div className="h-full w-px bg-slate-200 transition-colors group-hover:bg-emerald-400" />
              <div className="absolute flex h-8 w-5 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-emerald-300 group-hover:bg-emerald-50">
                <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500" />
              </div>
            </div>

            <div className="min-h-0 flex-1 flex flex-col overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-sm p-3">
              <EventListPanel {...eventListPanelProps} />
            </div>
          </div>

          {/* Mobile: stacked layout (< lg) */}
          <div className="flex-1 min-h-0 flex flex-col gap-4 lg:hidden">
            <div className="shrink-0">
              <CalendarViewPanel {...calendarPanelProps} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-sm p-3">
              <EventListPanel {...eventListPanelProps} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
