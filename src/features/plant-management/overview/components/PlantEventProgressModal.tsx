import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  CheckCircle2,
  Circle,
  ListChecks,
  Sprout,
  MapPin,
  CalendarDays,
  ChevronRight,
  Leaf,
  Clock,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Pencil,
  Trash2,
} from "lucide-react";
import { ROUTES } from "../../../../lib/routes";
import {
  usePlantEvent,
  useToggleTaskMutation,
  useUpdatePlantEventMutation,
} from "../..";
import type { PlantEventResponse } from "../../shared/types";
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ICONS,
  EVENT_CATEGORY_MAP,
  CATEGORY_DOT_COLORS,
} from "../../shared/components/displayUtils";
import { useTranslation } from "../../../../i18n";
import type { TFunction } from "../../../../i18n/context";

interface PlantEventProgressModalProps {
  event: PlantEventResponse;
  onClose: () => void;
  /** Called when the user clicks Edit for any event (main or child). */
  onEdit?: (event: PlantEventResponse) => void;
  /** Called when the user clicks Delete for any event (main or child). */
  onDelete?: (event: PlantEventResponse) => void;
  /** Called when the user toggles a task on any child event. */
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

// ── CircleProgress ────────────────────────────────────────────────────────────

function CircleProgress({
  pct,
  color,
  size = 56,
  strokeWidth = 5,
  label,
  sublabel,
}: {
  pct: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const isComplete = pct === 100;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={isComplete ? "#10b981" : color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums"
          style={{ color: isComplete ? "#10b981" : color }}
        >
          {pct}%
        </span>
      </div>
      <p className="text-[11px] font-bold text-slate-600 leading-tight text-center">{label}</p>
      <p className="text-[10px] text-slate-400 text-center">{sublabel}</p>
    </div>
  );
}

// ── ChildEventTree ────────────────────────────────────────────────────────────

function ChildEventNode({
  event,
  dotColor,
  dotColorRgb,
  depth,
  onToggleComplete,
  onEdit,
  onDelete,
  onToggleTask,
  t,
}: {
  event: PlantEventResponse;
  dotColor: string;
  dotColorRgb: string;
  depth: number;
  onToggleComplete: (eventId: string, completed: boolean) => void;
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  t: TFunction;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(depth === 0);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const hasChildren = event.children && event.children.length > 0;
  const Icon = EVENT_TYPE_ICONS[event.eventType] ?? Sprout;

  const tasks = event.tasks ?? [];
  const taskDone = tasks.filter((t) => t.completed).length;
  const taskPct = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : 0;
  const childrenDone = hasChildren ? event.children.filter((c) => c.completed).length : 0;

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return null;
    const parts = d.split("-");
    return `${parts[2]}/${parts[1]}`;
  };
  const startStr = fmtDate(event.calculatedStartDate);
  const endStr = fmtDate(event.calculatedEndDate);
  const dateLabel = startStr && endStr && startStr !== endStr ? `${startStr} → ${endStr}` : startStr;

  return (
    <div
      className="transition-colors duration-150 rounded-xl"
    >
      <div className="flex w-full items-start gap-3 px-2 py-2.5">
        {/* Completion toggle */}
        <button
          type="button"
          onClick={() => onToggleComplete(event.id, !event.completed)}
          className="mt-2 shrink-0 transition-all hover:scale-110"
          title={event.completed ? t('plantManagement.overview.markAsIncomplete') : t('plantManagement.overview.markAsComplete')}
        >
          {event.completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
          )}
        </button>

        {/* Edit & Delete actions */}
        <div className="mt-2 flex shrink-0 items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="rounded-lg p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(event)}
              className="rounded-lg p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title={t('plantManagement.deleteEvent.confirmDelete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Icon badge */}
        <span
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `rgba(${dotColorRgb},0.1)`, color: dotColor }}
        >
          <Icon className="h-4 w-4" />
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1 pt-0.5">
          {/* Title row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-sm font-semibold truncate leading-tight ${
                event.completed ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
            </span>
            <span
              className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                backgroundColor: event.planned ? `${dotColor}18` : "#f1f5f9",
                color: event.planned ? dotColor : "#94a3b8",
                borderColor: event.planned ? `${dotColor}44` : "#e2e8f0",
              }}
            >
              {event.planned ? t('plantManagement.overview.planned') : t('plantManagement.overview.recorded')}
            </span>
          </div>

          {/* Note / description */}
          {(event.note || event.description) && (
            <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{event.note || event.description}</p>
          )}

          {/* Meta badges */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
            {dateLabel && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {dateLabel}
              </span>
            )}
            {event.durationDays != null && event.durationDays > 1 && (
              <span
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ backgroundColor: `rgba(${dotColorRgb},0.1)`, color: dotColor }}
              >
                {event.durationDays}d
              </span>
            )}
            {/* Plant badge */}
            {event.plant && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD.PLANT_DETAIL(event.plantId))}
                className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <Leaf className="h-2.5 w-2.5" />
                {event.plant.nickName || event.plant.plantNumber || event.plant.tagCode || event.plant.id.slice(0, 8)}
              </button>
            )}
            {/* Farm Zone badge */}
            {event.farmZone?.zoneName && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD.FARM_ZONE_DETAIL(event.farmPlotId ?? "", event.farmZoneId ?? ""))}
                className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <MapPin className="h-2.5 w-2.5" />
                {event.farmZone.zoneName}
              </button>
            )}
            {/* Farm Plot badge (only if no zone) */}
            {event.farmPlot?.name && !event.farmZone?.zoneName && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD.FARM_PLOT_DETAIL(event.farmPlotId ?? ""))}
                className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <MapPin className="h-2.5 w-2.5" />
                {event.farmPlot.name}
              </button>
            )}
            {/* Plan badge */}
            {event.planApply && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD.PLAN_DETAIL(event.planApplyId ?? ""))}
                className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <CalendarDays className="h-2.5 w-2.5" />
                {event.planApply.planName || event.planApply.diseaseName || "Kế hoạch"}
              </button>
            )}
            {event.estimatedCost && (
              <span className="ml-auto font-semibold text-slate-600">{event.estimatedCost}</span>
            )}
          </div>

          {/* Task progress bar (if tasks exist) */}
          {tasks.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <ListChecks
                className="h-3 w-3 shrink-0"
                style={{ color: taskDone === tasks.length ? "#10B981" : dotColor }}
              />
              <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: `${taskPct}%`,
                    backgroundColor: taskDone === tasks.length ? "#10B981" : dotColor,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ color: taskDone === tasks.length ? "#10B981" : dotColor }}
              >
                {taskDone}/{tasks.length}
              </span>
              <button
                type="button"
                onClick={() => setTasksExpanded((v) => !v)}
                className="ml-1 rounded p-0.5 text-slate-400 hover:bg-slate-100 transition-colors"
                aria-label={tasksExpanded ? t('plantManagement.overview.hideTasks') : t('plantManagement.overview.showTasks')}
              >
                {tasksExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
          )}

          {/* Expandable task rows */}
          {tasks.length > 0 && tasksExpanded && (
            <div className="mt-2 space-y-1">
              {tasks
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5"
                  >
              <button
                type="button"
                title={task.completed ? t('plantManagement.eventEdit.taskMarkUndone') : t('plantManagement.eventEdit.taskMarkDone')}
                onClick={() => onToggleTask?.(event, idx)}
                className="mt-0.5 shrink-0 transition-colors hover:opacity-70"
              >
                      {task.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-slate-300" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[11px] font-semibold leading-tight ${
                          task.completed ? "text-slate-400 line-through" : "text-slate-700"
                        }`}
                      >
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
                          backgroundColor: dotColor + "18",
                          color: dotColor,
                        }}
                      >
                        {task.estimatedCost}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Children completion summary (inline) */}
          {hasChildren && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <GitBranch
                className="h-3 w-3 shrink-0"
                style={{ color: childrenDone === event.children.length ? "#10B981" : dotColor }}
              />
              <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((childrenDone / event.children.length) * 100)}%`,
                    backgroundColor: childrenDone === event.children.length ? "#10B981" : dotColor,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ color: childrenDone === event.children.length ? "#10B981" : dotColor }}
              >
                {childrenDone}/{event.children.length}
              </span>
            </div>
          )}
        </div>

        {/* Child count + expand icon */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 shrink-0 flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-slate-200 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
              {event.children.length}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                expanded ? "" : "-rotate-90"
              }`}
            />
          </button>
        )}
      </div>

      {/* Nested children */}
      {hasChildren && expanded && (
        <div
          className="ml-[46px] pb-2 pl-3 border-l-2 border-dashed"
          style={{ borderColor: `rgba(${dotColorRgb},0.2)` }}
        >
          <ChildEventTree
            children={event.children}
            dotColor={dotColor}
            dotColorRgb={dotColorRgb}
            depth={depth + 1}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleTask={onToggleTask}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

function ChildEventTree({
  children,
  dotColor,
  dotColorRgb,
  depth,
  onToggleComplete,
  onEdit,
  onDelete,
  onToggleTask,
  t,
}: {
  children: PlantEventResponse[];
  dotColor: string;
  dotColorRgb: string;
  depth: number;
  onToggleComplete: (eventId: string, completed: boolean) => void;
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  t: TFunction;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {children.map((child) => (
        <ChildEventNode
          key={child.id}
          event={child}
          dotColor={dotColor}
          dotColorRgb={dotColorRgb}
          depth={depth}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleTask={onToggleTask}
          t={t}
        />
      ))}
    </div>
  );
}

// ── PlantEventProgressModal ───────────────────────────────────────────────────

export function PlantEventProgressModal({
  event: initialEvent,
  onClose,
  onEdit,
  onDelete,
  onToggleTask,
}: PlantEventProgressModalProps) {
  const { t } = useTranslation();
  
  // Always fetch live data so toggling reflects immediately
  const { data: liveEvent } = usePlantEvent(initialEvent.id, true);
  const event = liveEvent ?? initialEvent;

  const category = EVENT_CATEGORY_MAP[event.eventType] ?? "ROUTINE_CARE";
  const dotColor = CATEGORY_DOT_COLORS[category];
  const dotColorRgb = hexToRgb(dotColor);

  const hasFarmScope = !!(event.farmZoneId || event.farmPlotId);

  // Mutations
  const toggleTask = useToggleTaskMutation();
  const updateChildEvent = useUpdatePlantEventMutation();

  const tasks = event.tasks ?? [];
  const taskDone = tasks.filter((t) => t.completed).length;
  const taskPct = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : 0;

  // Progress is always computed from the child event hierarchy
  const directChildren = event.children ?? [];
  const childrenDone = directChildren.filter((c) => c.completed).length;
  const progressTotal = directChildren.length;
  const progressCompleted = childrenDone;
  const progressPct =
    progressTotal > 0 ? Math.round((progressCompleted / progressTotal) * 100) : 0;

  const handleToggleChildComplete = (childEventId: string, completed: boolean) => {
    void updateChildEvent.mutateAsync({
      eventId: childEventId,
      payload: { completed },
    });
  };

  const showSummaryCards = tasks.length > 0 || progressTotal > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-70 flex items-end justify-center sm:items-center bg-slate-900/50 backdrop-blur-sm px-0 sm:px-4 py-0 sm:py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-xl max-h-[95vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden">

        {/* ── Colored top accent bar ── */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{ background: `linear-gradient(90deg, ${dotColor}, rgba(${dotColorRgb},0.3))` }}
        />

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pt-5 pb-6 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-widest"
                  style={{ backgroundColor: `rgba(${dotColorRgb},0.12)`, color: dotColor }}
                >
                  <ChevronRight className="h-3 w-3" />
                  {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                </span>
                <h3 className="mt-2 text-xl font-black text-slate-900 leading-tight">
                  {event.note ?? t('plantManagement.overview.eventDetailsTitle')}
                </h3>
                {event.description && (
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{event.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(event)}
                    className="rounded-full p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                    title={t('common.edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(event)}
                    className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title={t('plantManagement.deleteEvent.confirmDelete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 -mt-0.5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label={t('plantManagement.overview.closeModal')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Date / status chips */}
            <div className="flex flex-wrap items-center gap-2">
              {(event.calculatedStartDate || event.calculatedEndDate) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(event.calculatedStartDate)}
                  {event.calculatedEndDate &&
                    event.calculatedEndDate !== event.calculatedStartDate && (
                      <> <span className="text-slate-300">→</span> {formatDate(event.calculatedEndDate)}</>
                    )}
                </span>
              )}
              {event.completed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {t('plantManagement.overview.completedBadge')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-black text-amber-600">
                  <Clock className="h-3.5 w-3.5" />
                  {t('plantManagement.overview.inProgress')}
                </span>
              )}
            </div>

            {/* ── Progress summary cards ── */}
            {showSummaryCards && (
              <div
                className="flex gap-4 rounded-2xl p-4 border"
                style={{ backgroundColor: `rgba(${dotColorRgb},0.04)`, borderColor: `rgba(${dotColorRgb},0.12)` }}
              >
                {tasks.length > 0 && (
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <CircleProgress
                      pct={taskPct}
                      color={dotColor}
                      label={t('plantManagement.overview.taskProgressLabel')}
                      sublabel={`${taskDone}/${tasks.length} ${t('plantManagement.overview.tasksDone')}`}
                    />
                  </div>
                )}
                {tasks.length > 0 && progressTotal > 0 && (
                  <div className="w-px bg-slate-200 shrink-0 rounded-full" />
                )}
                {progressTotal > 0 && (
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <CircleProgress
                      pct={progressPct}
                      color={dotColor}
                      label={t('plantManagement.overview.trackProgressLabel')}
                      sublabel={`${progressCompleted}/${progressTotal} ${t('plantManagement.overview.tasksDone')}`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Tasks section ── */}
            {tasks.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex items-center justify-center h-6 w-6 rounded-lg"
                    style={{ backgroundColor: `rgba(${dotColorRgb},0.12)` }}
                  >
                    <ListChecks className="h-3.5 w-3.5" style={{ color: dotColor }} />
                  </div>
                  <p className="text-sm font-black text-slate-700">
                    {t('plantManagement.overview.taskSectionTitle')}
                  </p>
                  <span className="ml-auto text-xs font-semibold text-slate-400 tabular-nums">
                    {taskDone}/{tasks.length}
                  </span>
                </div>

                {/* Slim progress bar */}
                <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-1 rounded-full transition-all duration-700"
                    style={{
                      width: `${taskPct}%`,
                      backgroundColor: taskDone === tasks.length ? "#10B981" : dotColor,
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  {tasks
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((task, idx) => (
                      <div
                        key={idx}
                        className={`group flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
                          task.completed
                            ? "border-emerald-100 bg-linear-to-r from-emerald-50 to-white shadow-sm"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                        }`}
                      >
                        {/* Step number */}
                        <span
                          className={`shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                            task.completed
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {task.completed ? "✓" : idx + 1}
                        </span>

                        <button
                          type="button"
                          disabled={toggleTask.isPending}
                          onClick={() =>
                            void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
                          }
                          className="mt-0.5 shrink-0 transition-all hover:scale-110 disabled:opacity-40"
                          aria-label={task.completed ? t('plantManagement.eventEdit.taskMarkUndone') : t('plantManagement.eventEdit.taskMarkDone')}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400" strokeWidth={2} />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold leading-tight ${
                              task.completed
                                ? "text-slate-400 line-through"
                                : "text-slate-700"
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{task.description}</p>
                          )}
                        </div>

                        {task.estimatedCost && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                            {task.estimatedCost}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* ── Child event hierarchy tree ── */}
            {event.children && event.children.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex items-center justify-center h-6 w-6 rounded-lg"
                    style={{ backgroundColor: `rgba(${dotColorRgb},0.12)` }}
                  >
                    <GitBranch className="h-3.5 w-3.5" style={{ color: dotColor }} />
                  </div>
                  <p className="text-sm font-black text-slate-700">
                    {t('plantManagement.overview.trackSectionTitle')}
                  </p>
                  <span className="ml-auto text-xs font-semibold text-slate-400 tabular-nums">
                    {progressCompleted}/{progressTotal}
                  </span>
                </div>

                {/* Progress bar */}
                {progressTotal > 0 && (
                  <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: progressCompleted === progressTotal ? '#10B981' : dotColor,
                      }}
                    />
                  </div>
                )}

                <ChildEventTree children={event.children} dotColor={dotColor} dotColorRgb={dotColorRgb} depth={0} onToggleComplete={handleToggleChildComplete} onEdit={onEdit} onDelete={onDelete} onToggleTask={onToggleTask} t={t} />
              </section>
            )}

            {/* ── Completion banner ── */}
            {event.completed && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                <p className="text-sm font-bold text-emerald-700">{t('plantManagement.overview.completedBanner')}</p>
              </div>
            )}

          </div>
        </div>

        {/* ── Bottom drag handle (mobile) ── */}
        <div className="sm:hidden shrink-0 flex justify-center pb-3 pt-1">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
