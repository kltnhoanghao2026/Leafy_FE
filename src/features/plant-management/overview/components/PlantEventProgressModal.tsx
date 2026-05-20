import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  CheckCircle2,
  Circle,
  ListChecks,
  Sprout,
  MapPin,
  RefreshCw,
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
  useEventProgress,
  useToggleTaskMutation,
  useUpdatePlantEventMutation,
  useUpdateEventProgressMutation,
  useGenerateEventProgressMutation,
} from "../..";
import { useMyPlants } from "../..";
import { useFarmZones } from "../../../farm-management/queries";
import type { PlantEventResponse, EventProgressResponse, PageResponse } from "../../shared/types";
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ICONS,
  EVENT_CATEGORY_MAP,
  CATEGORY_DOT_COLORS,
  TARGET_TYPE_LABELS,
  TARGET_TYPE_ICONS,
} from "../../shared/components/displayUtils";

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

// ── ProgressRow ───────────────────────────────────────────────────────────────

function ProgressRow({
  entry,
  label,
  index,
  onToggle,
  onEditNote,
  isToggling,
}: {
  entry: EventProgressResponse;
  label: string;
  index: number;
  onToggle: (progressId: string, completed: boolean) => void;
  onEditNote: (progressId: string, note: string) => void;
  isToggling: boolean;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(entry.note ?? "");

  const handleNoteSave = () => {
    setEditingNote(false);
    if (noteValue !== entry.note) {
      onEditNote(entry.id, noteValue);
    }
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNoteSave();
    if (e.key === "Escape") {
      setNoteValue(entry.note ?? "");
      setEditingNote(false);
    }
  };

  return (
    <div
      className={`group flex flex-col gap-2 rounded-2xl border px-4 py-3 transition-all duration-200 ${
        entry.completed
          ? "border-emerald-100 bg-linear-to-r from-emerald-50 to-white shadow-sm"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Index badge */}
        <span
          className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
            entry.completed
              ? "bg-emerald-100 text-emerald-600"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {entry.completed ? "✓" : index + 1}
        </span>

        {/* Toggle button */}
        <button
          type="button"
          disabled={isToggling}
          onClick={() => onToggle(entry.id, !entry.completed)}
          className="shrink-0 transition-all hover:scale-110 disabled:opacity-40"
          title={entry.completed ? "Đánh dấu chưa thực hiện" : "Đánh dấu đã thực hiện"}
          aria-label={entry.completed ? "Đánh dấu chưa thực hiện" : "Đánh dấu đã thực hiện"}
        >
          {entry.completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />
          ) : (
            <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400" strokeWidth={2} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p
              className={`text-sm font-semibold truncate leading-tight ${
                entry.completed ? "text-slate-400 line-through" : "text-slate-700"
              }`}
            >
              {label}
            </p>
            {entry.completedAt && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-500">
                <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                {new Date(entry.completedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
              </span>
            )}
          </div>

          {/* Note — editable inline */}
          {editingNote ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onBlur={handleNoteSave}
                onKeyDown={handleNoteKeyDown}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs text-slate-600 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
                placeholder="Nhập ghi chú..."
              />
              <button
                type="button"
                onClick={handleNoteSave}
                className="shrink-0 rounded-lg bg-blue-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-600"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => { setNoteValue(entry.note ?? ""); setEditingNote(false); }}
                className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div
              className="mt-0.5 flex items-center gap-1.5"
              onClick={() => { setNoteValue(entry.note ?? ""); setEditingNote(true); }}
            >
              <p className={`text-xs truncate cursor-text ${entry.note ? "text-slate-400" : "text-slate-300 italic"}`}>
                {entry.note || "Thêm ghi chú..."}
              </p>
              <button
                type="button"
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
                title="Sửa ghi chú"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {entry.targetType === "PLANT" ? (
          <Leaf className={`shrink-0 h-3.5 w-3.5 ${entry.completed ? "text-emerald-300" : "text-slate-300"}`} />
        ) : (
          <LayoutGrid className={`shrink-0 h-3.5 w-3.5 ${entry.completed ? "text-emerald-300" : "text-slate-300"}`} />
        )}
      </div>
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
}: {
  event: PlantEventResponse;
  dotColor: string;
  dotColorRgb: string;
  depth: number;
  onToggleComplete: (eventId: string, completed: boolean) => void;
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(depth === 0);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const hasChildren = event.children && event.children.length > 0;
  const TargetIcon = event.targetType ? TARGET_TYPE_ICONS[event.targetType] : null;
  const targetLabel = event.targetType ? TARGET_TYPE_LABELS[event.targetType] : null;
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
          title={event.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
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
              title="Chỉnh sửa"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(event)}
              className="rounded-lg p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Xóa"
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
            {targetLabel && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={{ backgroundColor: `rgba(${dotColorRgb},0.1)`, color: dotColor }}
              >
                {TargetIcon && <TargetIcon className="h-3 w-3 shrink-0" />}
                {targetLabel}
              </span>
            )}
            <span
              className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                backgroundColor: event.planned ? `${dotColor}18` : "#f1f5f9",
                color: event.planned ? dotColor : "#94a3b8",
                borderColor: event.planned ? `${dotColor}44` : "#e2e8f0",
              }}
            >
              {event.planned ? "Đã lên lịch" : "Đã ghi nhận"}
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
                aria-label={tasksExpanded ? "Ẩn công việc" : "Hiện công việc"}
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
                      title={task.completed ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
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
}: {
  children: PlantEventResponse[];
  dotColor: string;
  dotColorRgb: string;
  depth: number;
  onToggleComplete: (eventId: string, completed: boolean) => void;
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
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
  // Always fetch live data so toggling reflects immediately
  const { data: liveEvent } = usePlantEvent(initialEvent.id, true);
  const event = liveEvent ?? initialEvent;

  const category = EVENT_CATEGORY_MAP[event.eventType] ?? "ROUTINE_CARE";
  const dotColor = CATEGORY_DOT_COLORS[category];
  const dotColorRgb = hexToRgb(dotColor);

  const hasFarmScope = !!(event.farmZoneId || event.farmPlotId);
  const isZoneScope = !!event.farmZoneId;

  // Progress entries
  const progressQuery = useEventProgress(event.id, 0, true);
  const progressPage = progressQuery.data as PageResponse<EventProgressResponse> | undefined;
  const progressEntries: EventProgressResponse[] = progressPage?.content ?? [];

  // Target name lookups
  const needPlantLookup =
    hasFarmScope && progressEntries.some((e) => e.targetType === "PLANT");

  const plantsQueryEnabled = useMyPlants(
    needPlantLookup
      ? {
          farmZoneId: event.farmZoneId ?? undefined,
          farmPlotId: !event.farmZoneId ? (event.farmPlotId ?? undefined) : undefined,
          size: 200,
        }
      : {},
  );

  const zonesQuery = useFarmZones(
    event.farmPlotId ?? "",
    hasFarmScope &&
      !isZoneScope &&
      progressEntries.some((e) => e.targetType === "ZONE"),
  );

  const plantMap = useMemo(() => {
    const map = new Map<string, string>();
    (plantsQueryEnabled.data?.content ?? []).forEach((p) => {
      map.set(
        p.id,
        p.nickName || p.plantNumber || `Cây #${p.id.slice(-6)}`,
      );
    });
    return map;
  }, [plantsQueryEnabled.data]);

  const zoneMap = useMemo(() => {
    const map = new Map<string, string>();
    (zonesQuery.data ?? []).forEach((z) => {
      map.set(z.id, z.zoneName || `Khu ${z.id.slice(-6)}`);
    });
    return map;
  }, [zonesQuery.data]);

  const resolveTargetLabel = (entry: EventProgressResponse): string => {
    if (entry.targetType === "PLANT") {
      return plantMap.get(entry.targetId) ?? `Cây #${entry.targetId.slice(-6)}`;
    }
    return zoneMap.get(entry.targetId) ?? `Khu ${entry.targetId.slice(-6)}`;
  };

  // Mutations
  const toggleTask = useToggleTaskMutation();
  const updateChildEvent = useUpdatePlantEventMutation();
  const updateProgress = useUpdateEventProgressMutation();
  const generateProgress = useGenerateEventProgressMutation();

  const tasks = event.tasks ?? [];
  const taskDone = tasks.filter((t) => t.completed).length;
  const taskPct = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : 0;

  // Progress tracking: prefer children completion count when children exist
  const directChildren = event.children ?? [];
  const hasChildHierarchy = directChildren.length > 0;
  const childrenDone = directChildren.filter((c) => c.completed).length;

  const progressTotal = hasChildHierarchy
    ? directChildren.length
    : (event.progressTotal ?? progressEntries.length);
  const progressCompleted = hasChildHierarchy
    ? childrenDone
    : (event.progressCompleted ?? progressEntries.filter((e) => e.completed).length);
  const progressPct =
    progressTotal > 0 ? Math.round((progressCompleted / progressTotal) * 100) : 0;

  const handleToggleProgress = (progressId: string, completed: boolean) => {
    void updateProgress.mutateAsync({
      eventId: event.id,
      progressId,
      payload: { completed },
    });
  };

  const handleEditNote = (progressId: string, note: string) => {
    void updateProgress.mutateAsync({
      eventId: event.id,
      progressId,
      payload: { note },
    });
  };

  const handleToggleChildComplete = (childEventId: string, completed: boolean) => {
    void updateChildEvent.mutateAsync({
      eventId: childEventId,
      payload: { completed },
    });
  };

  const showSummaryCards = tasks.length > 0 || (hasFarmScope && progressTotal > 0) || hasChildHierarchy;

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
                  {event.note ?? "Chi tiết sự kiện"}
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
                    title="Chỉnh sửa"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(event)}
                    className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 -mt-0.5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label="Đóng"
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
                  Hoàn thành
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-black text-amber-600">
                  <Clock className="h-3.5 w-3.5" />
                  Đang thực hiện
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
                      label="Công việc"
                      sublabel={`${taskDone}/${tasks.length} hoàn thành`}
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
                      label="Theo dõi"
                      sublabel={`${progressCompleted}/${progressTotal} hoàn thành`}
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
                    Danh sách công việc
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
                          aria-label={task.completed ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
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

            {/* ── Divider ── */}
            {tasks.length > 0 && hasFarmScope && !hasChildHierarchy && (
              <div className="border-t border-dashed border-slate-100" />
            )}

            {/* ── Progress tracking section (legacy — hidden when children hierarchy exists) ── */}
            {hasFarmScope && !hasChildHierarchy && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex items-center justify-center h-6 w-6 rounded-lg"
                    style={{ backgroundColor: `rgba(${dotColorRgb},0.12)` }}
                  >
                    <Sprout className="h-3.5 w-3.5" style={{ color: dotColor }} />
                  </div>
                  <p className="text-sm font-black text-slate-700">
                    Theo dõi thực hiện
                  </p>
                  {progressTotal > 0 && (
                    <span className="ml-auto text-xs font-semibold text-slate-400 tabular-nums">
                      {progressCompleted}/{progressTotal}
                    </span>
                  )}
                </div>

                {progressTotal > 0 && (
                  <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor:
                          progressCompleted === progressTotal ? "#10B981" : dotColor,
                      }}
                    />
                  </div>
                )}

                {progressQuery.isLoading ? (
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-14 animate-pulse rounded-2xl bg-slate-100"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                ) : progressEntries.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-600">
                        Chưa có dữ liệu theo dõi
                      </p>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-55 mx-auto">
                        {isZoneScope
                          ? "Khởi tạo để theo dõi từng cây trong khu vực này."
                          : "Khởi tạo để theo dõi từng cây / khu vực trong vườn."}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={generateProgress.isPending}
                      onClick={() => void generateProgress.mutateAsync(event.id)}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-60"
                      style={{ backgroundColor: dotColor }}
                    >
                      {generateProgress.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sprout className="h-4 w-4" />
                      )}
                      Khởi tạo theo dõi
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {progressEntries.map((entry, idx) => (
                      <ProgressRow
                        key={entry.id}
                        entry={entry}
                        label={resolveTargetLabel(entry)}
                        index={idx}
                        onToggle={handleToggleProgress}
                        onEditNote={handleEditNote}
                        isToggling={updateProgress.isPending}
                      />
                    ))}
                  </div>
                )}
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
                    Theo dõi thực hiện
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

                <ChildEventTree children={event.children} dotColor={dotColor} dotColorRgb={dotColorRgb} depth={0} onToggleComplete={handleToggleChildComplete} onEdit={onEdit} onDelete={onDelete} onToggleTask={onToggleTask} />
              </section>
            )}

            {/* ── Completion banner ── */}
            {event.completed && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                <p className="text-sm font-bold text-emerald-700">Sự kiện đã được hoàn thành</p>
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
