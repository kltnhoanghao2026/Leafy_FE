import { useState, useEffect } from 'react';
import { Plus, Trash2, CalendarClock, ChevronDown, ChevronUp, Copy, List, LayoutGrid, ListChecks, CheckCircle2, Circle } from 'lucide-react';
import { EventCalendarEditor } from './EventCalendarEditor';
import { Select } from '../../../components/ui/Select';
import type { EventTaskRequest, PlantEventCreateRequest, PlantEventType } from '../../plant-management/shared/types';
import { EVENT_TYPE_LABELS } from '../../plant-management/shared/components/displayUtils';
import { Field, inputCls } from './FormField';

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = (Object.keys(EVENT_TYPE_LABELS) as PlantEventType[]).map((key) => ({
  value: key,
  label: EVENT_TYPE_LABELS[key],
}));

const EVENT_TYPE_COLORS: Partial<Record<PlantEventType, string>> = {
  IRRIGATION: 'bg-blue-50 text-blue-700',
  NUTRITION: 'bg-amber-50 text-amber-700',
  WEED_CONTROL: 'bg-orange-50 text-orange-700',
  PRUNING: 'bg-purple-50 text-purple-700',
  SCOUTING: 'bg-slate-100 text-slate-600',
  DISEASE_DETECTED: 'bg-red-50 text-red-700',
  TREATMENT_APPLICATION: 'bg-green-50 text-green-700',
  QUARANTINE: 'bg-rose-50 text-rose-700',
  HEALTH_RECOVERY: 'bg-emerald-50 text-emerald-700',
  PHENOLOGY: 'bg-teal-50 text-teal-700',
  REPOT: 'bg-violet-50 text-violet-700',
  HARVEST: 'bg-lime-50 text-lime-700',
};

// ── EventRow ──────────────────────────────────────────────────────────────────

type UpdateEventFn = (
  index: number,
  field: keyof PlantEventCreateRequest,
  value: string | number | boolean | undefined,
) => void;

interface EventRowProps {
  index: number;
  total: number;
  event: PlantEventCreateRequest;
  isExpanded: boolean;
  onToggleExpand: (index: number) => void;
  onChange: UpdateEventFn;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onUpdate: (index: number, evt: PlantEventCreateRequest) => void;
}

