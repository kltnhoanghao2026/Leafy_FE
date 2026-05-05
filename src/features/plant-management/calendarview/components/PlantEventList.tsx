import { CalendarDays } from "lucide-react";
import type { PlantEventResponse } from '../../shared/types';
import {
  EVENT_TYPE_LABELS,
  formatDate,
  getEventCategory,
  CATEGORY_DOT_COLORS,
} from '../../shared/components/displayUtils';

interface PlantEventListProps {
  title: string;
  events: PlantEventResponse[];
  isLoading?: boolean;
  isError?: boolean;
  emptyText?: string;
}

export function PlantEventList({
  title,
  events,
  isLoading = false,
  isError = false,
  emptyText = "Chưa có lịch chăm sóc.",
}: PlantEventListProps) {
  return (
    <section className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#245A34]" strokeWidth={2.5} />
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
        </span>
        {!isLoading && !isError && events.length > 0 && (
          <span className="text-xs font-medium text-slate-400">{events.length} sự kiện</span>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          Không tải được lịch chăm sóc.
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
          {emptyText}
        </div>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="flex flex-col gap-2">
          {events.map(event => {
            const category = getEventCategory(event.eventType);
            const stripColor = CATEGORY_DOT_COLORS[category];
            return (
              <article
                key={event.id}
                className="flex overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
              >
                {/* Left color strip */}
                <div className="w-1 shrink-0" style={{ backgroundColor: stripColor }} />
                <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
                  {/* Title + status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold leading-snug text-slate-900">
                      {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                    </span>
                    <span
                      className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: stripColor + '18',
                        color: stripColor,
                        borderColor: stripColor + '44',
                      }}
                    >
                      {event.planned ? 'Đã lên lịch' : 'Đã ghi nhận'}
                    </span>
                  </div>
                  {/* Description */}
                  {(event.description || event.note) && (
                    <p className="line-clamp-1 text-xs text-slate-500">
                      {event.description || event.note}
                    </p>
                  )}
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                    <span>{formatDate(event.calculatedStartDate)}</span>
                    {event.calculatedEndDate && event.calculatedEndDate !== event.calculatedStartDate && (
                      <>
                        <span>→</span>
                        <span>{formatDate(event.calculatedEndDate)}</span>
                      </>
                    )}
                    {event.estimatedCost && (
                      <span className="ml-auto font-semibold text-slate-600">
                        {event.estimatedCost}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
