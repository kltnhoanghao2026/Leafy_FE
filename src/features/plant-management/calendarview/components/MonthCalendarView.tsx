import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { GroupedEventList } from './GroupedEventList';
import { CATEGORY_DOT_COLORS, getEventCategory } from '../../shared/components/displayUtils';
import { toLocalDateOnly } from '../../shared/utils/dateOnly';
import type { PlantEventResponse } from '../../shared/types';

const VI_WEEKDAY_HEADER = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const SELECTED_COLOR = '#2F7F34';

interface MonthCalendarViewProps {
  events: PlantEventResponse[];
  month: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onEdit: (e: PlantEventResponse) => void;
}

function buildCalendarGrid(month: Date): (string | null)[][] {
  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, '0');
    const mm = String(mon + 1).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function MonthCalendarView({
  events,
  month,
  onPrevMonth,
  onNextMonth,
  onEdit,
}: MonthCalendarViewProps) {
  const todayStr = toLocalDateOnly(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  // Build eventsByDate map (handle multi-day spans)
  const eventsByDate = new Map<string, PlantEventResponse[]>();
  for (const evt of events) {
    const start = evt.calculatedStartDate;
    const end = evt.calculatedEndDate ?? start;
    if (!start) continue;
    const startD = new Date(start + 'T00:00:00');
    const endD = new Date((end ?? start) + 'T00:00:00');
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const key = toLocalDateOnly(d);
      if (!eventsByDate.has(key)) eventsByDate.set(key, []);
      const list = eventsByDate.get(key)!;
      if (!list.some(e => e.id === evt.id)) list.push(evt);
    }
  }

  const rows = buildCalendarGrid(month);
  const now = new Date();
  const isCurrentMonth =
    month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  const monthLabel = month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar card */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <button type="button" onClick={onPrevMonth}
            className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold capitalize text-slate-800">{monthLabel}</span>
            {!isCurrentMonth && (
              <button type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                Hôm nay
              </button>
            )}
          </div>
          <button type="button" onClick={onNextMonth}
            className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-1 pt-2">
          {VI_WEEKDAY_HEADER.map(h => (
            <div key={h} className="py-1 text-center text-[10px] font-semibold uppercase text-slate-400">{h}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="px-1 pb-2">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7">
              {row.map((dateStr, ci) => {
                if (!dateStr) return <div key={ci} />;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayEvts = eventsByDate.get(dateStr) ?? [];
                const uniqueColors = [...new Set(dayEvts.map(e => CATEGORY_DOT_COLORS[getEventCategory(e.eventType)]))].slice(0, 3);
                const hasMore = uniqueColors.length > 3;
                const day = parseInt(dateStr.slice(8), 10);

                return (
                  <button key={dateStr} type="button"
                    onClick={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
                    style={{
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: isSelected ? '#86efac' : 'transparent',
                      backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                    }}
                    className="flex flex-col items-center py-1 transition-all hover:bg-slate-50">
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isSelected ? SELECTED_COLOR : isToday ? 'rgba(47,127,52,0.12)' : 'transparent',
                      }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: isSelected || isToday ? 700 : 500,
                        color: isSelected ? '#fff' : isToday ? SELECTED_COLOR : '#334155',
                      }}>
                        {day}
                      </span>
                    </div>
                    {/* Dots */}
                    <div className="mt-1 flex h-1.5 items-center justify-center gap-0.5">
                      {uniqueColors.map((color, i) => (
                        <span key={i} className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : color }} />
                      ))}
                      {hasMore && <span className="text-[6px] text-slate-400">+</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Dot legend */}
        <div className="flex items-center justify-center gap-5 border-t border-slate-100 px-4 py-2.5">
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
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold capitalize text-slate-700">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {selectedEvents.length} sự kiện
            </span>
          </div>
          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <CalendarDays className="mb-3 h-8 w-8 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">Không có sự kiện trong ngày này</p>
            </div>
          ) : (
            <GroupedEventList events={selectedEvents} onEdit={onEdit} />
          )}
        </div>
      )}

      {/* No day selected: show all month events */}
      {!selectedDate && (
        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">Sự kiện trong tháng</p>
          {events.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <CalendarDays className="mb-3 h-8 w-8 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">Không có sự kiện trong tháng này</p>
            </div>
          ) : (
            <GroupedEventList
              events={[...events].sort((a, b) =>
                (a.calculatedStartDate ?? '').localeCompare(b.calculatedStartDate ?? ''),
              )}
              onEdit={onEdit}
            />
          )}
        </div>
      )}
    </div>
  );
}
