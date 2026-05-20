import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, CalendarClock, Eye } from 'lucide-react';
import { PlanPreviewCalendar } from '../components/PlanPreviewCalendar';
import { ROUTES } from '../../../lib/routes';
import { useCreateConsultingPlan, useConsultingFarmPlots } from '../queries/consulting.queries';
import type { PlanCreateRequest, PlantEventCreateRequest } from '../../plant-management/shared/types';
import { PlanInfoSection, emptyForm } from '../components/PlanInfoSection';
import type { PlanFormState, PlanInfoErrors } from '../components/PlanInfoSection';
import { EventScheduleSection } from '../components/EventScheduleSection';
import { emptyEvent } from '../components/PlanInfoSection';

export function ConsultingCreatePlanPage() {
  const { farmerProfileId } = useParams<{ farmerProfileId: string }>();
  const fid = farmerProfileId ?? '';
  const navigate = useNavigate();

  const draftKey = fid ? `consulting_plan_draft_${fid}` : null;

  const [form, setForm] = useState<PlanFormState>(() => {
    if (!draftKey) return emptyForm();
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) return (JSON.parse(raw) as { form: PlanFormState; events: PlantEventCreateRequest[] }).form ?? emptyForm();
    } catch { return emptyForm(); }
    return emptyForm();
  });
  const [events, setEvents] = useState<PlantEventCreateRequest[]>(() => {
    if (!draftKey) return [];
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) return (JSON.parse(raw) as { form: PlanFormState; events: PlantEventCreateRequest[] }).events ?? [];
    } catch { return []; }
    return [];
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [planErrors, setPlanErrors] = useState<PlanInfoErrors>({});
  const [activeTab, setActiveTab] = useState<'info' | 'events' | 'preview'>('info');

  // Auto-save draft to localStorage on every form/events change
  useEffect(() => {
    if (!draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ form, events }));
    } catch { /* ignore quota errors */ }
  }, [draftKey, form, events]);

  const { mutateAsync, isPending } = useCreateConsultingPlan();
  const { data: farmPlots } = useConsultingFarmPlots(fid, !!fid);

  const farmPlotOptions = useMemo(
    () => [
      { value: '', label: '-- Tất cả trang trại --' },
      ...(farmPlots ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [farmPlots],
  );

  const updateForm = (field: keyof PlanFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setPlanErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addEvent = () => setEvents((prev) => [...prev, emptyEvent()]);

  const addEventWithData = (evt: PlantEventCreateRequest) =>
    setEvents((prev) => [...prev, evt]);

  const updateEventFull = (index: number, evt: PlantEventCreateRequest) =>
    setEvents((prev) => prev.map((e, i) => (i === index ? evt : e)));

  const removeEvent = (index: number) =>
    setEvents((prev) => prev.filter((_, i) => i !== index));

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
  ) =>
    setEvents((prev) =>
      prev.map((evt, i) => (i === index ? { ...evt, [field]: value } : evt)),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // ── Field-level validation ─────────────────────────────────────────────
    const pErr: PlanInfoErrors = {};
    if (!form.diseaseName.trim()) pErr.diseaseName = 'Vui lòng nhập tên bệnh / vấn đề.';
    if (Object.keys(pErr).length > 0) {
      setPlanErrors(pErr);
      setActiveTab('info');
      return;
    }
    setPlanErrors({});

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
      await mutateAsync({ farmerProfileId: fid, payload });
      if (draftKey) localStorage.removeItem(draftKey);
      navigate(ROUTES.DASHBOARD.CONSULTING_FARMER(fid));
    } catch {
      setSubmitError('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 min-h-0 w-full overflow-hidden">
      {/* Back nav + title */}
      <div className="shrink-0 flex items-center gap-3">
        <Link
          to={ROUTES.DASHBOARD.CONSULTING_FARMER(fid)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#245A34] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Quay lại
        </Link>
        <span className="text-slate-200">/</span>
        <h1 className="text-sm font-black text-slate-800">Tạo kế hoạch tư vấn</h1>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {/* Tab bar */}
        <div className="flex shrink-0 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              activeTab === 'info'
                ? 'bg-[#245A34] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="h-4 w-4" strokeWidth={2.5} />
            Thông tin kế hoạch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              activeTab === 'events'
                ? 'bg-[#245A34] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarClock className="h-4 w-4" strokeWidth={2.5} />
            Lịch trình sự kiện
            {events.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  activeTab === 'events'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#245A34]/10 text-[#245A34]'
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
              activeTab === 'preview'
                ? 'bg-[#245A34] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
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
            to={ROUTES.DASHBOARD.CONSULTING_FARMER(fid)}
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