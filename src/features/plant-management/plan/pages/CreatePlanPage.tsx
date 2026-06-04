import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ClipboardList, CalendarClock, Eye } from 'lucide-react';
import type { AxiosError } from 'axios';
import { PlanPreviewCalendar } from '../../../consulting/components/PlanPreviewCalendar';
import { ROUTES } from '../../../../lib/routes';
import { useCreatePlan } from '../queries/plan.queries';
import { useFarmPlots } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import type { PlanCreateRequest, PlantEventCreateRequest } from '../../shared/types';
import { PlanInfoSection, emptyForm, type PlanFormStateCreate } from '../components/PlanInfoSection';
import type { PlanInfoErrors } from '../components/PlanInfoSection';
import { emptyEvent } from '../../../consulting/utils/planFormHelpers';
import { EventScheduleSection, type EventFieldErrors } from '../../../consulting/components/EventScheduleSection';
import type { ApiEnvelope } from '../../../../shared/types/api';

const DRAFT_KEY = 'plan_create_draft';

export function CreatePlanPage() {
  const navigate = useNavigate();
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? '';
  const { data: farmPlots } = useFarmPlots(ownerProfileId, !!ownerProfileId);

  const location = useLocation();

  const [form, setForm] = useState<PlanFormStateCreate>(() => {
    if (location.state?.draft?.form) {
      // Merge with emptyForm() so any fields absent from the AI draft (e.g.
      // planName, urgency) are always initialized to a safe default.
      return { ...emptyForm(), ...location.state.draft.form };
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return { ...emptyForm(), ...((JSON.parse(raw) as { form: PlanFormStateCreate; events: PlantEventCreateRequest[] }).form ?? {}) };
    } catch { /* ignore */ }
    return emptyForm();
  });

  const [events, setEvents] = useState<PlantEventCreateRequest[]>(() => {
    if (location.state?.draft?.events) return location.state.draft.events;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return (JSON.parse(raw) as { form: PlanFormStateCreate; events: PlantEventCreateRequest[] }).events ?? [];
    } catch { /* ignore */ }
    return [];
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [planErrors, setPlanErrors] = useState<PlanInfoErrors>({});
  const [eventErrors, setEventErrors] = useState<EventFieldErrors[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'events' | 'preview'>('info');

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, events }));
    } catch { /* ignore quota errors */ }
  }, [form, events]);

  const { mutateAsync, isPending } = useCreatePlan();

  const farmPlotOptions = useMemo(
    () => [
      { value: '', label: '-- Tất cả trang trại --' },
      ...(farmPlots ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [farmPlots],
  );

  const updateForm = (field: keyof PlanFormStateCreate, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setPlanErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addEvent = () => setEvents((prev) => [...prev, emptyEvent()]);
  const addEventWithData = (evt: PlantEventCreateRequest) => setEvents((prev) => [...prev, evt]);
  const updateEventFull = (index: number, evt: PlantEventCreateRequest) =>
    setEvents((prev) => prev.map((e, i) => (i === index ? evt : e)));
  const removeEvent = (index: number) => setEvents((prev) => prev.filter((_, i) => i !== index));
  const duplicateEvent = (index: number) =>
    setEvents((prev) => {
      const copy = { ...prev[index] };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  const moveEvent = (from: number, to: number) =>
    setEvents((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  const updateEvent = (
    index: number,
    field: keyof PlantEventCreateRequest,
    value: string | number | boolean | undefined,
  ) => setEvents((prev) => prev.map((evt, i) => (i === index ? { ...evt, [field]: value } : evt)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const pErr: PlanInfoErrors = {};
    if (!form.diseaseName.trim()) pErr.diseaseName = 'Vui lòng nhập tên bệnh / vấn đề.';
    if (Object.keys(pErr).length > 0) {
      setPlanErrors(pErr);
      setActiveTab('info');
      return;
    }
    setPlanErrors({});

    const newEventErrors: EventFieldErrors[] = events.map(() => ({}));
    let hasEventError = false;

    for (const [i, evt] of events.entries()) {
      if (!evt.eventType) {
        newEventErrors[i].eventType = 'Vui lòng chọn loại sự kiện.';
        hasEventError = true;
      }
      if (!evt.note?.trim()) {
        newEventErrors[i].note = 'Vui lòng nhập ghi chú.';
        hasEventError = true;
      }
      if (evt.daysFromStart !== undefined && evt.daysFromStart < 0) {
        newEventErrors[i].daysFromStart = 'Phải bằng hoặc lớn hơn 0.';
        hasEventError = true;
      }
      if (evt.durationDays !== undefined && evt.durationDays < 0) {
        newEventErrors[i].durationDays = 'Phải bằng hoặc lớn hơn 0.';
        hasEventError = true;
      }
      if (evt.tasks && evt.tasks.length > 0) {
        newEventErrors[i].tasks = {};
        for (const [ti, task] of evt.tasks.entries()) {
          if (!task.title?.trim()) {
            newEventErrors[i].tasks![ti] = { title: 'Tiêu đề công việc là bắt buộc.' };
            hasEventError = true;
          }
        }
      }
    }

    if (hasEventError) {
      setEventErrors(newEventErrors);
      setActiveTab('events');
      return;
    }
    setEventErrors([]);

    const cleanedEvents: PlantEventCreateRequest[] = events.map((evt) => ({
      eventType: evt.eventType,
      note: evt.note,
      description: evt.description?.trim() || undefined,
      daysFromStart: evt.daysFromStart,
      durationDays: evt.durationDays,
      estimatedCost: evt.estimatedCost?.trim() || undefined,
      phiDays: evt.phiDays,
      ppeRequired: evt.ppeRequired?.trim() || undefined,
      mrlNote: evt.mrlNote?.trim() || undefined,
      isPlanned: true,
      tasks: evt.tasks && evt.tasks.length > 0
        ? evt.tasks.map((t, i) => ({
            title: t.title,
            description: t.description || undefined,
            estimatedCost: t.estimatedCost || undefined,
            completed: t.completed ?? false,
            order: i,
          }))
        : undefined,
    }));

    const payload: PlanCreateRequest = {
      diseaseName: form.diseaseName.trim(),
      planName: form.planName?.trim() || undefined,
      farmPlotId: form.farmPlotId || undefined,
      speciesId: form.speciesId || undefined,
      source: 'documents',
      severityLevel: form.severityLevel || undefined,
      requiredInputs: form.requiredInputs?.trim() ? [form.requiredInputs.trim()] : undefined,
      safetyWarnings: form.safetyWarnings?.trim() ? [form.safetyWarnings.trim()] : undefined,
      successIndicators: form.successIndicators?.trim() || undefined,
      estimatedCost: form.estimatedCost?.trim() || undefined,
      isPublic: form.isPublic,
      schedule: cleanedEvents.length > 0 ? cleanedEvents : undefined,
    };

    try {
      const created = await mutateAsync(payload);
      localStorage.removeItem(DRAFT_KEY);
      const planId = created?.id;
      if (planId) {
        navigate(ROUTES.DASHBOARD.PLAN_DETAIL(planId));
      } else {
        console.warn('[CreatePlanPage] Created plan has no id:', created);
        navigate(ROUTES.DASHBOARD.PLANS);
      }
    } catch (err) {
      console.error('[CreatePlanPage] handleSubmit error:', err);
      const beErrors = parseBackendErrors(err);
      if (!applyBackendErrors(beErrors)) {
        setSubmitError('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.');
      }
    }
  };

  function parseBackendErrors(err: unknown): Record<string, string> | null {
    if (!err || typeof err !== 'object') return null;
    const e = err as Partial<AxiosError<ApiEnvelope<null>>>;
    const data = e.response?.data;
    if (!data || typeof data !== 'object') return null;
    if ('errors' in data && data.errors && typeof data.errors === 'object') {
      return data.errors as Record<string, string>;
    }
    return null;
  }

  function applyBackendErrors(beErrors: Record<string, string> | null): boolean {
    if (!beErrors) return false;

    const planErrors: PlanInfoErrors = {};
    const newEventErrors: EventFieldErrors[] = events.map(() => ({}));

    for (const [fieldPath, message] of Object.entries(beErrors)) {
      if (fieldPath === 'diseaseName') {
        planErrors.diseaseName = message;
        continue;
      }
      const scheduleMatch = fieldPath.match(/^schedule\[(\d+)\](?:\.tasks\[(\d+)\])?\.(.+)$/);
      if (scheduleMatch) {
        const [, eventIdxStr, taskIdxStr, field] = scheduleMatch;
        const eventIdx = parseInt(eventIdxStr, 10);
        if (isNaN(eventIdx) || eventIdx >= newEventErrors.length) continue;
        if (taskIdxStr !== undefined) {
          const taskIdx = parseInt(taskIdxStr, 10);
          if (isNaN(taskIdx)) continue;
          newEventErrors[eventIdx] ??= {};
          newEventErrors[eventIdx].tasks ??= {};
          newEventErrors[eventIdx].tasks![taskIdx] ??= {};
          (newEventErrors[eventIdx].tasks![taskIdx] as Record<string, string>)[field] = message;
        } else {
          (newEventErrors[eventIdx] as Record<string, string>)[field] = message;
        }
        continue;
      }
      (planErrors as Record<string, string>)[fieldPath] = message;
    }

    const hasEventErrors = newEventErrors.some(
      (e) => Object.keys(e).length > 0 || (e.tasks && Object.keys(e.tasks).length > 0),
    );

    setPlanErrors(planErrors);
    setEventErrors(newEventErrors);
    if (hasEventErrors) setActiveTab('events');
    else setActiveTab('info');

    return true;
  }

  return (
    <div className="flex h-full flex-col gap-4 min-h-0 w-full overflow-hidden">
      {/* Back nav + title */}
      <div className="shrink-0 flex items-center gap-3">
        <Link
          to={ROUTES.DASHBOARD.PLANS}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#245A34] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Quay lại
        </Link>
        <span className="text-slate-200">/</span>
        <h1 className="text-sm font-black text-slate-800">Tạo kế hoạch điều trị</h1>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {/* Tab bar */}
        <div className="flex shrink-0 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              activeTab === 'info' ? 'bg-[#245A34] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="h-4 w-4" strokeWidth={2.5} />
            Thông tin kế hoạch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              activeTab === 'events' ? 'bg-[#245A34] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarClock className="h-4 w-4" strokeWidth={2.5} />
            Lịch trình sự kiện
            {events.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  activeTab === 'events' ? 'bg-white/20 text-white' : 'bg-[#245A34]/10 text-[#245A34]'
                }`}
              >
                {events.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              activeTab === 'preview' ? 'bg-[#245A34] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Eye className="h-4 w-4" strokeWidth={2.5} />
            Xem trước
          </button>
        </div>

        {/* Tab panels */}
        <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
          <div className={`h-full min-h-0 overflow-y-auto ${activeTab === 'info' ? '' : 'hidden'}`}>
            <PlanInfoSection
              form={form}
              updateForm={updateForm}
              farmPlotOptions={farmPlotOptions}
              errors={planErrors}
            />
          </div>
          <div className={`h-full min-h-0 overflow-y-auto ${activeTab === 'events' ? 'flex flex-col' : 'hidden'}`}>
            <EventScheduleSection
              events={events}
              errors={eventErrors}
              onErrorsChange={setEventErrors}
              onAdd={addEvent}
              onChange={updateEvent}
              onRemove={removeEvent}
              onDuplicate={duplicateEvent}
              onMove={moveEvent}
              onAddWithData={addEventWithData}
              onUpdate={updateEventFull}
            />
          </div>
          <div className={`h-full min-h-0 overflow-y-auto ${activeTab === 'preview' ? '' : 'hidden'}`}>
            <PlanPreviewCalendar draftEvents={events} />
          </div>
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {submitError}
          </div>
        )}

        <div className="shrink-0 flex items-center justify-end gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <Link
            to={ROUTES.DASHBOARD.PLANS}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Huỷ
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-[#245A34] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a4226] disabled:opacity-60"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Đang lưu...
              </>
            ) : (
              <>
                <ClipboardList className="h-4 w-4" strokeWidth={2.5} />
                Tạo kế hoạch
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
