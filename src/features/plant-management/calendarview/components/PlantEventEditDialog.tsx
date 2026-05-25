import { useState } from "react";
import {
  CalendarDays, ClipboardList, Clock, ShieldCheck, AlertTriangle,
  Sprout, MapPin, BookOpen, CheckSquare, ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";
import type {
  EventTaskRequest,
  PlantEventResponse,
  PlantEventType,
  PlantEventUpdateRequest,
} from "../../shared/types";
import { EVENT_TYPE_LABELS } from "../../shared/components/displayUtils";
import { compareDateOnly, isValidDateOnly, addLocalDays } from "../../shared/utils/dateOnly";
import { Select } from "../../../../components/ui/Select";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { ImagePicker } from "../../../../components/ui/ImagePicker";
import { ModalShell } from "../../../../components/ui/ModalShell";
import { EventTaskEditor } from "./EventTaskEditor";
import { ALL_EVENT_TYPES } from "../schemas/eventConstants";
import { useTranslation } from "../../../../i18n";

function parseOptionalNumber(value: string, label: string, t: ReturnType<typeof useTranslation>['t']) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(t('plantManagement.eventEdit.durationMustBePositive', { label }));
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
  const { t } = useTranslation();
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

  // Auto-derive durationDays when end date changes, or end date when duration changes.
  const handleStartDateChange = (v: string) => {
    set('calculatedStartDate', v);
    if (v && form.durationDays) {
      const dur = parseOptionalNumber(form.durationDays, t('plantManagement.eventEdit.durationLabel'), t);
      if (dur != null && dur > 0) {
        set('calculatedEndDate', addLocalDays(v, dur - 1));
      }
    }
  };

  const handleEndDateChange = (v: string) => {
    set('calculatedEndDate', v);
    if (v && form.calculatedStartDate && isValidDateOnly(form.calculatedStartDate) && isValidDateOnly(v)) {
      if (compareDateOnly(v, form.calculatedStartDate) >= 0) {
        const diff = Math.round(
          (new Date(v + 'T00:00:00').getTime() -
            new Date(form.calculatedStartDate + 'T00:00:00').getTime()) /
            (1000 * 60 * 60 * 24),
        );
        set('durationDays', String(diff + 1));
      }
    }
  };

  const handleDurationChange = (v: string) => {
    set('durationDays', v);
    if (v && form.calculatedStartDate && isValidDateOnly(form.calculatedStartDate)) {
      const dur = parseOptionalNumber(v, t('plantManagement.eventEdit.durationLabel'), t);
      if (dur != null && dur > 0) {
        set('calculatedEndDate', addLocalDays(form.calculatedStartDate, dur - 1));
      }
    }
  };

  const submit = () => {
    setValidationError(null);

    if (!form.eventType) {
      setValidationError(t('plantManagement.eventEdit.validationEventType'));
      return;
    }
    if (!form.note.trim()) {
      setValidationError(t('plantManagement.eventEdit.validationNote'));
      return;
    }
    if (form.calculatedStartDate && !isValidDateOnly(form.calculatedStartDate)) {
      setValidationError(t('plantManagement.eventEdit.validationStartDate'));
      return;
    }
    if (form.calculatedEndDate && !isValidDateOnly(form.calculatedEndDate)) {
      setValidationError(t('plantManagement.eventEdit.validationEndDate'));
      return;
    }
    if (
      form.calculatedStartDate &&
      form.calculatedEndDate &&
      compareDateOnly(form.calculatedEndDate, form.calculatedStartDate) < 0
    ) {
      setValidationError(t('plantManagement.eventEdit.validationDateRange'));
      return;
    }

    let phiDays: number | undefined;
    try {
      phiDays = parseOptionalNumber(form.phiDays, t('plantManagement.eventEdit.phiLabel'), t);
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : t('plantManagement.eventEdit.validationNumber'),
      );
      return;
    }

    onSubmit({
      eventType: form.eventType,
      note: form.note.trim(),
      description: form.description.trim() || undefined,
      calculatedStartDate: form.calculatedStartDate || undefined,
      calculatedEndDate: form.calculatedEndDate || undefined,
      durationDays: parseOptionalNumber(form.durationDays, t('plantManagement.eventEdit.durationLabel'), t),
      phiDays,
      ppeRequired: form.ppeRequired.trim() || undefined,
      mrlNote: form.mrlNote.trim() || undefined,
      estimatedCost: form.estimatedCost.trim() || undefined,
      isPlanned: form.planned,
      farmPlotId: event.farmPlotId ?? undefined,
      farmZoneId: event.farmZoneId ?? undefined,
      targetType: event.targetType ?? undefined,
      tasks: tasks.map((t, i) => ({ ...t, order: i })),
      attachmentIds,
    });
  };

  const directChildren = event.children ?? [];
  const hasChildren = directChildren.length > 0;
  const childDone = directChildren.filter(c => c.completed).length;
  const hasProgress = hasChildren;
  const progressPct = hasProgress
    ? Math.round((childDone / directChildren.length) * 100)
    : 0;

  return (
    <ModalShell
      onClose={onClose}
      icon={<CalendarDays className="h-5 w-5 text-[#245A34]" />}
      title={t('plantManagement.eventEdit.title')}
      subtitle={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
            {EVENT_TYPE_LABELS[form.eventType] ?? form.eventType}
          </span>
          {form.planned && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-blue-700">
              <CheckSquare className="h-2.5 w-2.5" />
              {t('plantManagement.calendar.plannedBadge')}
            </span>
          )}
          {event.completed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-black text-slate-500">
              {t('plantManagement.common.done')}
            </span>
          )}
        </div>
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
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:bg-slate-300"
          >
            {isSubmitting ? t('common.saving') : t('plantManagement.eventEdit.saveLabel')}
          </button>
        </div>
      }
    >
      <div className="px-6 py-5 space-y-6">

        {/* ── Error banner ─────────────────────────────────────── */}
        {validationError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm font-bold text-red-700">{validationError}</p>
          </div>
        )}

        {/* ── Scope info (read-only context) ─────────────────────── */}
        {(event.plant || event.farmPlot || event.farmZone || event.planApply) && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('plantManagement.filterModal.targetTypeSection')}</p>
            <div className="space-y-1.5">
              {event.plant && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Sprout className="h-3.5 w-3.5 text-[#245A34]" />
                  <span>{event.plant.nickName || event.plant.tagCode || event.plant.plantNumber || event.plant.id}</span>
                </div>
              )}
              {event.farmZone && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-[#245A34]" />
                  <span>
                    {event.farmZone.zoneName ?? event.farmZone.zoneCode ?? t('plantManagement.calendar.filterZone')}
                    {event.farmPlot && <span className="text-slate-400"> · {event.farmPlot.name ?? event.farmPlot.code}</span>}
                  </span>
                </div>
              )}
              {event.farmPlot && !event.farmZone && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-[#245A34]" />
                  <span>{event.farmPlot.name ?? event.farmPlot.code ?? t('plantManagement.calendar.filterFarm')}</span>
                </div>
              )}
              {event.planApply && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <BookOpen className="h-3.5 w-3.5 text-[#245A34]" />
                  <span>{event.planApply.planName ?? event.planApply.diseaseName ?? t('plantManagement.calendar.filterPlan')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Progress bar (for events with children) ─────────────────── */}
        {hasProgress && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('plantManagement.calendar.progressLabel')}</p>
              <p className="text-xs font-bold text-slate-600">
                {childDone} / {directChildren.length}
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#245A34] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] font-semibold text-slate-400 text-right">{progressPct}% {t('plantManagement.overview.tasksDone')}</p>
          </div>
        )}

        {/* ── Event type ────────────────────────────────────────── */}
        <div>
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <ClipboardList className="h-3.5 w-3.5" />
            {t('plantManagement.eventEdit.typeLabel')}
          </label>
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

        {/* ── Title / Note ─────────────────────────────────────── */}
        <div>
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <BookOpen className="h-3.5 w-3.5" />
            {t('plantManagement.eventEdit.noteLabel')} <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder={t('plantManagement.eventEdit.noteLabel')}
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-[#245A34] focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 transition-all"
          />
        </div>

        {/* ── Description ───────────────────────────────────────── */}
        <div>
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <BookOpen className="h-3.5 w-3.5" />
            {t('plantManagement.eventEdit.descriptionLabel')}
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder={t('plantManagement.eventEdit.descriptionLabel')}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-[#245A34] focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 transition-all resize-none"
          />
        </div>

        {/* ── Schedule ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {t('plantManagement.eventEdit.scheduledLabel')}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-500">{t('plantManagement.eventEdit.startDateLabel')}</label>
              <DatePicker
                className="mt-1.5"
                value={form.calculatedStartDate}
                onChange={handleStartDateChange}
                placeholder={t('plantManagement.eventEdit.startDatePlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t('plantManagement.eventEdit.endDateLabel')}</label>
              <DatePicker
                className="mt-1.5"
                value={form.calculatedEndDate}
                onChange={handleEndDateChange}
                placeholder={t('plantManagement.eventEdit.endDatePlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t('plantManagement.eventEdit.durationLabel')}</label>
              <div className="relative mt-1.5">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  value={form.durationDays}
                  onChange={e => handleDurationChange(e.target.value)}
                  placeholder="1"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-[#245A34] focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{t('plantManagement.calendar.durationUnit')}</span>
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 cursor-pointer h-12 px-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={form.planned}
                  onChange={e => set('planned', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#245A34] focus:ring-[#245A34]"
                />
                {t('plantManagement.eventEdit.scheduledLabel')}
              </label>
            </div>
          </div>
        </div>

        {/* ── Tasks ─────────────────────────────────────────────── */}
        <EventTaskEditor tasks={tasks} onChange={setTasks} />

        {/* ── Attachments ──────────────────────────────────────── */}
        {showAdvanced && (
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <ImageIcon className="h-3.5 w-3.5" />
              {t('plantManagement.eventEdit.tasksLabel')} ({attachmentIds.length})
            </label>
            <div className="mt-2">
              <ImagePicker
                label=""
                hint={t('common.required')}
                value={attachmentIds}
                onChange={setAttachmentIds}
                max={8}
              />
            </div>
          </div>
        )}

        {/* ── Advanced toggle ──────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-2 text-sm font-bold text-[#245A34] hover:text-[#1b432a] transition-colors"
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showAdvanced ? t('plantManagement.eventEdit.advancedToggleHide') : t('plantManagement.eventEdit.advancedToggleShow')}
        </button>

        {/* ── Advanced: Safety & Cost ──────────────────────────── */}
        {showAdvanced && (
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('plantManagement.eventEdit.ppeLabel')}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">{t('plantManagement.eventEdit.phiLabel')}</label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="0"
                    value={form.phiDays}
                    onChange={e => set('phiDays', e.target.value)}
                    placeholder="7"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-[#245A34] focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{t('plantManagement.calendar.durationUnit')}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">{t('plantManagement.eventEdit.costLabel')}</label>
                <input
                  value={form.estimatedCost}
                  onChange={e => set('estimatedCost', e.target.value)}
                  placeholder={t('plantManagement.eventEdit.costLabel')}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-[#245A34] focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500">{t('plantManagement.eventEdit.ppeLabel')}</label>
                <input
                  value={form.ppeRequired}
                  onChange={e => set('ppeRequired', e.target.value)}
                  placeholder={t('plantManagement.eventEdit.ppeLabel')}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-[#245A34] focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500">{t('plantManagement.eventEdit.mrlLabel')}</label>
                <input
                  value={form.mrlNote}
                  onChange={e => set('mrlNote', e.target.value)}
                  placeholder={t('plantManagement.eventEdit.mrlLabel')}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-[#245A34] focus:outline-none focus:ring-2 focus:ring-[#245A34]/20 transition-all"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </ModalShell>
  );
}
