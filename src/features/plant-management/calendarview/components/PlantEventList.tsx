import { useState } from 'react';
import { CalendarDays, CheckCircle2, Circle, ChevronDown, ChevronUp, ListChecks } from "lucide-react";
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
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
}

// ── EventCardTasks ─────────────────────────────────────────────────────────────
function EventCardTasks({
  event,
  stripColor,
  onToggleTask,
}: {
  event: PlantEventResponse;
  stripColor: string;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
}) {
  const tasks = event.tasks ?? [];
  if (tasks.length === 0) return null;

  const [expanded, setExpanded] = useState(false);
  const done = tasks.filter(t => t.completed).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const allDone = done === tasks.length;

  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      {/* Task progress header — click to expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-2"
      >
        <ListChecks className="h-3 w-3 shrink-0" style={{ color: stripColor }} />
        <span className="flex-1 text-left text-[10px] font-bold text-slate-500">
          Công việc
        </span>
        <span
          className="text-[10px] font-black tabular-nums"
          style={{ color: allDone ? '#10B981' : stripColor }}
        >
          {done}/{tasks.length}
        </span>
        {expanded
          ? <ChevronUp className="h-3 w-3 text-slate-400" />
          : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {/* Mini progress bar */}
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: allDone ? '#10B981' : stripColor,
          }}
        />
      </div>

      {/* Task rows (collapsed by default) */}
      {expanded && (
        <div className="mt-2 space-y-1.5">
          {tasks.map((task, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5"
            >
              <button
                type="button"
                title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                onClick={() => onToggleTask?.(event, idx)}
                className="mt-0.5 shrink-0 transition-colors hover:opacity-70"
              >
                {task.completed
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  : <Circle className="h-3.5 w-3.5 text-slate-300" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-semibold leading-tight ${
                  task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                }`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-400">
                    {task.description}
                  </p>
                )}
              </div>
              {task.estimatedCost && (
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{
                    backgroundColor: stripColor + '18',
                    color: stripColor,
                  }}
                >
                  {task.estimatedCost}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PlantEventList ─────────────────────────────────────────────────────────────
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
          {events.map(event => {
            const category = getEventCategory(event.eventType);
            const stripColor = CATEGORY_DOT_COLORS[category];
            const tasks = event.tasks ?? [];
            const tasksDone = tasks.filter(t => t.completed).length;
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
                    <span className={`text-sm font-bold leading-snug ${
                      event.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                    }`}>
                      {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {tasks.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: tasksDone === tasks.length ? '#10B98118' : stripColor + '18',
                            color: tasksDone === tasks.length ? '#10B981' : stripColor,
                            borderColor: tasksDone === tasks.length ? '#10B98144' : stripColor + '44',
                          }}
                        >
                          <ListChecks className="h-2.5 w-2.5" />
                          {tasksDone}/{tasks.length}
                        </span>
                      )}
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: stripColor + '18',
                          color: stripColor,
                          borderColor: stripColor + '44',
                        }}
                      >
                        {event.planned ? 'Đã lên lịch' : 'Đã ghi nhận'}
                      </span>
                    </div>
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
                  {/* Task checklist */}
                  <EventCardTasks
                    event={event}
                    stripColor={stripColor}
                    onToggleTask={onToggleTask}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
