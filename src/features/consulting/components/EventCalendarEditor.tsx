import { useState, useMemo, useCallback, useRef } from 'react';
import { Plus, X, Check, GripVertical, ListChecks, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { CalendarViewPanel } from '../../plant-management/calendarview/components/CalendarViewPanel';
import { GroupedEventList } from '../../plant-management/calendarview/components/GroupedEventList';
import {
  toLocalDateOnly,
  addLocalDays,
  daysBetweenDateOnly,
} from '../../plant-management/shared/utils/dateOnly';
import { EVENT_TYPE_LABELS } from '../../plant-management/shared/components/displayUtils';
import { Select } from '../../../components/ui/Select';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Field, inputCls, errorInputCls, FieldError } from './FormField';
import type { CalendarViewPanelProps } from '../../plant-management/calendarview/components/CalendarViewPanel';
import type {
  EventTaskRequest,
  PlantEventCreateRequest,
  PlantEventResponse,
  PlantEventType,
} from '../../plant-management/shared/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = (Object.keys(EVENT_TYPE_LABELS) as PlantEventType[]).map((key) => ({
  value: key,
  label: EVENT_TYPE_LABELS[key],
}));

// ── Types ─────────────────────────────────────────────────────────────────────

interface DraftFormState {
  eventType: PlantEventType | '';
  note: string;
  description: string;
  startDateStr: string;
  durationDays: string;
  estimatedCost: string;
  tasks: EventTaskRequest[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayDate = new Date();
const today = toLocalDateOnly(todayDate);

function makeEmptyForm(date?: string): DraftFormState {
  return {
    eventType: '',
    note: '',
    description: '',
    startDateStr: date ?? today,
    durationDays: '',
    estimatedCost: '',
    tasks: [],
  };
}

function toCalendarEvent(evt: PlantEventCreateRequest, idx: number): PlantEventResponse {
  const startDate =
    evt.daysFromStart != null ? addLocalDays(todayDate, evt.daysFromStart) : today;
  const endDate =
    evt.durationDays != null && evt.durationDays > 0
      ? addLocalDays(startDate, evt.durationDays - 1)
      : startDate;

  return {
    id: `ce-${idx}`,
    plantId: '',
    farmPlotId: null,
    farmZoneId: null,
    eventType: evt.eventType,
    note: evt.note ?? null,
    description: evt.description ?? null,
    daysFromStart: evt.daysFromStart ?? null,
    durationDays: evt.durationDays ?? null,
    planned: true,
    calculatedStartDate: startDate,
    calculatedEndDate: endDate,
    phiDays: null,
    ppeRequired: null,
    mrlNote: null,
    estimatedCost: evt.estimatedCost ?? null,
    sourcePlanId: null,
    tasks: evt.tasks ?? null,
    createdAt: null,
    lastModifiedAt: null,
    createdBy: null,
    lastModifiedBy: null,
    active: true,
  };
}

function draftToForm(evt: PlantEventCreateRequest): DraftFormState {
  const startDate =
    evt.daysFromStart != null ? addLocalDays(todayDate, evt.daysFromStart) : today;
  return {
    eventType: (evt.eventType as PlantEventType) ?? '',
    note: evt.note ?? '',
    description: evt.description ?? '',
    startDateStr: startDate,
    durationDays: evt.durationDays != null ? String(evt.durationDays) : '',
    estimatedCost: evt.estimatedCost ?? '',
    tasks: (evt.tasks ?? []).map(t => ({
      title: t.title,
      description: t.description ?? undefined,
      estimatedCost: t.estimatedCost ?? undefined,
      completed: t.completed ?? false,
      order: t.order ?? undefined,
    })),
  };
}

function formToRequest(f: DraftFormState): PlantEventCreateRequest {
  const daysFromStart = daysBetweenDateOnly(today, f.startDateStr);
  return {
    eventType: f.eventType as PlantEventType,
    note: f.note,
    description: f.description.trim() || undefined,
    daysFromStart,
    durationDays: f.durationDays !== '' ? Number(f.durationDays) : undefined,
    estimatedCost: f.estimatedCost.trim() || undefined,
    tasks: f.tasks.length > 0
      ? f.tasks.map((t, i) => ({ ...t, order: i }))
      : undefined,
  };
}

// ── Validation ─────────────────────────────────────────────────────────────

interface FormErrors {
  eventType?: string;
  note?: string;
  startDateStr?: string;
  durationDays?: string;
}

function validate(f: DraftFormState): FormErrors {
  const errors: FormErrors = {};
  if (!f.eventType) errors.eventType = 'Vui lòng chọn loại sự kiện.';
  if (!f.note.trim()) errors.note = 'Ghi chú không được để trống.';
  if (!f.startDateStr) errors.startDateStr = 'Vui lòng chọn ngày bắt đầu.';
  if (f.durationDays !== '' && Number(f.durationDays) < 1)
    errors.durationDays = 'Thời lượng phải ít nhất 1 ngày.';
  return errors;
}

// ── AddEditForm ─────────────────────────────────────────────────────────────

interface AddEditFormProps {
  form: DraftFormState;
  onChange: (field: keyof DraftFormState, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function AddEditForm({ form, onChange, onSave, onCancel }: AddEditFormProps) {
  const [touched, setTouched] = useState<Partial<Record<keyof DraftFormState, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = validate(form);
  const show = (field: keyof FormErrors) =>
    (submitAttempted || touched[field]) ? errors[field] : undefined;

  const handleBlur = (field: keyof DraftFormState) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSave = () => {
    setSubmitAttempted(true);
    if (Object.keys(validate(form)).length > 0) return;
    onSave();
  };

  // tasks: derived from form.tasks (array stored directly)
  const tasks = form.tasks;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
      <Field label="Loại sự kiện" required>
        <Select
          className={`mt-1 ${show('eventType') ? 'ring-2 ring-red-200 rounded-xl border-red-400' : ''}`}
          value={form.eventType}
          onChange={(v) => { onChange('eventType', v); setTouched((p) => ({ ...p, eventType: true })); }}
          options={EVENT_TYPE_OPTIONS}
          placeholder="-- Chọn loại --"
        />
        <FieldError msg={show('eventType')} />
      </Field>

      <Field label="Ghi chú" required>
        <input
          className={show('note') ? errorInputCls : inputCls}
          value={form.note}
          onChange={(e) => onChange('note', e.target.value)}
          onBlur={() => handleBlur('note')}
          placeholder="VD: Phún thuốc gốc đồng..."
        />
        <FieldError msg={show('note')} />
      </Field>

      <Field label="Mô tả (tuỳ chọn)">
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Hướng dẫn chi tiết..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ngày bắt đầu">
          <DatePicker
            value={form.startDateStr}
            minDate={new Date().toISOString().slice(0, 10)}
            onChange={(val) => { onChange('startDateStr', val); handleBlur('startDateStr'); }}
            className={show('startDateStr') ? 'ring-1 ring-red-400 rounded-2xl' : ''}
          />
          <FieldError msg={show('startDateStr')} />
        </Field>
        <Field label="Thời lượng (ngày)">
          <input
            type="number"
            min={1}
            className={show('durationDays') ? errorInputCls : inputCls}
            value={form.durationDays}
            onChange={(e) => onChange('durationDays', e.target.value)}
            onBlur={() => handleBlur('durationDays')}
            placeholder="VD: 7"
          />
          <FieldError msg={show('durationDays')} />
        </Field>
      </div>

      <Field label="Chi phí ước tính (tuỳ chọn)">
        <input
          className={inputCls}
          value={form.estimatedCost}
          onChange={(e) => onChange('estimatedCost', e.target.value)}
          placeholder="VD: 200.000 VNĐ"
        />
      </Field>

      {/* ── Task list ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-[#245A34]" strokeWidth={2.5} />
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-600">
              Danh sách công việc
            </span>
            {tasks.length > 0 && (
              <span className="rounded-full bg-[#245A34]/10 px-1.5 py-0.5 text-[10px] font-black text-[#245A34]">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange('tasks' as keyof DraftFormState, JSON.stringify([...tasks, { title: '', completed: false }]))}
            className="inline-flex items-center gap-1 rounded-xl border border-[#245A34] px-2.5 py-1 text-[10px] font-bold text-[#245A34] transition-colors hover:bg-[#245A34]/5"
          >
            <Plus className="h-3 w-3" strokeWidth={2.5} />
            Thêm công việc
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-2 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-3">
            <p className="text-[11px] font-medium text-slate-400">Chưa có công việc. Nhấn "Thêm công việc" để bắt đầu.</p>
          </div>
        ) : (
          <div className="mt-2 space-y-1.5">
            {tasks.map((task, ti) => (
              <div
                key={ti}
                className={`flex items-start gap-2 rounded-xl border bg-white p-2 transition-colors ${
                  task.completed ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100'
                }`}
              >
                {/* Completed toggle */}
                <button
                  type="button"
                  title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                  onClick={() => {
                    const next = tasks.map((t, j) => j === ti ? { ...t, completed: !t.completed } : t);
                    onChange('tasks' as keyof DraftFormState, JSON.stringify(next));
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
                      const next = tasks.map((t, j) => j === ti ? { ...t, title: e.target.value } : t);
                      onChange('tasks' as keyof DraftFormState, JSON.stringify(next));
                    }}
                    placeholder="Tiêu đề công việc *"
                    className={`${inputCls} py-1.5 text-[11px] ${
                      task.completed ? 'text-slate-400 line-through' : ''
                    }`}
                  />
                  <input
                    value={task.description ?? ''}
                    onChange={(e) => {
                      const next = tasks.map((t, j) => j === ti ? { ...t, description: e.target.value || undefined } : t);
                      onChange('tasks' as keyof DraftFormState, JSON.stringify(next));
                    }}
                    placeholder="Mô tả (tuỳ chọn)"
                    className={`${inputCls} py-1.5 text-[11px]`}
                  />
                  <input
                    value={task.estimatedCost ?? ''}
                    onChange={(e) => {
                      const next = tasks.map((t, j) => j === ti ? { ...t, estimatedCost: e.target.value || undefined } : t);
                      onChange('tasks' as keyof DraftFormState, JSON.stringify(next));
                    }}
                    placeholder="Chi phí ước tính (tuỳ chọn)"
                    className={`${inputCls} py-1.5 text-[11px]`}
                  />
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => {
                    const next = tasks.filter((_, j) => j !== ti);
                    onChange('tasks' as keyof DraftFormState, JSON.stringify(next));
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

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#245A34] py-2 text-xs font-bold text-white transition-colors hover:bg-[#1a4226]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Lưu
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          Huỷ
        </button>
      </div>
    </div>
  );
}

// ── EventDatePanel ─────────────────────────────────────────────────────────────

interface EventDatePanelProps {
  selectedDate: string | null;
  eventsForDate: PlantEventResponse[];
  allEvents: PlantEventCreateRequest[];
  onAddWithData: (evt: PlantEventCreateRequest) => void;
  onUpdate: (index: number, evt: PlantEventCreateRequest) => void;
  onRemove: (index: number) => void;
}

function EventDatePanel({
  selectedDate,
  eventsForDate,
  allEvents,
  onAddWithData,
  onUpdate,
  onRemove,
}: EventDatePanelProps) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [form, setForm] = useState<DraftFormState>(() => makeEmptyForm(selectedDate ?? undefined));

  const handleFormChange = useCallback((field: keyof DraftFormState, value: string) => {
    if (field === 'tasks') {
      try {
        const parsed = JSON.parse(value) as EventTaskRequest[];
        setForm((prev) => ({ ...prev, tasks: parsed }));
      } catch { /* ignore */ }
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleAdd = () => {
    setForm(makeEmptyForm(selectedDate ?? undefined));
    setMode('add');
  };

  const handleEdit = (evt: PlantEventResponse) => {
    if (!evt.id.startsWith('ce-')) return;
    const idx = Number(evt.id.slice(3));
    const original = allEvents[idx];
    if (!original) return;
    setEditingIdx(idx);
    setForm(draftToForm(original));
    setMode('edit');
  };

  const handleSaveAdd = () => {
    onAddWithData(formToRequest(form));
    setMode('list');
  };

  const handleSaveEdit = () => {
    if (editingIdx == null) return;
    onUpdate(editingIdx, formToRequest(form));
    setMode('list');
    setEditingIdx(null);
  };

  const handleCancel = () => {
    setMode('list');
    setEditingIdx(null);
  };

  if (!selectedDate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
        <p className="text-xs font-semibold text-slate-400">
          Chọn một ngày để xem và thêm sự kiện
        </p>
      </div>
    );
  }

  const addButton = mode === 'list' ? (
    <button
      type="button"
      onClick={handleAdd}
      className="flex items-center gap-1 rounded-lg bg-[#245A34]/10 px-2.5 py-1 text-xs font-bold text-[#245A34] transition-colors hover:bg-[#245A34]/20"
    >
      <Plus className="h-3 w-3" strokeWidth={2.5} />
      Thêm
    </button>
  ) : null;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {/* Add / Edit form */}
      {(mode === 'add' || mode === 'edit') && (
        <AddEditForm
          form={form}
          onChange={handleFormChange}
          onSave={mode === 'add' ? handleSaveAdd : handleSaveEdit}
          onCancel={handleCancel}
        />
      )}

      {/* Grouped event list */}
      {mode === 'list' && (
        <GroupedEventList
          events={eventsForDate}
          onEdit={handleEdit}
          onDelete={(evt) => {
            if (!evt.id.startsWith('ce-')) return;
            onRemove(Number(evt.id.slice(3)));
          }}
          headerAction={addButton}
          emptyNode={
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs font-semibold text-slate-400">
              Không có sự kiện nào vào ngày này.
            </p>
          }
        />
      )}
    </div>
  );
}

// ── EventCalendarEditor ───────────────────────────────────────────────────────

export interface EventCalendarEditorProps {
  events: PlantEventCreateRequest[];
  onAddWithData: (evt: PlantEventCreateRequest) => void;
  onUpdate: (index: number, evt: PlantEventCreateRequest) => void;
  onRemove: (index: number) => void;
}

export function EventCalendarEditor({
  events,
  onAddWithData,
  onUpdate,
  onRemove,
}: EventCalendarEditorProps) {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  // ── Splitter ────────────────────────────────────────────────────────────────
  const [leftPct, setLeftPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(Math.max(pct, 28), 75));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const previewEvents = useMemo(() => events.map(toCalendarEvent), [events]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PlantEventResponse[]>();
    for (const evt of previewEvents) {
      const start = evt.calculatedStartDate;
      const end = evt.calculatedEndDate ?? start;
      if (!start) continue;
      const startD = new Date(start + 'T00:00:00');
      const endD = new Date((end ?? start) + 'T00:00:00');
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = toLocalDateOnly(d);
        if (!map.has(key)) map.set(key, []);
        const list = map.get(key)!;
        if (!list.some((e) => e.id === evt.id)) list.push(evt);
      }
    }
    return map;
  }, [previewEvents]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return previewEvents.filter((evt) => {
      const start = evt.calculatedStartDate;
      if (!start) return false;
      const end = evt.calculatedEndDate ?? start;
      return selectedDate >= start && selectedDate <= end;
    });
  }, [previewEvents, selectedDate]);

  const stubQuery = useMemo(
    () => ({ isLoading: false, isError: false, refetch: () => undefined }),
    [],
  );

  const calendarProps: CalendarViewPanelProps = {
    calendarQuery: stubQuery,
    activeView: 'month',
    events: previewEvents,
    currentMonth,
    onPrevMonth: () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)),
    onNextMonth: () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)),
    weekDays: [],
    eventsByDate,
    onPrevWeek: () => {},
    onNextWeek: () => {},
    onThisWeek: () => {},
    isCurrentWeek: false,
    weekLabel: '',
    tlMonth: currentMonth,
    onPrevTlMonth: () => {},
    onNextTlMonth: () => {},
    selectedDate,
    onSelectDate: setSelectedDate,
    hoveredDateRange: null,
  };

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-row gap-0">
      {/* Calendar panel */}
      <div className="shrink-0 h-full overflow-hidden" style={{ width: `${leftPct}%` }}>
        <CalendarViewPanel {...calendarProps} />
      </div>

      {/* Drag splitter */}
      <div
        onMouseDown={onSplitterMouseDown}
        className="group relative flex w-3 shrink-0 cursor-col-resize items-center justify-center"
      >
        <div className="h-full w-px bg-slate-200 transition-colors group-hover:bg-emerald-400" />
        <div className="absolute flex h-8 w-5 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-emerald-300 group-hover:bg-emerald-50">
          <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500" />
        </div>
      </div>

      {/* Event date panel */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <EventDatePanel
          key={selectedDate ?? 'none'}
          selectedDate={selectedDate}
          eventsForDate={selectedDateEvents}
          allEvents={events}
          onAddWithData={onAddWithData}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
