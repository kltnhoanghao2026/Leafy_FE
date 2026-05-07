import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { GroupedEventList } from './GroupedEventList';
import type { PlantEventResponse } from '../../shared/types';

export interface EventListPanelProps {
  selectedDate: string | null;
  selectedDateEvents: PlantEventResponse[];
  onEdit: (event: PlantEventResponse) => void;
  onEventHover: (event: PlantEventResponse | null) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  onSelectEvent?: (event: PlantEventResponse) => void;
}

export function EventListPanel({
  selectedDate,
  selectedDateEvents,
  onEdit,
  onEventHover,
  onToggleComplete,
  onToggleTask,
  onSelectEvent,
}: EventListPanelProps): React.ReactElement {
  if (!selectedDate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
        <CalendarDays className="h-10 w-10 text-slate-200" />
        <p className="text-sm font-medium text-slate-400">Chọn một ngày từ lịch</p>
      </div>
    );
  }

  if (selectedDateEvents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
        <CalendarDays className="h-10 w-10 text-slate-200" />
        <p className="text-sm font-medium text-slate-500">Không có sự kiện trong ngày này</p>
      </div>
    );
  }

  const total = selectedDateEvents.length;
  // For broad-scope events (ZONE/PLANT tracking) consider done when all targets complete;
  // for plain events use the event-level completed flag.
  const done = selectedDateEvents.filter(e => {
    if (e.trackingGranularity && e.trackingGranularity !== 'NONE') {
      return e.progressTotal != null && e.progressTotal > 0 && e.progressCompleted === e.progressTotal;
    }
    return e.completed;
  }).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Compact header: date + progress inline */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${allDone ? 'text-emerald-500' : 'text-slate-300'}`} />
            <span className="text-xs font-bold text-slate-600">Tiến độ</span>
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

      <GroupedEventList
        events={selectedDateEvents}
        selectedDate={selectedDate}
        onEdit={onEdit}
        onEventHover={onEventHover}
        onToggleComplete={onToggleComplete}
        onToggleTask={onToggleTask}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}
