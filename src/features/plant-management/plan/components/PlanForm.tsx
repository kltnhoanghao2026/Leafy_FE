import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, CalendarClock, Eye } from 'lucide-react';
import { PlanPreviewCalendar } from '../../../consulting/components/PlanPreviewCalendar';
import { ROUTES } from '../../../../lib/routes';
import { useFarmPlots } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import type { PlanCreateRequest, PlantEventCreateRequest, PlanUpdateRequest, PlanResponse } from '../../shared/types';
import { PlanInfoSection, emptyForm, type PlanFormStateCreate, type PlanFormStateEdit } from './PlanInfoSection';
import type { PlanInfoErrors } from './PlanInfoSection';
import { emptyEvent } from '../../../consulting/utils/planFormHelpers';
import { EventScheduleSection } from '../../../consulting/components/EventScheduleSection';

interface PlanFormProps {
  /** When provided, the form operates in edit mode */
  existingPlan?: PlanResponse;
  /** Called when the form is submitted in create mode */
  onCreate?: (payload: PlanCreateRequest) => Promise<unknown>;
  /** Called when the form is submitted in edit mode */
  onUpdate?: (payload: PlanUpdateRequest) => Promise<unknown>;
  /** Show "Tạo" button (create mode) or "Lưu thay đổi" button (edit mode) */
  isSubmitting?: boolean;
  draftStorageKey?: string;
  /** Navigate destination after successful create (defaults to plan list) */
  createSuccessNavigateTo?: string;
}

const DRAFT_KEY_DEFAULT = 'plan_create_draft';

/** Convert a PlanResponse to PlanFormStateEdit */
function planToEditForm(plan: PlanResponse): PlanFormStateEdit {
  return {
    planName: plan.planName ?? "",
    diseaseName: plan.diseaseName ?? "",
    severityLevel: plan.severityLevel ?? "",
    estimatedCost: plan.estimatedCost ?? "",
    successIndicators: plan.successIndicators ?? "",
    requiredInputs: plan.requiredInputs ?? [],
    safetyWarnings: plan.safetyWarnings ?? [],
    farmPlotId: "",
    speciesId: "",
    speciesName: "",
    isPublic: plan.isPublic ?? false,
  };
}

/** Convert a PlanResponse's events to PlantEventCreateRequest[] */
function planEventsToDraftEvents(plan: PlanResponse): PlantEventCreateRequest[] {
  return (plan.events ?? []).map((e) => ({
    eventType: e.eventType,
    note: e.note ?? "",
    description: e.description ?? undefined,
    daysFromStart: e.daysFromStart ?? 0,
    durationDays: e.durationDays,
    phiDays: e.phiDays,
    ppeRequired: e.ppeRequired ?? undefined,
    mrlNote: e.mrlNote ?? undefined,
    estimatedCost: e.estimatedCost ?? undefined,
  }));
}

