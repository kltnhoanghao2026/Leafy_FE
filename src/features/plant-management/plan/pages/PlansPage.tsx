import { useMemo, useState, useEffect, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Check, CheckCircle2, CircleDashed, ClipboardList, Loader2, Minus, Play, Plus, RefreshCw, Search, Trash2, X, XCircle } from "lucide-react";
import { ConfirmDeleteDialog } from "../../../farm-management/components/ConfirmDeleteDialog";
import { useFarmPlots } from "../../../farm-management/queries";
import { useMyProfile } from "../../../settings/queries";
import { ROUTES } from "../../../../lib/routes";
import { PagedGrid } from "../../../../components/ui/PagedGrid";
import { FilterCard } from "../../../../components/ui/FilterCard";
import { PlanCard } from "../components/PlanCard";
import {
  useBulkApplyPlansMutation,
  useBulkDeletePlansMutation,
  useBulkUpdatePlanStatusMutation,
  useDeletePlanMutation,
  useMyPlans,
  usePlants,
  useUpdatePlanStatusMutation,
} from "../..";
import type { PlanApplyRequest, PlanResponse, TreatmentStatus } from "../../shared/types";
import { Select } from "../../../../components/ui/Select";
import { BulkApplyPlanDialog } from "../components/BulkApplyPlanDialog";

const STATUS_TABS: Array<{
  value: TreatmentStatus | "";
  label: string;
  icon: ComponentType<{ className?: string }>;
  activeClass: string;
}> = [
  { value: "",          label: "Tất cả",          icon: ClipboardList,  activeClass: "bg-slate-800 text-white" },
  { value: "PENDING",   label: "Chờ áp dụng",    icon: CircleDashed,   activeClass: "bg-amber-500 text-white" },
  { value: "APPLYING",  label: "Đang xử lý",     icon: CircleDashed,   activeClass: "bg-purple-600 text-white" },
  { value: "ACTIVE",    label: "Đang thực hiện", icon: Play,           activeClass: "bg-blue-600 text-white" },
  { value: "COMPLETED", label: "Hoàn thành",      icon: CheckCircle2,  activeClass: "bg-emerald-600 text-white" },
  { value: "CANCELLED", label: "Đã hủy",          icon: XCircle,       activeClass: "bg-slate-500 text-white" },
];

