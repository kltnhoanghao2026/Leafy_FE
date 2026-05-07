import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2, X } from "lucide-react";
import type {
  EventTaskRequest,
  PlantEventResponse,
  PlantEventType,
  PlantEventUpdateRequest,
} from '../../shared/types';
import { EVENT_TYPE_LABELS } from '../../shared/components/displayUtils';
import { compareDateOnly, isValidDateOnly } from '../../shared/utils/dateOnly';
import { Select } from '../../../../components/ui/Select';
import { DatePicker } from '../../../../components/ui/DatePicker';

interface PlantEventEditDialogProps {
  event: PlantEventResponse;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: PlantEventUpdateRequest) => void;
}

const EVENT_TYPES: PlantEventType[] = [
  "IRRIGATION",
  "NUTRITION",
  "WEED_CONTROL",
  "PRUNING",
  "SCOUTING",
  "DISEASE_DETECTED",
  "TREATMENT_APPLICATION",
  "QUARANTINE",
  "HEALTH_RECOVERY",
  "PHENOLOGY",
  "REPOT",
  "HARVEST",
];

function parseOptionalNumber(value: string, label: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} phải là số không âm.`);
  }
  return parsed;
}

export function PlantEventEditDialog({
  event,
  isSubmitting = false,
  onClose,
  onSubmit,
}: PlantEventEditDialogProps): React.ReactElement {
  const [form, setForm] = useState({
    eventType: event.eventType,
    note: event.note ?? "",
    description: event.description ?? "",
    calculatedStartDate: event.calculatedStartDate ?? "",
    calculatedEndDate: event.calculatedEndDate ?? "",
    durationDays: event.durationDays?.toString() ?? "",
    phiDays: event.phiDays?.toString() ?? "",
    ppeRequired: event.ppeRequired ?? "",
    mrlNote: event.mrlNote ?? "",
    estimatedCost: event.estimatedCost ?? "",
    planned: event.planned,
  });
  const [tasks, setTasks] = useState<EventTaskRequest[]>(
    (event.tasks ?? []).map(t => ({
      title: t.title,
      description: t.description ?? undefined,
      estimatedCost: t.estimatedCost ?? undefined,
      order: t.order ?? undefined,
      completed: t.completed,
    }))
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const submit = () => {
    setValidationError(null);

    if (!form.eventType) {
      setValidationError("Vui lòng chọn loại lịch chăm sóc.");
      return;
    }
    if (!form.note.trim()) {
      setValidationError("Vui lòng nhập tiêu đề/note cho lịch chăm sóc.");
      return;
    }
    if (form.calculatedStartDate && !isValidDateOnly(form.calculatedStartDate)) {
      setValidationError("Ngày bắt đầu không hợp lệ.");
      return;
    }
    if (form.calculatedEndDate && !isValidDateOnly(form.calculatedEndDate)) {
      setValidationError("Ngày kết thúc không hợp lệ.");
      return;
    }
    if (
      form.calculatedStartDate &&
      form.calculatedEndDate &&
      compareDateOnly(form.calculatedEndDate, form.calculatedStartDate) < 0
    ) {
      setValidationError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
      return;
    }

    let durationDays: number | undefined;
    let phiDays: number | undefined;
    try {
      durationDays = parseOptionalNumber(form.durationDays, "Số ngày kéo dài");
      phiDays = parseOptionalNumber(form.phiDays, "PHI days");
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Trường số không hợp lệ.");
      return;
    }

    onSubmit({
      eventType: form.eventType,
      note: form.note.trim(),
      description: form.description.trim() || undefined,
      calculatedStartDate: form.calculatedStartDate || undefined,
      calculatedEndDate: form.calculatedEndDate || undefined,
      durationDays,
      phiDays,
      ppeRequired: form.ppeRequired.trim() || undefined,
      mrlNote: form.mrlNote.trim() || undefined,
      estimatedCost: form.estimatedCost.trim() || undefined,
      isPlanned: form.planned,
      sourcePlanId: event.sourcePlanId ?? undefined,
      farmPlotId: event.farmPlotId ?? undefined,
      farmZoneId: event.farmZoneId ?? undefined,
      tasks: tasks.map((t, i) => ({ ...t, order: i })),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#245A34]">
              Plant event
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">
              Chỉnh sửa lịch chăm sóc
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Loại lịch
            </span>
            <Select
              className="mt-2"
              value={form.eventType}
              onChange={(v) =>
                setForm((current) => ({
                  ...current,
                  eventType: v as PlantEventType,
                }))
              }
              options={EVENT_TYPES.map((type) => ({
                value: type,
                label: EVENT_TYPE_LABELS[type] ?? type,
              }))}
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.planned}
              onChange={(eventChange) =>
                setForm((current) => ({
                  ...current,
                  planned: eventChange.target.checked,
                }))
              }
            />
            Đã lên lịch
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Tiêu đề/note
            </span>
            <input
              value={form.note}
              onChange={(eventChange) =>
                setForm((current) => ({ ...current, note: eventChange.target.value }))
              }
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Mô tả
            </span>
            <textarea
              value={form.description}
              onChange={(eventChange) =>
                setForm((current) => ({
                  ...current,
                  description: eventChange.target.value,
                }))
              }
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
            />
          </label>

          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Ngày bắt đầu
            </span>
            <DatePicker
              className="mt-2"
              value={form.calculatedStartDate}
              onChange={(v) =>
                setForm((current) => ({ ...current, calculatedStartDate: v }))
              }
              placeholder="Chọn ngày bắt đầu..."
            />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Ngày kết thúc
            </span>
            <DatePicker
              className="mt-2"
              value={form.calculatedEndDate}
              onChange={(v) =>
                setForm((current) => ({ ...current, calculatedEndDate: v }))
              }
              placeholder="Chọn ngày kết thúc..."
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="mt-5 text-sm font-black text-[#245A34]"
        >
          {showAdvanced ? "Ẩn thông tin an toàn/nâng cao" : "Thông tin an toàn/nâng cao"}
        </button>

        {showAdvanced ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Số ngày kéo dài
              </span>
              <input
                value={form.durationDays}
                onChange={(eventChange) =>
                  setForm((current) => ({
                    ...current,
                    durationDays: eventChange.target.value,
                  }))
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                PHI days
              </span>
              <input
                value={form.phiDays}
                onChange={(eventChange) =>
                  setForm((current) => ({
                    ...current,
                    phiDays: eventChange.target.value,
                  }))
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                PPE required
              </span>
              <input
                value={form.ppeRequired}
                onChange={(eventChange) =>
                  setForm((current) => ({
                    ...current,
                    ppeRequired: eventChange.target.value,
                  }))
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                MRL note
              </span>
              <input
                value={form.mrlNote}
                onChange={(eventChange) =>
                  setForm((current) => ({
                    ...current,
                    mrlNote: eventChange.target.value,
                  }))
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Chi phí dự kiến
              </span>
              <input
                value={form.estimatedCost}
                onChange={(eventChange) =>
                  setForm((current) => ({
                    ...current,
                    estimatedCost: eventChange.target.value,
                  }))
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </label>
          </div>
        ) : null}

        {/* Tasks section */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Công việc ({tasks.length})
            </span>
            <button
              type="button"
              onClick={() => setTasks(prev => [...prev, { title: '', completed: false }])}
              className="inline-flex items-center gap-1 rounded-xl border border-[#245A34] px-3 py-1.5 text-xs font-bold text-[#245A34] hover:bg-[#245A34]/5"
            >
              <Plus className="h-3 w-3" />
              Thêm
            </button>
          </div>

          {tasks.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">Chưa có công việc nào. Nhấn "Thêm" để bắt đầu.</p>
          )}

          <div className="mt-2 space-y-2">
            {tasks.map((task, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                {/* Completed toggle */}
                <button
                  type="button"
                  title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                  onClick={() => setTasks(prev => prev.map((t, i) => i === idx ? { ...t, completed: !t.completed } : t))}
                  className="mt-1 shrink-0 transition-colors hover:opacity-70"
                >
                  {task.completed
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <Circle className="h-4 w-4 text-slate-300" />}
                </button>
                <div className="flex-1 space-y-2">
                  <input
                    value={task.title}
                    onChange={(e) => setTasks(prev => prev.map((t, i) => i === idx ? { ...t, title: e.target.value } : t))}
                    placeholder="Tiêu đề công việc *"
                    className={`h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold placeholder:font-normal ${
                      task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                    }`}
                  />
                  <input
                    value={task.description ?? ''}
                    onChange={(e) => setTasks(prev => prev.map((t, i) => i === idx ? { ...t, description: e.target.value || undefined } : t))}
                    placeholder="Mô tả (tuỳ chọn)"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 placeholder:text-slate-400"
                  />
                  <input
                    value={task.estimatedCost ?? ''}
                    onChange={(e) => setTasks(prev => prev.map((t, i) => i === idx ? { ...t, estimatedCost: e.target.value || undefined } : t))}
                    placeholder="Chi phí dự kiến (tuỳ chọn)"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setTasks(prev => prev.filter((_, i) => i !== idx))}
                  className="mt-0.5 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  title="Xóa công việc"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {validationError ? (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {validationError}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:bg-slate-300"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
