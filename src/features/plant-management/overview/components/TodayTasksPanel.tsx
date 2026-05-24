import {
  Droplets, Beaker, Trash2, Scissors, Search, Bug, Syringe,
  ShieldAlert, HeartPulse, Activity, PackageOpen, Wheat,
  CheckCircle2, Circle, ListChecks, BarChart2,
} from 'lucide-react';
import type { PlantEventResponse, PlantEventType } from '../../shared/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_MAP, CATEGORY_DOT_COLORS } from '../../shared/components/displayUtils';

// ── Icon map ──────────────────────────────────────────────────────────────────
const EVENT_ICONS: Record<PlantEventType, React.ComponentType<{ className?: string }>> = {
  IRRIGATION: Droplets,
  NUTRITION: Beaker,
  WEED_CONTROL: Trash2,
  PRUNING: Scissors,
  SCOUTING: Search,
  DISEASE_DETECTED: Bug,
  TREATMENT_APPLICATION: Syringe,
  QUARANTINE: ShieldAlert,
  HEALTH_RECOVERY: HeartPulse,
  PHENOLOGY: Activity,
  REPOT: PackageOpen,
  HARVEST: Wheat,
};

// ── EventCard ─────────────────────────────────────────────────────────────────
function EventCard({
  event,
  onSelectEvent,
}: {
  event: PlantEventResponse;
  onSelectEvent?: (event: PlantEventResponse) => void;
}) {
  const Icon = EVENT_ICONS[event.eventType] ?? Droplets;
  const category = EVENT_CATEGORY_MAP[event.eventType] ?? 'ROUTINE_CARE';
  const dotColor = CATEGORY_DOT_COLORS[category];

  const tasks = event.tasks ?? [];
  const doneTasks = tasks.filter((t) => t.completed).length;
  const hasTasks = tasks.length > 0;
  const allDone = hasTasks && doneTasks === tasks.length;
  const pct = hasTasks ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const hasFarmScope = !!(event.farmZoneId || event.farmPlotId);
  const children = event.children ?? [];
  const childrenTotal = children.length;
  const childrenCompleted = children.filter(c => c.completed).length;
  const childrenPct = childrenTotal > 0 ? Math.round((childrenCompleted / childrenTotal) * 100) : 0;
  const allChildrenDone = childrenTotal > 0 && childrenCompleted === childrenTotal;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: 4, borderLeftColor: dotColor }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Icon */}
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${dotColor}1a` }}
        >
          <Icon className="h-4 w-4" style={{ color: dotColor }} />
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold ${event.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
            </p>
            {event.completed && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                Hoàn thành
              </span>
            )}
          </div>

          {event.note && (
            <p className="mt-0.5 text-xs font-medium text-slate-500">{event.note}</p>
          )}

          {/* Task progress bar */}
          {hasTasks && (
            <div className="mt-2 flex items-center gap-2">
              <ListChecks className="h-3 w-3 shrink-0" style={{ color: allDone ? '#10B981' : dotColor }} />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: allDone ? '#10B981' : dotColor }}
                />
              </div>
              <span
                className="text-[10px] font-black tabular-nums"
                style={{ color: allDone ? '#10B981' : dotColor }}
              >
                {doneTasks}/{tasks.length}
              </span>
            </div>
          )}

          {/* Farm-level progress bar */}
          {hasFarmScope && childrenTotal > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <BarChart2 className="h-3 w-3 shrink-0" style={{ color: allChildrenDone ? '#10B981' : dotColor }} />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${childrenPct}%`, backgroundColor: allChildrenDone ? '#10B981' : dotColor }}
                />
              </div>
              <span
                className="text-[10px] font-black tabular-nums"
                style={{ color: allChildrenDone ? '#10B981' : dotColor }}
              >
                {childrenCompleted}/{childrenTotal} cây
              </span>
            </div>
          )}
        </div>

        {/* Theo dõi button */}
        {hasFarmScope && onSelectEvent && (
          <button
            type="button"
            onClick={() => onSelectEvent(event)}
            className="ml-auto mt-0.5 shrink-0 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-[#245A34] hover:bg-[#245A34]/10 hover:text-[#245A34]"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Theo dõi
          </button>
        )}
      </div>

      {/* Task list — always visible */}
      {hasTasks && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-2">
          <div className="flex flex-col gap-1.5">
            {tasks
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((task, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  {task.completed
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 text-[11px] text-slate-400">{task.description}</p>
                    )}
                  </div>
                  {task.estimatedCost && (
                    <span className="shrink-0 text-[10px] font-bold text-slate-400">{task.estimatedCost}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TodayTasksPanel ───────────────────────────────────────────────────────────
export interface TodayTasksPanelProps {
  events: PlantEventResponse[];
  loading: boolean;
  error: boolean;
  onSelectEvent?: (event: PlantEventResponse) => void;
}

export function TodayTasksPanel({ events, loading, error, onSelectEvent }: TodayTasksPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-label="Đang tải">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
        Không tải được công việc hôm nay.
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
        Không có công việc nào hôm nay.
      </div>
    );
  }

  // Sort: incomplete first, then by event type
  const sorted = [...events].sort((a, b) => Number(a.completed) - Number(b.completed));

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((event) => (
        <EventCard key={event.id} event={event} onSelectEvent={onSelectEvent} />
      ))}
    </div>
  );
}
