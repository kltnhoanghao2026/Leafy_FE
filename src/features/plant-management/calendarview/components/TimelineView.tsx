import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlantEventResponse } from '../../shared/types';

interface TimelineViewProps {
  /** All events for the current month, pre-sorted by date */
  events: PlantEventResponse[];
  month: Date; // current month being shown
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}

export function TimelineView({
  events,
  month,
  onPrevMonth,
  onNextMonth,
  selectedDate,
  onSelectDate,
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
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
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
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-10 shadow-sm">
          <Clock className="mb-3 h-8 w-8 text-slate-200" />
          <p className="text-sm font-medium text-slate-500">Không có sự kiện trong tháng này</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {dates.map(dateStr => {
            const isSelected = selectedDate === dateStr;
            const dateObj = new Date(dateStr + 'T00:00:00');
            const label = dateObj.toLocaleDateString('vi-VN', {
              weekday: 'long', day: 'numeric', month: 'short',
            });
            return (
              <button key={dateStr} type="button"
                onClick={() => onSelectDate(isSelected ? null : dateStr)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${
                    isSelected ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                  <span className={`text-sm font-semibold capitalize ${
                    isSelected ? 'text-emerald-700' : 'text-slate-700'
                  }`}>{label}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {grouped[dateStr].length}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
