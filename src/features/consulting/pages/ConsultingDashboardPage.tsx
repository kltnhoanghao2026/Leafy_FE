import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Leaf,
  Layers,
  Search,
  Sprout,
  TreePine,
  Users,
} from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import { useConsultingFarmers, useConsultingFarmerSummaryBulk } from '../queries/consulting.queries';
import { Avatar } from '../../../components/ui/Avatar';
import type { ConsultationRequestResponse } from '../../profiles/api/profilesApi';

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | undefined }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2">
      <div className="flex items-center gap-1 text-slate-400">
        {icon}
        <span className="text-[11px] font-black uppercase tracking-wide">{label}</span>
      </div>
      {value === undefined ? (
        <div className="h-4 w-6 rounded bg-slate-100 animate-pulse" />
      ) : (
        <span className="text-lg font-black text-slate-900">{value}</span>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
          <div className="mt-5 h-16 rounded-xl bg-slate-50 animate-pulse" />
          <div className="mt-4 h-10 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#245A34]">
        <Users className="h-7 w-7" strokeWidth={2} />
      </div>
      <p className="mt-4 text-base font-black text-slate-800">
        {hasSearch ? 'Không tìm thấy nông dân phù hợp.' : 'Bạn chưa có nông dân tư vấn nào.'}
      </p>
      <p className="mt-1 max-w-md text-sm font-medium leading-6 text-slate-500">
        {hasSearch
          ? 'Thử tìm theo tên khác hoặc xoá bộ lọc hiện tại để xem toàn bộ danh sách.'
          : 'Khi nông dân gửi yêu cầu tư vấn và bạn chấp thuận, hồ sơ trang trại của họ sẽ xuất hiện tại đây.'}
      </p>
    </div>
  );
}

export function ConsultingDashboardPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: farmers, isLoading, isError } = useConsultingFarmers();

  const farmerList = (farmers ?? []) as ConsultationRequestResponse[];
  const farmerIds = farmerList.map((f) => f.followerId).filter(Boolean);

  const { data: summaryMap } = useConsultingFarmerSummaryBulk(farmerIds, farmerIds.length > 0);

  const totals = useMemo(() => {
    return farmerIds.reduce(
      (acc, id) => {
        const summary = summaryMap?.[id];
        acc.plots += summary?.plotCount ?? 0;
        acc.zones += summary?.zoneCount ?? 0;
        acc.plants += summary?.plantCount ?? 0;
        return acc;
      },
      { plots: 0, zones: 0, plants: 0 },
    );
  }, [farmerIds, summaryMap]);

  const filteredFarmers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return farmerList;
    return farmerList.filter((farmer) => {
      return [farmer.followerName, farmer.followerRole, farmer.followerId]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [farmerList, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
        <div className="rounded-2xl bg-[#173F2A] px-6 py-5 text-white shadow-sm">
          <div className="h-4 w-48 rounded bg-white/20 animate-pulse" />
          <div className="mt-3 h-7 w-72 max-w-full rounded bg-white/20 animate-pulse" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <p className="text-base font-black">Không tải được danh sách nông dân.</p>
          <p className="mt-1 text-sm font-medium text-red-600">
            Vui lòng thử tải lại trang hoặc kiểm tra kết nối dịch vụ hồ sơ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
      <header className="rounded-2xl bg-[#173F2A] px-6 py-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
              <Leaf className="h-3.5 w-3.5" />
              Expert consulting workspace
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Nông dân tư vấn
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-emerald-50/90">
              Theo dõi nhanh hồ sơ nông dân, quy mô trang trại và cây trồng cần hỗ trợ.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-96">
            <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">Nông dân</p>
              <p className="text-2xl font-black">{farmerList.length}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">Vườn</p>
              <p className="text-2xl font-black">{totals.plots}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">Cây</p>
              <p className="text-2xl font-black">{totals.plants}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">Danh sách đang phụ trách</p>
          <p className="text-xs font-semibold text-slate-500">
            {filteredFarmers.length} / {farmerList.length} hồ sơ hiển thị
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#245A34] focus:bg-white focus:ring-2 focus:ring-[#245A34]/10"
            placeholder="Tìm theo tên nông dân..."
            type="search"
          />
        </div>
      </div>

      {filteredFarmers.length === 0 ? (
        <EmptyState hasSearch={searchTerm.trim().length > 0} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredFarmers.map((farmer) => {
            const summary = summaryMap?.[farmer.followerId];
            return (
              <button
                key={farmer.connectionId}
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD.CONSULTING_FARMER(farmer.followerId))}
                className="group flex min-h-56 flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#245A34]/20"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={farmer.followerAvatar || undefined}
                    name={farmer.followerName}
                    size="lg"
                    className="border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-slate-900 transition-colors group-hover:text-[#245A34]">
                      {farmer.followerName}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-bold capitalize text-slate-500">
                      {farmer.followerRole?.toLowerCase() || 'Nông dân'}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#245A34]">
                    Đang tư vấn
                  </span>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 p-1">
                  <StatBadge
                    icon={<TreePine className="w-3.5 h-3.5" />}
                    label="Vườn"
                    value={summary?.plotCount}
                  />
                  <StatBadge
                    icon={<Layers className="w-3.5 h-3.5" />}
                    label="Khu"
                    value={summary?.zoneCount}
                  />
                  <StatBadge
                    icon={<Sprout className="w-3.5 h-3.5" />}
                    label="Cây"
                    value={summary?.plantCount}
                  />
                </div>

                <div className="mt-auto flex items-center justify-between rounded-xl bg-[#245A34] px-4 py-3 text-sm font-black text-white transition-colors group-hover:bg-[#1a4226]">
                  <span>Xem trang trại</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
