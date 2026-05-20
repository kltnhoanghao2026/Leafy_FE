import { useState } from "react";
import type {
  EventTaskRequest,
  PlantEventResponse,
  PlantEventType,
  PlantEventUpdateRequest,
} from "../../shared/types";
import { EVENT_TYPE_LABELS } from "../../shared/components/displayUtils";
import { compareDateOnly, isValidDateOnly } from "../../shared/utils/dateOnly";
import { Select } from "../../../../components/ui/Select";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { ImagePicker } from "../../../../components/ui/ImagePicker";
import { ModalShell } from "../../../../components/ui/ModalShell";
import { EventTaskEditor } from "./EventTaskEditor";
import { ALL_EVENT_TYPES } from "../schemas/eventConstants";

function parseOptionalNumber(value: string, label: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} phải là số không âm.`);
  }
  return parsed;
}

interface PlantEventEditDialogProps {
  event: PlantEventResponse;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: PlantEventUpdateRequest) => void;
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

  const [attachmentIds, setAttachmentIds] = useState<string[]>(event.attachmentIds ?? []);

  const [tasks, setTasks] = useState<EventTaskRequest[]>(
    (event.tasks ?? []).map((t) => ({
      title: t.title,
      description: t.description ?? undefined,
      estimatedCost: t.estimatedCost ?? undefined,
      order: t.order ?? undefined,
      completed: t.completed,
    })),
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const submit = () => {
    setValidationError(null);

    if (!form.eventType) {
      setValidationError("Vui lòng chọn loại sự kiện.");
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
      setValidationError(
        error instanceof Error ? error.message : "Trường số không hợp lệ.",
      );
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
      targetType: event.targetType ?? undefined,
      tasks: tasks.map((t, i) => ({ ...t, order: i })),
      attachmentIds,
    });
  };

  return (
    <ModalShell
      onClose={onClose}
      title="Chỉnh sửa lịch chăm sóc"
      subtitle={
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#245A34] mt-0.5">
          Plant event
        </p>
      }
      maxWidth="sm:max-w-2xl"
      zIndex="z-70"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
      }
    >
      <div className="px-6 py-5 space-y-5">
        {validationError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {validationError}
          </div>
        )}

        {/* Event type + Planned toggle */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Loại sự kiện
            </span>
            <Select
              className="mt-2"
              value={form.eventType}
              onChange={v => set('eventType', v as PlantEventType)}
              options={ALL_EVENT_TYPES.map(type => ({
                value: type,
                label: EVENT_TYPE_LABELS[type] ?? type,
              }))}
            />
          </div>
          <div className="flex items-center rounded-2xl bg-slate-50 px-4">
            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.planned}
                onChange={e => set('planned', e.target.checked)}
              />
              Đã lên lịch
            </label>
          </div>
        </div>

        {/* Note */}
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Tiêu đề/note
          </span>
          <input
            value={form.note}
            onChange={e => set('note', e.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
          />
        </div>

        {/* Description */}
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Mô tả
          </span>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Ngày bắt đầu
            </span>
            <DatePicker
              className="mt-2"
              value={form.calculatedStartDate}
              onChange={v => set('calculatedStartDate', v)}
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
              onChange={v => set('calculatedEndDate', v)}
              placeholder="Chọn ngày kết thúc..."
            />
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-sm font-black text-[#245A34]"
        >
          {showAdvanced ? "Ẩn thông tin an toàn/nâng cao" : "Thông tin an toàn/nâng cao"}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Số ngày kéo dài
              </span>
              <input
                value={form.durationDays}
                onChange={e => set('durationDays', e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                PHI days
              </span>
              <input
                value={form.phiDays}
                onChange={e => set('phiDays', e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div className="md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                PPE required
              </span>
              <input
                value={form.ppeRequired}
                onChange={e => set('ppeRequired', e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                MRL note
              </span>
              <input
                value={form.mrlNote}
                onChange={e => set('mrlNote', e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Chi phí dự kiến
              </span>
              <input
                value={form.estimatedCost}
                onChange={e => set('estimatedCost', e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div className="md:col-span-2">
              <ImagePicker
                label={`Tệp đính kèm (${attachmentIds.length})`}
                hint="Tải lên ảnh hoặc video cho sự kiện. Tối đa 8 tệp."
                value={attachmentIds}
                onChange={setAttachmentIds}
                max={8}
              />
            </div>
          </div>
        )}

        {/* Tasks */}
        <EventTaskEditor tasks={tasks} onChange={setTasks} />
      </div>
    </ModalShell>
  );
}