export function PlanForm({
  existingPlan,
  onCreate,
  onUpdate,
  isSubmitting = false,
  draftStorageKey = DRAFT_KEY_DEFAULT,
  createSuccessNavigateTo,
}: PlanFormProps) {
  const navigate = useNavigate();
  const isEditMode = Boolean(existingPlan);

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? '';
  const { data: farmPlots } = useFarmPlots(ownerProfileId, !!ownerProfileId);

  // ── Form state ────────────────────────────────────────────────────────────

  const [form, setForm] = useState<PlanFormStateCreate | PlanFormStateEdit>(() => {
    if (existingPlan) {
      return planToEditForm(existingPlan);
    }
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (raw) return { ...emptyForm(), ...(JSON.parse(raw) as { form: PlanFormStateCreate }).form };
    } catch { /* ignore */ }
    return emptyForm();
  });

  const [events, setEvents] = useState<PlantEventCreateRequest[]>(() => {
    if (existingPlan) {
      return planEventsToDraftEvents(existingPlan);
    }
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (raw) return (JSON.parse(raw) as { events: PlantEventCreateRequest[] }).events ?? [];
    } catch { /* ignore */ }
    return [];
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [planErrors, setPlanErrors] = useState<PlanInfoErrors>({});
  const [activeTab, setActiveTab] = useState<'info' | 'events' | 'preview'>('info');

  // Persist draft in localStorage (create mode only)
  useEffect(() => {
    if (isEditMode) return;
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify({ form, events }));
    } catch { /* ignore quota errors */ }
  }, [form, events, isEditMode, draftStorageKey]);

  const farmPlotOptions = useMemo(
    () => [
      { value: '', label: '-- Tất cả trang trại --' },
      ...(farmPlots ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [farmPlots],
  );

  const updateForm = (field: keyof PlanFormStateCreate | keyof PlanFormStateEdit, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setPlanErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Event handlers ────────────────────────────────────────────────────────

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

  // ── Submit ────────────────────────────────────────────────────────────────

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

    if (!isEditMode) {
      // ── Create mode validation ──────────────────────────────────────────
      for (const [i, evt] of events.entries()) {
        if (!evt.eventType) {
          setSubmitError(`Sự kiện #${i + 1}: Vui lòng chọn loại sự kiện.`);
          setActiveTab('events');
          return;
        }
        if (!evt.note?.trim()) {
          setSubmitError(`Sự kiện #${i + 1}: Vui lòng nhập ghi chú.`);
          setActiveTab('events');
          return;
        }
      }

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
        planName: (form as PlanFormStateCreate).planName?.trim() || undefined,
        farmPlotId: (form as PlanFormStateCreate).farmPlotId || undefined,
        speciesId: (form as PlanFormStateCreate).speciesId || undefined,
        source: 'documents',
        severityLevel: (form as PlanFormStateCreate).severityLevel || undefined,
        requiredInputs: (form as PlanFormStateCreate).requiredInputs?.trim()
          ? [(form as PlanFormStateCreate).requiredInputs.trim()]
          : undefined,
        safetyWarnings: (form as PlanFormStateCreate).safetyWarnings?.trim()
          ? [(form as PlanFormStateCreate).safetyWarnings.trim()]
          : undefined,
        successIndicators: (form as PlanFormStateCreate).successIndicators?.trim() || undefined,
        estimatedCost: (form as PlanFormStateCreate).estimatedCost?.trim() || undefined,
        isPublic: form.isPublic,
        schedule: cleanedEvents.length > 0 ? cleanedEvents : undefined,
      };

      try {
        await (onCreate?.(payload) ?? Promise.resolve());
        localStorage.removeItem(draftStorageKey);
        navigate(createSuccessNavigateTo ?? ROUTES.DASHBOARD.PLANS);
      } catch (err) {
        console.error('[PlanForm] handleSubmit (create) error:', err);
        setSubmitError('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.');
      }
    } else {
      // ── Edit mode validation ────────────────────────────────────────────
      const editForm = form as PlanFormStateEdit;

      // Clean events similar to create mode
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

      const payload: PlanUpdateRequest = {
        planName: editForm.planName || undefined,
        diseaseName: editForm.diseaseName || undefined,
        severityLevel: editForm.severityLevel || undefined,
        estimatedCost: editForm.estimatedCost || undefined,
        successIndicators: editForm.successIndicators || undefined,
        requiredInputs: editForm.requiredInputs.filter(Boolean),
        safetyWarnings: editForm.safetyWarnings.filter(Boolean),
        schedule: cleanedEvents.length > 0 ? cleanedEvents : [],
      };

      try {
        await (onUpdate?.(payload) ?? Promise.resolve());
      } catch (err) {
        console.error('[PlanForm] handleSubmit (edit) error:', err);
        setSubmitError('Có lỗi xảy ra khi cập nhật kế hoạch. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 min-h-0 w-full overflow-hidden">
      {/* Back nav + title */}
      <div className="shrink-0 flex items-center gap-3">
        {isEditMode ? (
          <Link
            to={ROUTES.DASHBOARD.PLAN_DETAIL(existingPlan.id)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#245A34] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
            Quay lại chi tiết
          </Link>
        ) : (
          <Link
            to={ROUTES.DASHBOARD.PLANS}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#245A34] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
            Quay lại
          </Link>
        )}
        <span className="text-slate-200">/</span>
        <h1 className="text-sm font-black text-slate-800">
          {isEditMode ? 'Chỉnh sửa kế hoạch' : 'Tạo kế hoạch điều trị'}
        </h1>
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
              isEditMode={isEditMode}
            />
          </div>
          <div className={`h-full min-h-0 overflow-y-auto ${activeTab === 'events' ? 'flex flex-col' : 'hidden'}`}>
            <EventScheduleSection
              events={events}
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
            to={isEditMode ? ROUTES.DASHBOARD.PLAN_DETAIL(existingPlan?.id ?? '') : ROUTES.DASHBOARD.PLANS}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Huỷ
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-[#245A34] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a4226] disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Đang lưu...
              </>
            ) : (
              <>
                <ClipboardList className="h-4 w-4" strokeWidth={2.5} />
                {isEditMode ? 'Lưu thay đổi' : 'Tạo kế hoạch'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
