import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ClipboardPlus, Leaf, Stethoscope, Tag } from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import {
  useConsultingPlantById,
  useConsultingPlantEvents,
} from '../queries/consulting.queries';
import { AddEventDialog } from '../components/AddEventDialog';
import { CreatePlanDialog } from '../components/CreatePlanDialog';
import type { PlantEventType, PlantStatus } from '../../plant-management/shared/types';

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

export function ConsultingPlantPage() {
  const { farmerProfileId, plantId } = useParams<{
    farmerProfileId: string;
    plantId: string;
  }>();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  const { data: plant, isLoading: plantLoading, isError: plantError } = useConsultingPlantById(plantId ?? '');
  const { data: events, isLoading: eventsLoading } = useConsultingPlantEvents(
    farmerProfileId ?? '',
    plantId ?? '',
  );

  if (plantLoading) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
        <div className="h-32 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse" />
        <div className="h-36 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse" />
      </div>
    );
  }

  if (plantError || !plant) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <p className="font-black">Không thể tải thông tin cây trồng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.DASHBOARD.CONSULTING_FARM_PLOT(farmerProfileId ?? '', plant.farmPlotId)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#245A34] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Trang trại
        </Link>
      </div>

      {/* Header */}
      <header className="rounded-2xl bg-[#173F2A] p-6 text-white shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
              <Leaf className="h-3.5 w-3.5" />
              Plant consulting profile
            </p>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">
              {plant.nickName ?? `Cây #${plant.plantNumber ?? plantId?.slice(0, 6)}`}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${plantStatusColor[plant.plantStatus]}`}>
                {plantStatusLabel[plant.plantStatus]}
              </span>
              {plant.tagCode && <span className="font-mono text-xs font-semibold text-emerald-50/80">{plant.tagCode}</span>}
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

      {/* Plant info */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#245A34]" />
          Chi tiết cây trồng
        </h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
          {plant.plantNumber && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Số cây</span>
              <span className="font-bold text-slate-700">{plant.plantNumber}</span>
            </div>
          )}
          {plant.speciesId && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loại giống</span>
              <span className="font-bold text-slate-700 truncate">{plant.speciesId}</span>
            </div>
          )}
          {plant.plantingDate && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ngày trồng</span>
              <span className="font-bold text-slate-700">
                {new Date(plant.plantingDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
          {plant.batchNumber && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lô</span>
              <span className="font-bold text-slate-700">{plant.batchNumber}</span>
            </div>
          )}
          {plant.sourceType && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Nguồn gốc</span>
              <span className="font-bold text-slate-700">{plant.sourceType}</span>
            </div>
          )}
          {plant.germinationDate && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ngày nảy mầm</span>
              <span className="font-bold text-slate-700">
                {new Date(plant.germinationDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
          {plant.actualHarvestDate && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ngày thu hoạch</span>
              <span className="font-bold text-slate-700">
                {new Date(plant.actualHarvestDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
          {plant.totalYieldKg != null && (
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sản lượng</span>
              <span className="font-bold text-slate-700">{plant.totalYieldKg} kg</span>
            </div>
          )}
        </div>
      </section>

      {/* Events */}
      <section className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#245A34]" strokeWidth={2.5} />
          Lịch sử sự kiện ({eventsLoading ? '...' : (events ?? []).length})
        </h2>

        {eventsLoading ? (
          <div className="flex space-x-2 justify-center py-6">
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        ) : (events ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-slate-500 font-medium">Chưa có sự kiện nào được ghi nhận cho cây này.</p>
            <p className="text-slate-400 text-sm mt-1">Bấm "Thêm sự kiện" để bắt đầu theo dõi.</p>
          </div>
        ) : (
          <div className="relative space-y-4 pl-4 before:absolute before:inset-y-0 before:left-2.75 before:w-0.5 before:bg-slate-100">
            {[...(events ?? [])].reverse().map((event) => (
              <div key={event.id} className="relative flex gap-4 items-start">
                <div className="absolute -left-5.25 mt-1.5 w-3 h-3 rounded-full border-2 border-white bg-[#245A34] shadow-sm"></div>
                <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-extrabold text-[#245A34] bg-green-50/80 px-2.5 py-1 rounded-full border border-green-100">
                      {eventTypeLabels[event.eventType] ?? event.eventType}
                    </span>
                    {event.planned && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100">
                        Dự kiến
                      </span>
                    )}
                    {event.calculatedStartDate && (
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        • {new Date(event.calculatedStartDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  {event.note && <p className="text-sm font-semibold text-slate-700">{event.note}</p>}
                  {event.description && (
                    <p className="mt-1 text-xs text-slate-500">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dialogs */}
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
    </div>
  );
}
