import { useMemo } from "react";
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
} from "lucide-react";
import {
  usePlantEvent,
  useEventProgress,
  useToggleTaskMutation,
  useUpdateEventProgressMutation,
  useGenerateEventProgressMutation,
} from "../..";
import { useMyPlants } from "../..";
import { useFarmZones } from "../../../farm-management/queries";
import type { PlantEventResponse, EventProgressResponse, PageResponse } from "../../shared/types";
import {
  EVENT_TYPE_LABELS,
  EVENT_CATEGORY_MAP,
  CATEGORY_DOT_COLORS,
} from "../../shared/components/displayUtils";

interface PlantEventProgressModalProps {
  event: PlantEventResponse;
  onClose: () => void;
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
  isToggling,
}: {
  entry: EventProgressResponse;
  label: string;
  index: number;
  onToggle: (progressId: string, completed: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
        entry.completed
          ? "border-emerald-100 bg-linear-to-r from-emerald-50 to-white shadow-sm"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      }`}
    >
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
        <p
          className={`text-sm font-semibold truncate leading-tight ${
            entry.completed ? "text-slate-400 line-through" : "text-slate-700"
          }`}
        >
          {label}
        </p>
        {entry.note && (
          <p className="mt-0.5 text-xs text-slate-400 truncate">{entry.note}</p>
        )}
      </div>

      {entry.targetType === "PLANT" ? (
        <Leaf className={`shrink-0 h-3.5 w-3.5 ${entry.completed ? "text-emerald-300" : "text-slate-300"}`} />
      ) : (
        <LayoutGrid className={`shrink-0 h-3.5 w-3.5 ${entry.completed ? "text-emerald-300" : "text-slate-300"}`} />
      )}
    </div>
  );
}

// ── PlantEventProgressModal ───────────────────────────────────────────────────

export function PlantEventProgressModal({
  event: initialEvent,
  onClose,
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
  const updateProgress = useUpdateEventProgressMutation();
  const generateProgress = useGenerateEventProgressMutation();

  const tasks = event.tasks ?? [];
  const taskDone = tasks.filter((t) => t.completed).length;
  const taskPct = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : 0;

  const progressTotal = event.progressTotal ?? progressEntries.length;
  const progressCompleted = event.progressCompleted ?? progressEntries.filter((e) => e.completed).length;
  const progressPct =
    progressTotal > 0 ? Math.round((progressCompleted / progressTotal) * 100) : 0;

  const handleToggleProgress = (progressId: string, completed: boolean) => {
    void updateProgress.mutateAsync({
      eventId: event.id,
      progressId,
      payload: { completed },
    });
  };

  const showSummaryCards = tasks.length > 0 || (hasFarmScope && progressTotal > 0);

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
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 -mt-0.5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
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
                {tasks.length > 0 && hasFarmScope && progressTotal > 0 && (
                  <div className="w-px bg-slate-200 shrink-0 rounded-full" />
                )}
                {hasFarmScope && progressTotal > 0 && (
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
            {tasks.length > 0 && hasFarmScope && (
              <div className="border-t border-dashed border-slate-100" />
            )}

            {/* ── Progress tracking section ── */}
            {hasFarmScope && (
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
                        isToggling={updateProgress.isPending}
                      />
                    ))}
                  </div>
                )}
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
