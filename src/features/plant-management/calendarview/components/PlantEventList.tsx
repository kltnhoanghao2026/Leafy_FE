import { CalendarDays } from 'lucide-react';
import type { PlantEventResponse } from '../../shared/types';
import { EventCard } from './EventCard';

interface PlantEventListProps {
  title: string;
  events: PlantEventResponse[];
  isLoading?: boolean;
  isError?: boolean;
  emptyText?: string;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
}

export function PlantEventList({
  title,
  events,
  isLoading = false,
  isError = false,
  emptyText = "Chưa có lịch chăm sóc.",
  onToggleTask,
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
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onToggleTask={onToggleTask}
            />
          ))}
        </div>
      )}
    </section>
  );
}