function EventRow({
  index,
  total,
  event,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onUpdate,
}: EventRowProps) {
  const typeBadgeCls =
    (event.eventType && EVENT_TYPE_COLORS[event.eventType as PlantEventType]) ||
    'bg-slate-100 text-slate-500';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* ── Compact header row ── */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* ↑↓ reorder buttons */}
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="flex h-5 w-5 items-center justify-center rounded text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-25"
            aria-label="Di chuyển lên"
          >
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            className="flex h-5 w-5 items-center justify-center rounded text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-25"
            aria-label="Di chuyển xuống"
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Index badge */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#245A34]/10 text-[10px] font-black text-[#245A34]">
          {index + 1}
        </span>

        {/* Summary — click to expand/collapse */}
        <button
          type="button"
          onClick={() => onToggleExpand(index)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {event.eventType ? (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${typeBadgeCls}`}>
              {EVENT_TYPE_LABELS[event.eventType as PlantEventType]}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">
              Chưa chọn loại
            </span>
          )}

          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-500">
            {event.note?.trim() || <span className="italic text-slate-300">Chưa có ghi chú</span>}
          </span>

          {/* Timing chips */}
          <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-slate-400">
            {event.daysFromStart != null && (
              <span className="rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-100">
                +{event.daysFromStart}d
              </span>
            )}
            {event.durationDays != null && (
              <span className="rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-100">
                {event.durationDays}d
              </span>
            )}
          </div>

          {isExpanded ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2.5} />
          ) : (
            <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2.5} />
          )}
        </button>

        {/* Duplicate */}
        <button
          type="button"
          onClick={() => onDuplicate(index)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Nhân bản sự kiện"
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Xoá sự kiện"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Expanded detail form ── */}
      {isExpanded && (
        <div className="grid gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2">
          <Field label="Loại sự kiện" required>
            <Select
              className="mt-2"
              value={event.eventType ?? ''}
              onChange={(v) => onChange(index, 'eventType', v as PlantEventType)}
              options={EVENT_TYPE_OPTIONS}
              placeholder="-- Chọn loại --"
            />
          </Field>

          <Field label="Ghi chú" required>
            <input
              className={inputCls}
              value={event.note ?? ''}
              onChange={(e) => onChange(index, 'note', e.target.value)}
              placeholder="VD: Phun thuốc gốc đồng..."
            />
          </Field>

          <Field label="Mô tả chi tiết (tuỳ chọn)" className="sm:col-span-2">
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={event.description ?? ''}
              onChange={(e) => onChange(index, 'description', e.target.value)}
              placeholder="Hướng dẫn thực hiện, liều lượng, lưu ý..."
            />
          </Field>

          <Field label="Bắt đầu sau (ngày)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={event.daysFromStart ?? ''}
              onChange={(e) =>
                onChange(
                  index,
                  'daysFromStart',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              placeholder="VD: 3"
            />
          </Field>

          <Field label="Thời lượng (ngày)">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={event.durationDays ?? ''}
              onChange={(e) =>
                onChange(
                  index,
                  'durationDays',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              placeholder="VD: 7"
            />
          </Field>

          <Field label="Chi phí ước tính (tuỳ chọn)" className="sm:col-span-2">
            <input
              className={inputCls}
              value={event.estimatedCost ?? ''}
              onChange={(e) => onChange(index, 'estimatedCost', e.target.value)}
              placeholder="VD: 200.000 VNĐ"
            />
          </Field>

          {/* ── Tasks sub-form ── */}
          <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5 text-[#245A34]" strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-wide text-slate-600">
                  Danh sách công việc
                </span>
                {(event.tasks ?? []).length > 0 && (
                  <span className="rounded-full bg-[#245A34]/10 px-1.5 py-0.5 text-[10px] font-black text-[#245A34]">
                    {(event.tasks ?? []).filter(t => t.completed).length}/{(event.tasks ?? []).length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const tasks: EventTaskRequest[] = [...(event.tasks ?? []), { title: '', completed: false }];
                  onUpdate(index, { ...event, tasks });
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-[#245A34] px-2.5 py-1 text-[10px] font-bold text-[#245A34] transition-colors hover:bg-[#245A34]/5"
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                Thêm công việc
              </button>
            </div>

            {(event.tasks ?? []).length === 0 ? (
              <div className="mt-2 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-4">
                <p className="text-[11px] font-medium text-slate-400">Chưa có công việc nào. Nhấn "Thêm công việc" để bắt đầu.</p>
              </div>
            ) : (
              <div className="mt-2 space-y-1.5">
                {(event.tasks ?? []).map((task, ti) => (
                  <div
                    key={ti}
                    className={`flex items-start gap-2 rounded-xl border bg-white p-2 transition-colors ${
                      task.completed ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100'
                    }`}
                  >
                    {/* Completed toggle */}
                    <button
                      type="button"
                      title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                      onClick={() => {
                        const tasks = (event.tasks ?? []).map((t, j) =>
                          j === ti ? { ...t, completed: !t.completed } : t,
                        );
                        onUpdate(index, { ...event, tasks });
                      }}
                      className="mt-1 shrink-0 transition-colors hover:opacity-70"
                    >
                      {task.completed
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <Circle className="h-4 w-4 text-slate-300" />}
                    </button>

                    {/* Fields */}
                    <div className="flex-1 space-y-1">
                      <input
                        value={task.title}
                        onChange={(e) => {
                          const tasks = (event.tasks ?? []).map((t, j) =>
                            j === ti ? { ...t, title: e.target.value } : t,
                          );
                          onUpdate(index, { ...event, tasks });
                        }}
                        placeholder="Tiêu đề công việc *"
                        className={`${inputCls} py-1.5 text-[11px] ${
                          task.completed ? 'text-slate-400 line-through' : ''
                        }`}
                      />
                      <input
                        value={task.description ?? ''}
                        onChange={(e) => {
                          const tasks = (event.tasks ?? []).map((t, j) =>
                            j === ti ? { ...t, description: e.target.value || undefined } : t,
                          );
                          onUpdate(index, { ...event, tasks });
                        }}
                        placeholder="Mô tả (tuỳ chọn)"
                        className={`${inputCls} py-1.5 text-[11px]`}
                      />
                      <input
                        value={task.estimatedCost ?? ''}
                        onChange={(e) => {
                          const tasks = (event.tasks ?? []).map((t, j) =>
                            j === ti ? { ...t, estimatedCost: e.target.value || undefined } : t,
                          );
                          onUpdate(index, { ...event, tasks });
                        }}
                        placeholder="Chi phí ước tính (tuỳ chọn)"
                        className={`${inputCls} py-1.5 text-[11px]`}
                      />
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        const tasks = (event.tasks ?? []).filter((_, j) => j !== ti);
                        onUpdate(index, { ...event, tasks });
                      }}
                      className="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      title="Xóa công việc"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── EventScheduleSection ──────────────────────────────────────────────────────

interface EventScheduleSectionProps {
  events: PlantEventCreateRequest[];
  onAdd: () => void;
  onChange: UpdateEventFn;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onAddWithData: (evt: PlantEventCreateRequest) => void;
  onUpdate: (index: number, evt: PlantEventCreateRequest) => void;
}

export function EventScheduleSection({
  events,
  onAdd,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
  onAddWithData,
  onUpdate,
}: EventScheduleSectionProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  // Expansion state lives here so add/remove/move can keep it in sync
  const [expandedList, setExpandedList] = useState<boolean[]>([]);

  // Keep expandedList in sync when events are mutated from calendar mode
  useEffect(() => {
    setExpandedList((prev) => {
      if (prev.length === events.length) return prev;
      return Array.from({ length: events.length }, (_, i) => prev[i] ?? false);
    });
  }, [events.length]);

  const handleAdd = () => {
    onAdd();
    setExpandedList((prev) => [...prev, true]); // new event auto-expands
  };

  const handleRemove = (index: number) => {
    onRemove(index);
    setExpandedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicate = (index: number) => {
    onDuplicate(index);
    setExpandedList((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, false); // duplicate starts collapsed
      return next;
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    onMove(index, index - 1);
    setExpandedList((prev) => {
      const next = [...prev];
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === events.length - 1) return;
    onMove(index, index + 1);
    setExpandedList((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const toggleExpanded = (index: number) => {
    setExpandedList((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <section className={viewMode === 'calendar' ? 'flex h-full min-h-0 flex-col gap-3' : 'flex flex-col gap-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm'}>
      <div className={`flex flex-wrap items-center justify-between gap-2 ${viewMode === 'list' ? 'mb-4' : ''}`}>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#245A34]" strokeWidth={2.5} />
          <p className="text-sm font-black text-slate-900">Lịch trình sự kiện</p>
          {events.length > 0 && (
            <span className="rounded-full bg-[#245A34]/10 px-2 py-0.5 text-[11px] font-black text-[#245A34]">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-xl bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#245A34] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-3.5 w-3.5" strokeWidth={2.5} />
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#245A34] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2.5} />
              Lịch
            </button>
          </div>
          {viewMode === 'list' && (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-xl border border-[#245A34] px-3 py-1.5 text-xs font-bold text-[#245A34] transition-colors hover:bg-[#245A34]/5"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Thêm sự kiện
            </button>
          )}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <EventCalendarEditor
          events={events}
          onAddWithData={onAddWithData}
          onUpdate={onUpdate}
          onRemove={handleRemove}
        />
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <CalendarClock className="mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-slate-500">Chưa có sự kiện nào trong lịch trình.</p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Nhấn "Thêm sự kiện" để tạo lịch tưới nước, bón phân, phun thuốc...
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((evt, i) => (
            <EventRow
              key={i}
              index={i}
              total={events.length}
              event={evt}
              isExpanded={expandedList[i] ?? false}
              onToggleExpand={toggleExpanded}
              onChange={onChange}
              onRemove={handleRemove}
              onDuplicate={handleDuplicate}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </section>
  );
}
