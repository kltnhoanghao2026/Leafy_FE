import { RefreshCw } from 'lucide-react';
import { MonthCalendarView } from './MonthCalendarView';
import { WeekStripView } from './WeekStripView';
import { TimelineView } from './TimelineView';
import { useTranslation } from '../../../../i18n';
import type { CalendarViewPanelProps } from '../schemas/calendar.types';

export function CalendarViewPanel({
  calendarQuery,
  activeView,
  events,
  currentMonth, onPrevMonth, onNextMonth,
  weekDays, eventsByDate, onPrevWeek, onNextWeek, onThisWeek, isCurrentWeek, weekLabel,
  tlMonth, onPrevTlMonth, onNextTlMonth,
  selectedDate, onSelectDate, hoveredDateRange,
}: CalendarViewPanelProps): React.ReactElement {
  const { t } = useTranslation();
  if (calendarQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm font-bold text-slate-500">
        {t('plantManagement.calendar.loadingCalendar')}
      </div>
    );
  }

  if (calendarQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
        <p className="text-sm font-bold text-red-700">{t('plantManagement.calendar.loadErrorShort')}.</p>
        <button
          type="button"
          onClick={() => void calendarQuery.refetch()}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
        >
          <RefreshCw className="h-4 w-4" /> {t('plantManagement.common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {activeView === 'month' && (
        <MonthCalendarView
          events={events}
          month={currentMonth}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          hoveredDateRange={hoveredDateRange}
        />
      )}
      {activeView === 'week' && (
        <WeekStripView
          weekDays={weekDays}
          eventsByDate={eventsByDate}
          onPrevWeek={onPrevWeek}
          onNextWeek={onNextWeek}
          onThisWeek={onThisWeek}
          isCurrentWeek={isCurrentWeek}
          weekLabel={weekLabel}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          hoveredDateRange={hoveredDateRange}
        />
      )}
      {activeView === 'timeline' && (
        <TimelineView
          events={events}
          month={tlMonth}
          onPrevMonth={onPrevTlMonth}
          onNextMonth={onNextTlMonth}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />
      )}
    </div>
  );
}
