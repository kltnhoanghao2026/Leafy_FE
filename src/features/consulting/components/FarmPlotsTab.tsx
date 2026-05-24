import { useNavigate } from 'react-router-dom';
import { MapPin, Layers, ShieldOff } from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import { useConsultingFarmPlots } from '../queries/consulting.queries';
import type { FarmPlotStatus } from '../../farm-management/types';
import type { PrivacySettings } from '../../settings/types';

const statusLabel: Record<FarmPlotStatus, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  ARCHIVED: 'Đã lưu trữ',
};

const statusColor: Record<FarmPlotStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
  ARCHIVED: 'bg-amber-100 text-amber-600',
};

interface FarmPlotsTabProps {
  farmerProfileId: string;
  privacySettings?: PrivacySettings | null;
}

export function FarmPlotsTab({ farmerProfileId, privacySettings }: FarmPlotsTabProps) {
  const navigate = useNavigate();
  const shared = !!privacySettings?.shareFarmPlotsWithConsultants;
  const { data: plots, isLoading, isError } = useConsultingFarmPlots(farmerProfileId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pt-6 text-center text-red-500 font-semibold">
        Có lỗi xảy ra khi tải danh sách trang trại.
      </div>
    );
  }

  if ((plots ?? []).length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
        {!shared && (
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1 mb-4">
            <ShieldOff className="w-3 h-3" strokeWidth={2.5} />
            Chưa chia sẻ
          </div>
        )}
        <MapPin className="w-12 h-12 text-slate-300 mb-4" strokeWidth={1.5} />
        <p className="text-slate-500 font-semibold">
          {shared
            ? 'Nông dân này chưa có trang trại nào.'
            : 'Nông dân chưa chia sẻ dữ liệu trang trại.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-6">
      {!shared && (
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1 self-start">
          <ShieldOff className="w-3 h-3" strokeWidth={2.5} />
          Chưa chia sẻ
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {(plots ?? []).map((plot) => (
          <div
            key={plot.id}
            className="group flex min-h-48 flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-800 text-lg truncate group-hover:text-[#245A34] transition-colors">
                  {plot.name}
                </p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {plot.code}
                </p>
              </div>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[plot.status]}`}
              >
                {statusLabel[plot.status]}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              {plot.areaM2 != null && (
                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md text-slate-600 border border-slate-100">
                  <Layers className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {plot.areaM2.toLocaleString('vi-VN')} m²
                </span>
              )}
              {plot.addressLine && (
                <span className="truncate flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md text-slate-600 border border-slate-100 flex-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">{plot.addressLine}</span>
                </span>
              )}
            </div>

            <button
              onClick={() =>
                navigate(ROUTES.DASHBOARD.CONSULTING_FARM_PLOT(farmerProfileId, plot.id))
              }
              className="w-full py-2 px-4 rounded-full bg-[#245A34] text-white text-sm font-bold hover:bg-[#1a4226] transition-colors"
            >
              Xem chi tiết
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
