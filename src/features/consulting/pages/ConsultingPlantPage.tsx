import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  ClipboardPlus,
  Leaf,
  Microscope,
  RefreshCw,
  Sprout,
  Stethoscope,
  Tag,
} from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import {
  useConsultingPlantById,
  useConsultingPlantEvents,
  useConsultingCalendarFiltered,
  useConsultingFarmPlots,
} from '../queries/consulting.queries';
import { useToggleTaskMutation, useUpdatePlantEventMutation } from '../../plant-management';
import { AddEventDialog } from '../components/AddEventDialog';
import { CreatePlanDialog } from '../components/CreatePlanDialog';
import { CalendarWorkspace } from '../../plant-management/calendarview/components/CalendarWorkspace';
import { PlantEventProgressModal } from '../../plant-management/overview/components/PlantEventProgressModal';
import { useSpecies } from '../../plant-management';
import { toLocalDateOnly } from '../../plant-management/shared/utils/dateOnly';
import type { PlantEventType, PlantStatus, PlantEventResponse } from '../../plant-management/shared/types';
import type { CalendarDateRange } from '../../plant-management/calendarview/schemas/calendar.types';
import { PageErrorState } from '../../../components/ui/PageErrorState';

// ── Constants ─────────────────────────────────────────────────────────────────

const eventTypeLabels: Record<PlantEventType, string> = {
  IRRIGATION: 'Tưới nước',
  NUTRITION: 'Bón phân',
  WEED_CONTROL: 'Diệt cỏ',
  PRUNING: 'Cắt tỉa',
  SCOUTING: 'Khảo sát',
  DISEASE_DETECTED: 'Phát hiện bệnh',
  TREATMENT_APPLICATION: 'Xử lý thuốc',
  QUARANTINE: 'Cách ly',
  HEALTH_RECOVERY: 'Phục hồi',
  PHENOLOGY: 'Theo dõi sinh trưởng',
  REPOT: 'Thay chậu / vị trí',
  HARVEST: 'Thu hoạch',
};

const plantStatusLabel: Record<PlantStatus, string> = {
  ACTIVE: 'Đang phát triển',
  INACTIVE: 'Ngừng hoạt động',
  ARCHIVED: 'Đã lưu trữ',
};

