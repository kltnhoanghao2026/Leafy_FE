import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_DOT_COLORS, getEventCategory } from '../../shared/components/displayUtils';
import { toLocalDateOnly } from '../../shared/utils/dateOnly';
import type { PlantEventResponse } from '../../shared/types';
import { VI_WEEKDAY_SHORT, SELECTED_COLOR, CALENDAR_LEGEND } from '../utils/colorUtils';


interface WeekStripViewProps {
  weekDays: string[];
  eventsByDate: Map<string, PlantEventResponse[]>;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  isCurrentWeek: boolean;
  weekLabel: string;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
  hoveredDateRange?: { start: string; end: string; color: string } | null;
}

export function WeekStripView({
  weekDays,
  eventsByDate,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  isCurrentWeek,
  weekLabel,
  selectedDate,
  onSelectDate,
  hoveredDateRange,
}: WeekStripViewProps) {
  const todayStr = toLocalDateOnly(new Date());

  // Derive month label from the week's first day
  const monthLabel = new Date(weekDays[0] + 'T00:00:00').toLocaleDateString('vi-VN', {
    month: 'long', year: 'numeric',
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Navigation row */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onPrevWeek}
          className="rounded-lg bg-slate-100 p-2 transition-colors hover:bg-slate-200"
        >
          <ChevronLeft className="h-4 w-4 text-slate-500" />
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-bold capitalize text-slate-800">{weekLabel}</span>
          <span className="text-[10px] font-semibold capitalize text-slate-400">{monthLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={onThisWeek}
              className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 transition-colors hover:bg-emerald-200"
            >
              Hôm nay
            </button>
          )}
          <button
            type="button"
            onClick={onNextWeek}
            className="rounded-lg bg-slate-100 p-2 transition-colors hover:bg-slate-200"
          >
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Day strip */}
      <div className="grid grid-cols-7 px-2 py-3">
        {weekDays.map((dateStr, i) => {
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isHovered = !!hoveredDateRange && dateStr >= hoveredDateRange.start && dateStr <= hoveredDateRange.end;
          const dayEvts   = eventsByDate.get(dateStr) ?? [];
          const allColors = [...new Set(dayEvts.map(e => CATEGORY_DOT_COLORS[getEventCategory(e.eventType)]))];
          const hasMore   = allColors.length > 3;
          const uniqueColors = allColors.slice(0, 3);
          const day = parseInt(dateStr.slice(8), 10);
          const isWeekend = i >= 5; // Sat, Sun

          let cellStyle: React.CSSProperties;
          if (isHovered) {
            const isStart = dateStr === hoveredDateRange!.start;
            const isEnd = dateStr === hoveredDateRange!.end;
            const hc = hoveredDateRange!.color;
            cellStyle = {
              borderWidth: 0,
              backgroundColor: `${hc}2e`,
              borderTopLeftRadius: isStart ? 12 : 0,
              borderBottomLeftRadius: isStart ? 12 : 0,
              borderTopRightRadius: isEnd ? 12 : 0,
              borderBottomRightRadius: isEnd ? 12 : 0,
            };
          } else if (isSelected) {
            cellStyle = { borderRadius: 12, borderWidth: 1, borderColor: '#86efac', backgroundColor: '#f0fdf4' };
          } else {
            cellStyle = { borderRadius: 12, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'transparent' };
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              style={cellStyle}
              className="flex flex-col items-center gap-1 py-2.5 transition-all hover:bg-slate-50"
            >
              {/* Weekday label */}
              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                isToday && !isSelected
                  ? 'text-emerald-500'
                  : isWeekend && !isSelected
                  ? 'text-rose-400'
                  : isSelected
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}>
                {VI_WEEKDAY_SHORT[i]}
              </span>

              {/* Day number circle */}
              <div
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? SELECTED_COLOR : isToday ? 'rgba(47,127,52,0.12)' : 'transparent',
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected || isToday ? 700 : 500,
                    color: isSelected ? '#fff' : isToday ? SELECTED_COLOR : isWeekend ? '#f43f5e' : '#334155',
                  }}
                >
                  {day}
                </span>
              </div>

              {/* Dots */}
              <div className="mt-1 flex h-1.5 items-center justify-center gap-0.5">
                {uniqueColors.map((color, idx) => (
                  <span
                    key={idx}
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
                {hasMore && <span className="text-[6px] text-slate-400">+</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Color legend */}
      <div className="flex shrink-0 items-center justify-center gap-5 border-t border-slate-100 px-4 py-2.5">
        {CALENDAR_LEGEND.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-medium text-slate-500">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
