import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { GroupedEventList } from './GroupedEventList';
import type { PlantEventResponse } from '../../shared/types';
import { useTranslation } from '../../../../i18n';
import type { EventListPanelProps } from '../schemas/calendar.types';

export function EventListPanel({
  selectedDate,
  selectedDateEvents,
  onEdit,
  onEventHover,
  onToggleComplete,
  onToggleTask,
  onSelectEvent,
  onDelete,
}: EventListPanelProps): React.ReactElement {
  const { t } = useTranslation();
  if (!selectedDate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
        <CalendarDays className="h-10 w-10 text-slate-200" />
        {/* select day prompt */}
        <p className="text-sm font-medium text-slate-400">{t('plantManagement.calendar.selectDayPrompt')}</p>
      </div>
    );
  }

  if (selectedDateEvents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
        <CalendarDays className="h-10 w-10 text-slate-200" />
        {/* no events */}
        <p className="text-sm font-medium text-slate-500">{t('plantManagement.calendar.noEventsOnDay')}</p>
      </div>
    );
  }

  // Recursively count all events including nested children
  const countAll = (events: PlantEventResponse[]): number => {
    let c = 0;
    for (const e of events) {
      c += 1;
      if (e.children?.length) c += countAll(e.children);
    }
    return c;
  };
  const countDone = (events: PlantEventResponse[]): number => {
    let c = 0;
    for (const e of events) {
      const isDone = e.trackingGranularity && e.trackingGranularity !== 'NONE'
        ? (e.progressTotal != null && e.progressTotal > 0 && e.progressCompleted === e.progressTotal)
        : e.completed;
      if (isDone) c += 1;
      if (e.children?.length) c += countDone(e.children);
    }
    return c;
  };

  const total = countAll(selectedDateEvents);
  const done = countDone(selectedDateEvents);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header: date + progress bar */}
      <div className="sticky top-0 z-10 shrink-0 flex flex-col gap-1.5 pb-3 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${allDone ? 'text-emerald-500' : 'text-slate-300'}`} />
            <span className="text-xs font-bold text-slate-600">{t('plantManagement.calendar.progressLabel')}</span>
          </div>
          <span className={`text-xs font-black tabular-nums ${allDone ? 'text-emerald-600' : 'text-slate-500'}`}>
            {done}/{total} &nbsp;·&nbsp; {pct}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-[#245A34]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Scrollable event list */}
      <div className="flex-1 min-h-0">
        <GroupedEventList
          events={selectedDateEvents}
          selectedDate={selectedDate}
          onEdit={onEdit}
          onEventHover={onEventHover}
          onToggleComplete={onToggleComplete}
          onToggleTask={onToggleTask}
          onSelectEvent={onSelectEvent}
          onDelete={onDelete}
          hideHeader
        />
      </div>
    </div>
  );
}