const STATUS_OPTIONS: Array<{ value: TreatmentStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ áp dụng" },
  { value: "APPLYING", label: "Đang xử lý" },
  { value: "ACTIVE", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export function PlansPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TreatmentStatus | "">("");
  const [plantId, setPlantId] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<PlanResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApplyOpen, setBulkApplyOpen] = useState(false);
  const [bulkStatusChip, setBulkStatusChip] = useState<TreatmentStatus | "">("");
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const plansQuery = useMyPlans({ status, plantId: plantId || undefined, search: search || undefined, page, size: pageSize });
  const plantsQuery = usePlants();
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const updateStatus = useUpdatePlanStatusMutation();
  const deletePlan = useDeletePlanMutation();
  const bulkUpdateStatus = useBulkUpdatePlanStatusMutation();
  const bulkDeletePlans = useBulkDeletePlansMutation();
  const bulkApplyPlans = useBulkApplyPlansMutation();

  const plants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const plantById = useMemo(
    () => new Map(plants.map((plant) => [plant.id, plant])),
    [plants],
  );
  const plotById = useMemo(
    () => new Map((plotsQuery.data ?? []).map((plot) => [plot.id, plot])),
    [plotsQuery.data],
  );

  const paginatedPlans = plansQuery.data?.content ?? [];
  const totalPages = plansQuery.data?.totalPages ?? 0;
  const totalElements = plansQuery.data?.totalElements ?? 0;
  const filteredPlans = paginatedPlans; // alias used by selection bar count

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, plantId, status, pageSize]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deletePlan.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPageSelected =
    paginatedPlans.length > 0 && paginatedPlans.every((p) => selectedIds.has(p.id));
  const somePageSelected =
    paginatedPlans.some((p) => selectedIds.has(p.id)) && !allPageSelected;

  const handleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedPlans.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...paginatedPlans.map((p) => p.id)]));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkStatusChip("");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            Treatment plans
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            Kế hoạch điều trị
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Quản lý các kế hoạch điều trị thật đã tạo từ AI hoặc plant-management-service.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD.PLANS_CREATE)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1a4226]"
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Tạo kế hoạch mới
          </button>
          <Link
            to={ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR}
            className="inline-flex items-center justify-center rounded-2xl border border-[#245A34] bg-white px-5 py-3 text-sm font-bold text-[#245A34] hover:bg-green-50"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Xem lịch chăm sóc
          </Link>
        </div>
      </header>

      {/* Status tab bar */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc trạng thái kế hoạch">
        {STATUS_TABS.map(({ value, label, icon: Icon, activeClass }) => {
          const isActive = status === value;
          return (
            <button
              key={value || "all"}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => { setStatus(value as TreatmentStatus | ""); setPage(0); }}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-all ${
                isActive
                  ? `${activeClass} border-transparent shadow-md`
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <FilterCard viewMode={viewMode} onViewModeChange={setViewMode}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label htmlFor="plan-search" className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Tìm kiếm
            </span>
            <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input
                id="plan-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tên bệnh, câu hỏi, RAG ID..."
                className="h-12 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              />
            </div>
          </label>
          <div className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Cây trồng
            </span>
            <Select
              className="mt-2"
              value={plantId}
              onChange={(v) => setPlantId(String(v))}
              options={[
                { value: "", label: "Tất cả cây" },
                ...plants.map((plant) => ({
                  value: plant.id,
                  label: plant.nickName || plant.plantNumber || plant.id,
                })),
              ]}
              placeholder="Tất cả cây"
            />
          </div>
        </div>
      </FilterCard>

      {/* Selection info bar + bulk action toolbar — wrapped together so sticky never breaks their stacking order */}
      {filteredPlans.length > 0 && !plansQuery.isLoading ? (
        <div className="sticky top-4 z-10 flex flex-col gap-3">
          {/* Count / select-all row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span
                role="checkbox"
                aria-checked={allPageSelected ? true : somePageSelected || selectedIds.size > 0 ? "mixed" : false}
                onClick={allPageSelected ? handleSelectAll : handleSelectAll}
                className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all
                  ${allPageSelected || somePageSelected || selectedIds.size > 0
                    ? "border-[#245A34] bg-[#245A34]"
                    : "border-slate-300 bg-white hover:border-[#245A34]"
                  }`}
              >
                {allPageSelected
                  ? <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  : somePageSelected || selectedIds.size > 0
                    ? <Minus className="h-3 w-3 text-white" strokeWidth={3} />
                    : null
                }
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {selectedIds.size > 0
                  ? `${selectedIds.size} / ${filteredPlans.length} kế hoạch đã chọn`
                  : `${filteredPlans.length} kế hoạch`
                }
              </span>
              {selectedIds.size > 0 && !allPageSelected && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-[#245A34] hover:underline"
                >
                  Chọn trang này
                </button>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Bỏ chọn
              </button>
            )}
          </div>

          {/* Bulk action toolbar */}
          {selectedIds.size > 0 ? (
            <div className="rounded-2xl bg-[#245A34] px-4 py-3 shadow-xl shadow-[#245A34]/20">
              <div className="flex flex-wrap items-center gap-3">
                {/* Count */}
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-bold text-white">{selectedIds.size} kế hoạch đã chọn</span>
                </div>

                <div className="h-5 w-px bg-white/20" />

                {/* Status chips */}
                <span className="text-xs font-semibold text-white/60">Đổi trạng thái:</span>
                <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
                  {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setBulkStatusChip(bulkStatusChip === o.value ? "" : o.value as TreatmentStatus)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all
                        ${bulkStatusChip === o.value
                          ? "bg-white text-[#245A34] shadow-sm"
                          : "text-white/80 hover:bg-white/20 hover:text-white"
                        }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!bulkStatusChip || bulkUpdateStatus.isPending}
                  onClick={() =>
                    void bulkUpdateStatus
                      .mutateAsync({ planIds: [...selectedIds], status: bulkStatusChip as TreatmentStatus })
                      .then(() => clearSelection())
                  }
                  className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#245A34] hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkUpdateStatus.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
                    : <Check className="h-3 w-3" strokeWidth={3} />
                  }
                  Áp dụng
                </button>

                <div className="h-5 w-px bg-white/20" />

                {/* Apply plan */}
                <button
                  type="button"
                  onClick={() => setBulkApplyOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"
                >
                  <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Áp dụng kế hoạch
                </button>

                <div className="h-5 w-px bg-white/20" />

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={bulkDeletePlans.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500/25 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500/40 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Xóa đã chọn
                </button>

                <div className="flex-1" />

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-xl p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
                  title="Bỏ chọn tất cả"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {plansQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Đang tải kế hoạch điều trị">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-[1.75rem] bg-slate-100" />
          ))}
        </div>
      ) : null}

      {plansQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-red-700">
              Không tải được danh sách kế hoạch điều trị.
            </p>
            <button
              type="button"
              onClick={() => void plansQuery.refetch()}
              className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tải lại
            </button>
          </div>
        </div>
      ) : null}

      {!plansQuery.isLoading && !plansQuery.isError && filteredPlans.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-xl font-black text-slate-900">
            {status === "PENDING" ? "Không có kế hoạch đang chờ áp dụng"
              : status === "APPLYING" ? "Không có kế hoạch đang xử lý"
              : status === "ACTIVE" ? "Không có kế hoạch đang thực hiện"
              : status === "COMPLETED" ? "Chưa có kế hoạch hoàn thành"
              : status === "CANCELLED" ? "Không có kế hoạch đã hủy"
              : "Chưa có kế hoạch điều trị"}
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {status === "PENDING"
              ? "Kế hoạch mới tạo sẽ xuất hiện ở đây. Nhấn Áp dụng để chuyển sang Đang thực hiện."
              : status === "APPLYING"
              ? "Kế hoạch đang được xử lý bởi hệ thống. Vui lòng chờ trong giây lát."
              : status === "ACTIVE"
              ? "Kế hoạch sẽ chuyển sang tab này sau khi được áp dụng."
              : status === "COMPLETED"
              ? "Kế hoạch tự động hoàn thành khi tất cả sự kiện đã qua ngày kết thúc."
              : "Khi tạo kế hoạch từ AI hoặc chuyên gia tư vấn, danh sách sẽ hiển thị tại đây."}
          </p>
        </div>
      ) : null}

      <PagedGrid
        viewMode={viewMode}
        page={page}
        totalPages={totalPages}
        totalElements={filteredPlans.length}
        itemLabel="kế hoạch"
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
      >
        {paginatedPlans.map((plan: PlanResponse) => {
          const plant = plan.plantId ? plantById.get(plan.plantId) : null;
          const plot = plan.farmPlotId ? plotById.get(plan.farmPlotId) : null;
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              plantLabel={plant?.nickName || plant?.plantNumber}
              plotName={plot?.name}
              selected={selectedIds.has(plan.id)}
              onToggleSelect={toggleSelect}
              onDelete={setDeleteTarget}
              onStatusChange={(planId, newStatus) =>
                void updateStatus.mutateAsync({ planId, status: newStatus })
              }
              detailUrl={ROUTES.DASHBOARD.PLAN_DETAIL(plan.id)}
              variant={viewMode}
            />
          );
        })}
      </PagedGrid>

      {deleteTarget ? (
        <ConfirmDeleteDialog
          title="Xóa kế hoạch điều trị"
          description={`Bạn có chắc muốn xóa kế hoạch "${deleteTarget.diseaseName || deleteTarget.id}"?`}
          isDeleting={deletePlan.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}

      {showBulkDeleteConfirm ? (
        <ConfirmDeleteDialog
          title="Xóa kế hoạch đã chọn"
          description={`Bạn có chắc muốn xóa ${selectedIds.size} kế hoạch đã chọn?`}
          isDeleting={bulkDeletePlans.isPending}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          onConfirm={() =>
            void bulkDeletePlans.mutateAsync([...selectedIds]).then(() => {
              clearSelection();
              setShowBulkDeleteConfirm(false);
            })
          }
        />
      ) : null}

      {bulkApplyOpen ? (
        <BulkApplyPlanDialog
          planIds={[...selectedIds]}
          isSubmitting={bulkApplyPlans.isPending}
          onClose={() => setBulkApplyOpen(false)}
          onSubmit={(payload: PlanApplyRequest) =>
            void bulkApplyPlans
              .mutateAsync({ planIds: [...selectedIds], payload })
              .then(() => {
                setBulkApplyOpen(false);
                clearSelection();
              })
          }
        />
      ) : null}
    </div>
  );
}

export default PlansPage;

