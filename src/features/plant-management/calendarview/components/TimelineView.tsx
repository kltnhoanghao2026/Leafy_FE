import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { GroupedEventList } from './GroupedEventList';
import type { PlantEventResponse } from '../../shared/types';

interface TimelineViewProps {
  /** All events for the current month, pre-sorted by date */
  events: PlantEventResponse[];
  month: Date; // current month being shown
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onEdit: (e: PlantEventResponse) => void;
}

export function TimelineView({
  events,
  month,
  onPrevMonth,
  onNextMonth,
  onEdit,
}: TimelineViewProps) {
  // Group events by calculatedStartDate
  const grouped: Record<string, PlantEventResponse[]> = {};
  const sorted = [...events].sort((a, b) =>
    (a.calculatedStartDate ?? '').localeCompare(b.calculatedStartDate ?? ''),
  );
  for (const evt of sorted) {
    if (!evt.calculatedStartDate) continue;
    const key = evt.calculatedStartDate;
    if (!grouped[key]) grouped[key] = [];
    if (!grouped[key].some(e => e.id === evt.id)) grouped[key].push(evt);
  }
  const dates = Object.keys(grouped).sort();

  const monthLabel = month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const now = new Date();
  const isCurrentMonth =
    month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  return (
    <div className="flex flex-col gap-4">
      {/* Month nav */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <button type="button" onClick={onPrevMonth}
          className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
          <ChevronLeft className="h-4 w-4 text-slate-500" />
        </button>
        <span className="text-base font-bold capitalize text-slate-800">{monthLabel}</span>
        <button type="button" onClick={onNextMonth}
          className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Timeline list */}
      {dates.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 shadow-sm">
          <Clock className="mb-3 h-8 w-8 text-slate-200" />
          <p className="text-sm font-medium text-slate-500">Không có sự kiện trong tháng này</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 bottom-6 w-0.5 bg-slate-200" />

          {dates.map(dateStr => {
            const dateObj = new Date(dateStr + 'T00:00:00');
            const label = dateObj.toLocaleDateString('vi-VN', {
              weekday: 'long', day: 'numeric', month: 'short',
            });
            return (
              <div key={dateStr} className="mb-8">
                {/* Date header with timeline dot */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-sm font-bold capitalize text-slate-700">{label}</span>
                </div>
                {/* Events */}
                <div className="pl-9">
                  <GroupedEventList events={grouped[dateStr]} onEdit={onEdit} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {dates.length > 0 && (
        <div className="flex items-center justify-center gap-5 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
          {([
            ['#3B82F6', 'Chăm sóc'],
            ['#F97316', 'Sức khỏe'],
            ['#10B981', 'Sinh trưởng'],
          ] as const).map(([color, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-medium text-slate-500">{label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
