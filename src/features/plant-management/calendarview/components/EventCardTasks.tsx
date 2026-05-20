import { useState } from 'react';
import { CheckCircle2, Circle, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';
import type { PlantEventResponse } from '../../shared/types';

interface EventCardTasksProps {
  event: PlantEventResponse;
  stripColor: string;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
}

export function EventCardTasks({ event, stripColor, onToggleTask }: EventCardTasksProps) {
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
