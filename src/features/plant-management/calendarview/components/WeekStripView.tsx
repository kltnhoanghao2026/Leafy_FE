import { useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { GroupedEventList } from './GroupedEventList';
import { CATEGORY_DOT_COLORS, getEventCategory } from '../../shared/components/displayUtils';
import { toLocalDateOnly } from '../../shared/utils/dateOnly';
import type { PlantEventResponse } from '../../shared/types';

const VI_WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface WeekStripViewProps {
  weekDays: string[]; // 7 YYYY-MM-DD strings Mon→Sun
  eventsByDate: Map<string, PlantEventResponse[]>;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  isCurrentWeek: boolean;
  weekLabel: string;
  onEdit: (e: PlantEventResponse) => void;
}

export function WeekStripView({
  weekDays,
  eventsByDate,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  isCurrentWeek,
  weekLabel,
  onEdit,
}: WeekStripViewProps) {
  const todayStr = toLocalDateOnly(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Week nav */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-100">
        <button type="button" onClick={onPrevWeek}
          className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
          <ChevronLeft className="h-4 w-4 text-slate-500" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 capitalize">{weekLabel}</span>
          {!isCurrentWeek && (
            <button type="button" onClick={onThisWeek}
              className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              Hôm nay
            </button>
          )}
        </div>
        <button type="button" onClick={onNextWeek}
          className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Day strip */}
      <div className="grid grid-cols-7 gap-1 rounded-2xl bg-white p-2 shadow-sm border border-slate-100">
        {weekDays.map((dateStr, i) => {
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dayEvts = eventsByDate.get(dateStr) ?? [];
          const dots = [
            ...new Set(dayEvts.map(e => CATEGORY_DOT_COLORS[getEventCategory(e.eventType)])),
          ].slice(0, 3);
          const day = parseInt(dateStr.slice(8), 10);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`flex flex-col items-center rounded-xl py-2 transition-colors ${
                isSelected
                  ? 'bg-[#2F7F34] text-white'
                  : isToday
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase ${
                isSelected ? 'text-emerald-200' : isToday ? 'text-emerald-500' : 'text-slate-400'
              }`}>
                {VI_WEEKDAY_SHORT[i]}
              </span>
              <span className={`mt-1 text-base font-bold ${
                isSelected ? 'text-white' : isToday ? 'text-emerald-600' : 'text-slate-800'
              }`}>
                {day}
              </span>
              <div className="mt-1.5 flex h-2 items-center gap-0.5">
                {dots.map((color, idx) => (
                  <span key={idx} className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : color }} />
                ))}
                {dayEvts.length > 3 && (
                  <span className={`text-[7px] font-bold ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>+</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Events for selected day */}
      {selectedDate && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 capitalize">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {selectedEvents.length} sự kiện
            </span>
          </div>
          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <CalendarRange className="mb-3 h-8 w-8 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">Không có sự kiện trong ngày này</p>
            </div>
          ) : (
            <GroupedEventList events={selectedEvents} onEdit={onEdit} />
          )}
        </div>
      )}

      {/* No day selected: show all week events sorted */}
      {!selectedDate && (
        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">Sự kiện trong tuần</p>
          {(() => {
            const allWeekEvents = weekDays.flatMap(d => eventsByDate.get(d) ?? [])
              .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
              .sort((a, b) => (a.calculatedStartDate ?? '').localeCompare(b.calculatedStartDate ?? ''));
            return allWeekEvents.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <CalendarRange className="mb-3 h-8 w-8 text-slate-200" />
                <p className="text-sm font-medium text-slate-500">Không có sự kiện trong tuần này</p>
              </div>
            ) : (
              <GroupedEventList events={allWeekEvents} onEdit={onEdit} />
            );
          })()}
        </div>
      )}
    </div>
  );
}
