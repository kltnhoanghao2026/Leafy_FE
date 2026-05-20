import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock,
  Inbox,
  Leaf,
  Layers,
  Search,
  Sprout,
  Stethoscope,
  TreePine,
  Users,
  X,
} from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import {
  useConsultingFarmers,
  useConsultingFarmerSummaryBulk,
  useConsultingPendingCount,
} from '../queries/consulting.queries';
import { Avatar } from '../../../components/ui/Avatar';
import { PagedGrid } from '../../../components/ui/PagedGrid';
import { toPageResponse } from '../../plant-management/shared/api/apiUtils';
import type { ConsultationRequestResponse } from '../../profiles/api/profilesApi';
import { profilesApi } from '../../profiles/api/profilesApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* ─── Farmers tab ─────────────────────────────────────────────────────── */

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

function FarmersLoadingSkeleton() {
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

function FarmersEmptyState({ hasSearch }: { hasSearch: boolean }) {
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

function FarmersTab() {
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="h-5 w-40 rounded bg-slate-100 animate-pulse" />
          <div className="h-11 w-full sm:w-80 rounded-xl bg-slate-100 animate-pulse" />
        </div>
        <FarmersLoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        <p className="text-base font-black">Không tải được danh sách nông dân.</p>
        <p className="mt-1 text-sm font-medium text-red-600">
          Vui lòng thử tải lại trang hoặc kiểm tra kết nối dịch vụ hồ sơ.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
        <FarmersEmptyState hasSearch={searchTerm.trim().length > 0} />
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
                  <StatBadge icon={<TreePine className="w-3.5 h-3.5" />} label="Vườn" value={summary?.plotCount} />
                  <StatBadge icon={<Layers className="w-3.5 h-3.5" />} label="Khu" value={summary?.zoneCount} />
                  <StatBadge icon={<Sprout className="w-3.5 h-3.5" />} label="Cây" value={summary?.plantCount} />
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

/* ─── Requests tab ─────────────────────────────────────────────────────── */

function formatDate(isoString: string) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RequestsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 h-10 w-full rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function RequestsEmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#245A34]">
        <Inbox className="h-7 w-7" strokeWidth={2} />
      </div>
      <p className="mt-4 text-base font-black text-slate-800">
        {hasSearch ? 'Không tìm thấy yêu cầu phù hợp.' : 'Không có yêu cầu tư vấn nào.'}
      </p>
      <p className="mt-1 max-w-md text-sm font-medium leading-6 text-slate-500">
        {hasSearch
          ? 'Thử tìm kiếm theo tên khác hoặc xóa bộ lọc.'
          : 'Khi nông dân gửi yêu cầu tư vấn, chúng sẽ xuất hiện tại đây để bạn phê duyệt.'}
      </p>
    </div>
  );
}

function RequestsTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [processId, setProcessId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profiles', 'consulting', 'pending', page, pageSize],
    queryFn: async () => {
      const res = await profilesApi.getPendingConsultations({ page, size: pageSize });
      const d = (res as any).data;
      if (d && typeof d === 'object' && 'data' in d) {
        return toPageResponse<ConsultationRequestResponse>((d as any).data);
      }
      return { content: [] as ConsultationRequestResponse[], totalPages: 0, totalElements: 0 };
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ followerId, accept }: { followerId: string; accept: boolean }) =>
      profilesApi.respondToConsultation(followerId, accept),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profiles', 'consulting', 'pending'] });
    },
  });

  const requests = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const filtered = search.trim()
    ? requests.filter((r) =>
        [r.followerName, r.followerRole, r.followerId]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(search.trim().toLowerCase())),
      )
    : requests;

  const handleRespond = (followerId: string, accept: boolean) => {
    setProcessId(followerId);
    respondMutation.mutate({ followerId, accept });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Tìm theo tên nông dân..."
          className="flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {isLoading && <RequestsLoadingSkeleton />}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm font-bold text-red-700">Không tải được yêu cầu.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
          >
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <RequestsEmptyState hasSearch={search.trim().length > 0} />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <PagedGrid
          viewMode="grid"
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          itemLabel="yêu cầu"
          onPageChange={setPage}
          pageSize={pageSize}
          pageSizeOptions={[20, 50, 100]}
          onPageSizeChange={() => {}}
        >
          {filtered.map((request) => {
            const processing = processId === request.followerId && respondMutation.isPending;
            return (
              <div
                key={request.connectionId}
                className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={request.followerAvatar || undefined}
                    name={request.followerName}
                    size="lg"
                    className="border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-slate-900">{request.followerName}</p>
                    <p className="truncate text-xs font-bold capitalize text-slate-500">
                      {request.followerRole?.toLowerCase() || 'Nông dân'}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">ID: {request.followerId}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-600">
                    Chờ duyệt
                  </span>
                </div>

                <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span>Yêu cầu lúc: {formatDate(request.requestedAt)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!!processId}
                    onClick={() => handleRespond(request.followerId, true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#245A34] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a4226] disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                        Chấp nhận
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={!!processId}
                    onClick={() => handleRespond(request.followerId, false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                    Từ chối
                  </button>
                </div>
              </div>
            );
          })}
        </PagedGrid>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */

type Tab = 'farmers' | 'requests';

export function ConsultingDashboardPage() {
  const [tab, setTab] = useState<Tab>('farmers');
  const { data: pendingCount = 0 } = useConsultingPendingCount();
  const { data: farmers } = useConsultingFarmers();
  const farmerCount = (farmers ?? []).length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: 'farmers',
      label: 'Nông dân',
      icon: <Stethoscope className="h-4 w-4" />,
      badge: farmerCount,
    },
    {
      key: 'requests',
      label: 'Yêu cầu',
      icon: <Inbox className="h-4 w-4" />,
      badge: pendingCount,
    },
  ];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
      {/* Header */}
      <header className="rounded-2xl bg-[#173F2A] px-6 py-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
              <Leaf className="h-3.5 w-3.5" />
              Expert consulting workspace
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Tư vấn</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-emerald-50/90">
              Theo dõi nông dân đang được tư vấn và phê duyệt yêu cầu tư vấn mới.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15">
            <Clock className="h-4 w-4 text-emerald-200" strokeWidth={2} />
            <span className="text-sm font-bold">{pendingCount} chờ duyệt</span>
          </div>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 w-fit">
        {tabs.map(({ key, label, icon, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {icon}
            {label}
            {badge != null && badge > 0 && (
              <span
                className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black leading-none ${
                  tab === key ? 'bg-[#245A34] text-white' : 'bg-red-500 text-white'
                }`}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'farmers' && <FarmersTab />}
      {tab === 'requests' && <RequestsTab />}
    </div>
  );
}