const plantStatusColor: Record<PlantStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
  ARCHIVED: 'bg-amber-100 text-amber-600',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitialMonthBounds(): { startDate: string; endDate: string } {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  return {
    startDate: toLocalDateOnly(new Date(y, m, 1)),
    endDate: toLocalDateOnly(new Date(y, m + 1, 0)),
  };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const [y, mo, day] = iso.slice(0, 10).split('-');
    return `${day}/${mo}/${y}`;
  } catch {
    return '—';
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ConsultingPlantPage() {
  const { farmerProfileId, plantId } = useParams<{
    farmerProfileId: string;
    plantId: string;
  }>();

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlantEventResponse | null>(null);
  const [calendarRange, setCalendarRange] = useState<CalendarDateRange>(() => {
    const b = getInitialMonthBounds();
    return { ...b, activeView: 'month' };
  });

  // Data queries
  const { data: plant, isLoading: plantLoading, isError: plantError, refetch: refetchPlant } =
    useConsultingPlantById(plantId ?? '');
  const {
    data: events,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useConsultingPlantEvents(farmerProfileId ?? '', plantId ?? '');

  // Species and farm plot lookups for display names
  const speciesQuery = useSpecies();
  const { data: farmerPlots } = useConsultingFarmPlots(farmerProfileId ?? '', !!farmerProfileId);

  const speciesById = useMemo(
    () => new Map((speciesQuery.data ?? []).map((s) => [s.id, s])),
    [speciesQuery.data],
  );
  const farmPlotById = useMemo(
    () => new Map((farmerPlots ?? []).map((p) => [p.id, p])),
    [farmerPlots],
  );

  // Calendar query — scoped to this single plant
  const calendarQuery = useConsultingCalendarFiltered(
    farmerProfileId ?? '',
    calendarRange.startDate,
    calendarRange.endDate,
    { plantId: plantId ?? '' },
    !!farmerProfileId && !!plantId,
  );

  const toggleTask = useToggleTaskMutation();
  const updateEvent = useUpdatePlantEventMutation();

  // ── Loading ────────────────────────────────────────────────────────────────

  if (plantLoading) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
        <div className="h-32 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse" />
        <div className="h-80 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (plantError || !plant) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
        <PageErrorState
          title="Không thể tải thông tin cây trồng."
          description="Cây không tồn tại hoặc bạn không có quyền truy cập."
          onRetry={() => void refetchPlant()}
        />
      </div>
    );
  }

  const displayName = plant.nickName || plant.plantNumber || `Cây #${plantId?.slice(0, 6)}`;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      {/* ── Back nav ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.DASHBOARD.CONSULTING_FARMER(farmerProfileId ?? '')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#245A34] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Nông dân tư vấn
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-700 truncate max-w-xs">{plant.nickName}</span>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="rounded-2xl bg-[#173F2A] p-6 text-white shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
              <Leaf className="h-3.5 w-3.5" />
              Plant consulting profile
            </p>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">
              {displayName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-black ${plantStatusColor[plant.plantStatus]}`}
              >
                {plantStatusLabel[plant.plantStatus]}
              </span>
              {plant.tagCode && (
                <span className="font-mono text-xs font-semibold text-emerald-50/80">
                  {plant.tagCode}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setShowAddEvent(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-black text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              <ClipboardPlus className="w-4 h-4" strokeWidth={2.5} />
              Thêm sự kiện
            </button>
            <button
              onClick={() => setShowCreatePlan(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#245A34] transition-colors hover:bg-emerald-50"
            >
              <Stethoscope className="w-4 h-4" strokeWidth={2.5} />
              Tạo kế hoạch
            </button>
          </div>
        </div>
      </header>

      {/* ── Plant info ─────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-2xl bg-[#EAF3EA] p-3 text-[#245A34]">
            <Sprout className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-800">Chi tiết cây trồng</h2>
            <p className="text-xs font-semibold text-slate-500">
              Thông tin cây trồng từ nông dân.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
          {plant.plantNumber && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Số cây</span>
              <span className="font-bold text-slate-700">{plant.plantNumber}</span>
            </div>
          )}

          {/* Species — resolved from speciesById */}
          {(() => {
            const sp = speciesById.get(plant.speciesId);
            return sp ? (
              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Loại giống</span>
                <span className="font-bold text-slate-700 truncate">
                  {sp.commonName || sp.cultivarName || plant.speciesId}
                </span>
              </div>
            ) : plant.speciesId ? (
              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Loại giống</span>
                <span className="font-bold text-slate-700 truncate">{plant.speciesId}</span>
              </div>
            ) : null;
          })()}

          {/* Farm plot — resolved from farmPlotById */}
          {(() => {
            const fp = farmPlotById.get(plant.farmPlotId);
            return fp ? (
              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Vườn</span>
                <span className="font-bold text-slate-700 truncate">{fp.name}</span>
              </div>
            ) : plant.farmPlotId ? (
              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Vườn</span>
                <span className="font-bold text-slate-700 truncate">{plant.farmPlotId}</span>
              </div>
            ) : null;
          })()}

          {plant.plantingDate && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Ngày trồng</span>
              <span className="font-bold text-slate-700">{formatDate(plant.plantingDate)}</span>
            </div>
          )}
          {plant.batchNumber && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Lô giống</span>
              <span className="font-bold text-slate-700">{plant.batchNumber}</span>
            </div>
          )}
          {plant.sourceType && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Nguồn cây</span>
              <span className="font-bold text-slate-700">{plant.sourceType}</span>
            </div>
          )}
          {plant.germinationDate && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Nảy mầm</span>
              <span className="font-bold text-slate-700">{formatDate(plant.germinationDate)}</span>
            </div>
          )}
          {plant.actualHarvestDate && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Ngày thu hoạch</span>
              <span className="font-bold text-slate-700">{formatDate(plant.actualHarvestDate)}</span>
            </div>
          )}
          {plant.totalYieldKg != null && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Sản lượng</span>
              <span className="font-bold text-slate-700">{plant.totalYieldKg} kg</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-2xl bg-[#EAF3EA] p-2.5 text-[#245A34]">
            <Sprout className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-800">Lịch chăm sóc</h2>
            <p className="text-xs font-semibold text-slate-500">
              Xem lịch chăm sóc cây theo tháng, tuần hoặc danh sách.
            </p>
          </div>
        </div>

        <div className="h-[560px] overflow-hidden">
          <CalendarWorkspace
            events={calendarQuery.data ?? []}
            calendarQuery={calendarQuery}
            onDateRangeChange={setCalendarRange}
            onEditEvent={() => {}}
            onToggleComplete={(event) =>
              void updateEvent.mutateAsync({
                eventId: event.id,
                payload: { completed: !event.completed },
              })
            }
            onToggleTask={(event, idx) =>
              void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
            }
            onSelectEvent={setSelectedEvent}
          />
        </div>
      </section>

      {/* ── Event timeline ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
          <CalendarDays className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />
          Lịch sử sự kiện
          <span className="text-sm font-semibold text-slate-400">
            ({eventsLoading ? '...' : (events ?? []).length})
          </span>
          {(eventsLoading) && (
            <button
              type="button"
              onClick={() => void refetchEvents()}
              className="ml-2 inline-flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="mr-1 h-3 w-3" strokeWidth={2.5} />
              Tải lại
            </button>
          )}
        </h2>

        {eventsLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />
            <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        ) : (events ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <CalendarDays className="mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
            <p className="font-medium text-slate-500">Chưa có sự kiện nào được ghi nhận cho cây này.</p>
            <p className="mt-1 text-sm text-slate-400">Bấm "Thêm sự kiện" để bắt đầu theo dõi.</p>
          </div>
        ) : (
          <div className="relative space-y-4 pl-4 before:absolute before:inset-y-0 before:left-2.75 before:w-0.5 before:bg-slate-100">
            {[...(events ?? [])]
              .reverse()
              .slice(0, 10)
              .map((event) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  <div className="absolute -left-5.25 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#245A34] shadow-sm" />
                  <div
                    className="flex-1 cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-green-100 bg-green-50/80 px-2.5 py-1 text-xs font-extrabold text-[#245A34]">
                        {eventTypeLabels[event.eventType] ?? event.eventType}
                      </span>
                      {event.planned && (
                        <span className="rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1 text-[10px] font-bold text-blue-600">
                          Dự kiến
                        </span>
                      )}
                      {event.calculatedStartDate && (
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          · {formatDate(event.calculatedStartDate)}
                        </span>
                      )}
                    </div>
                    {event.note && (
                      <p className="text-sm font-semibold text-slate-700">{event.note}</p>
                    )}
                    {event.description && (
                      <p className="mt-1 text-xs text-slate-500">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      {showAddEvent && plantId && (
        <AddEventDialog
          farmerProfileId={farmerProfileId ?? ''}
          plantId={plantId}
          onClose={() => setShowAddEvent(false)}
        />
      )}
      {showCreatePlan && plantId && (
        <CreatePlanDialog
          farmerProfileId={farmerProfileId ?? ''}
          plantId={plantId}
          onClose={() => setShowCreatePlan(false)}
        />
      )}

      {selectedEvent && (
        <PlantEventProgressModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleTask={(event, idx) =>
            void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
          }
          zIndex="z-[60]"
        />
      )}
    </div>
  );
}
