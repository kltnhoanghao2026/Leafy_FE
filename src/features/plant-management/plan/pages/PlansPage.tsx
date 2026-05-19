import { useMemo, useState, useEffect, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays, Check, CheckCircle2, CircleDashed, ClipboardList,
  Globe, Layers, Loader2, Lock, Minus, Play, Plus, RefreshCw, Search,
  Trash2, Users, X, XCircle,
} from "lucide-react";
import { ConfirmDeleteDialog } from "../../../farm-management/components/ConfirmDeleteDialog";
import { useFarmPlots } from "../../../farm-management/queries";
import { useMyProfile } from "../../../settings/queries";
import { ROUTES } from "../../../../lib/routes";
import { PagedGrid } from "../../../../components/ui/PagedGrid";
import { FilterCard } from "../../../../components/ui/FilterCard";
import { PlanCard } from "../components/PlanCard";
import { PlanApplyCard } from "../components/PlanApplyCard";
import {
  useBulkApplyPlansMutation,
  useBulkDeletePlansMutation,
  useBulkUpdateApplyStatusMutation,
  useCancelApplyMutation,
  useDeletePlanMutation,
  useMyApplies,
  useMyPlans,
  usePlants,
  usePublicPlans,
  useUpdateApplyStatusMutation,
} from "../..";
import { useBulkApplyCustomMutation } from "../queries/plan.queries";
import { CancelApplyDialog } from "../components/CancelApplyDialog";
import { useSearchPlans } from "../../../search/queries";
import type { PlanApplyRequest, PlanResponse, PublicPlanListParams, TreatmentStatus } from "../../shared/types";
import { Select } from "../../../../components/ui/Select";
import { BulkApplyPlanDialog } from "../components/BulkApplyPlanDialog";
import { BulkApplyCustomDialog } from "../components/BulkApplyCustomDialog";
import { ApplyPlanDialog } from "../components/ApplyPlanDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewTab = "my" | "public" | "applied";

const STATUS_TABS: Array<{
  value: TreatmentStatus | "";
  label: string;
  icon: ComponentType<{ className?: string }>;
  activeClass: string;
}> = [
  { value: "",          label: "Tất cả",          icon: ClipboardList, activeClass: "bg-slate-800 text-white" },
  { value: "PENDING",   label: "Chờ áp dụng",    icon: CircleDashed,  activeClass: "bg-amber-500 text-white" },
  { value: "APPLYING",  label: "Đang xử lý",     icon: CircleDashed,  activeClass: "bg-purple-600 text-white" },
  { value: "ACTIVE",    label: "Đang thực hiện", icon: Play,          activeClass: "bg-blue-600 text-white" },
  { value: "COMPLETED", label: "Hoàn thành",     icon: CheckCircle2,  activeClass: "bg-emerald-600 text-white" },
  { value: "CANCELLED", label: "Đã hủy",         icon: XCircle,       activeClass: "bg-slate-500 text-white" },
];

const STATUS_OPTIONS: Array<{ value: TreatmentStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING",   label: "Chờ áp dụng" },
  { value: "APPLYING",  label: "Đang xử lý" },
  { value: "ACTIVE",    label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function PlansPage() {
  const navigate = useNavigate();

  // ── shared filter state ──────────────────────────────────────────────────
  const [viewTab, setViewTab] = useState<ViewTab>("my");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [applyStatusFilter, setApplyStatusFilter] = useState<TreatmentStatus | "">("")

  // ── my-plans-only state ──────────────────────────────────────────────────
  const [plantId, setPlantId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PlanResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<import("../shared/types").PlanApplyResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApplyOpen, setBulkApplyOpen] = useState(false);
  const [bulkApplyCustomOpen, setBulkApplyCustomOpen] = useState(false);
  const [bulkStatusChip, setBulkStatusChip] = useState<TreatmentStatus | "">("");
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // ── public-plans-only state ──────────────────────────────────────────────
  const [applyTarget, setApplyTarget] = useState<PlanResponse | null>(null);

  // ── data ─────────────────────────────────────────────────────────────────
  const myPlansQuery  = useMyPlans({ plantId: plantId || undefined, search: search || undefined, page, size: pageSize });
  const pubPlansQuery = usePublicPlans({ search: search || undefined, page, size: pageSize } satisfies PublicPlanListParams);
  const myAppliesQuery = useMyApplies({ status: applyStatusFilter || undefined, page, size: pageSize });
  const plantsQuery   = usePlants();
  const profileQuery  = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery    = useFarmPlots(ownerProfileId, !!ownerProfileId);

  // ES-powered search for public plans (when search term has >= 2 chars)
  const hasEsSearch = viewTab === "public" && search.trim().length >= 2;
  const esPublicPlansQuery = useSearchPlans(
    { searchTerm: search, isPublic: true, page, size: pageSize },
    hasEsSearch,
  );

  // Map ES search results to PlanResponse shape for PlanCard compatibility
  const esPublicPlans = useMemo(() => {
    if (!hasEsSearch || !esPublicPlansQuery.data) return null;
    const springPage = {
      content: esPublicPlansQuery.data.items.map((item): PlanResponse => ({
        id: item.id,
        planName: item.planName ?? "",
        diseaseName: item.diseaseName ?? "",
        creatorId: item.creatorId ?? "",
        ownerId: item.ownerId ?? "",
        requiredInputs: item.requiredInputs ?? [],
        safetyWarnings: item.safetyWarnings ?? [],
        successIndicators: item.successIndicators ?? "",
        estimatedCost: item.estimatedCost ?? "",
        events: [],
        source: item.source ?? "",
        confidenceScore: item.confidenceScore ?? 0,
        severityLevel: item.severityLevel ?? "",
        applyCount: item.applyCount ?? 0,
        applies: [],
        isPublic: item.isPublic ?? true,
        sourceType: (item.sourceType as any) ?? 'USER_CREATED',
        ownerInfo: null,
        creatorInfo: item.creatorInfo ? {
          id: item.creatorInfo.id ?? "",
          fullName: item.creatorInfo.fullName ?? "",
          avatar: item.creatorInfo.avatar ?? "",
          role: item.creatorInfo.role ?? "",
          specialty: null,
          isVerified: item.creatorInfo.isVerified ?? false,
        } : null,
        createdAt: item.createdAt ?? "",
        lastModifiedAt: "",
        createdBy: "",
        lastModifiedBy: "",
        active: true,
      })),
      totalPages: esPublicPlansQuery.data.totalPages,
      totalElements: esPublicPlansQuery.data.totalItems,
      number: esPublicPlansQuery.data.page,
      size: esPublicPlansQuery.data.size,
    };
    return springPage;
  }, [hasEsSearch, esPublicPlansQuery.data]);

  // Use ES results for public tab when searching, otherwise fall back to MongoDB query
  const effectivePubQuery = hasEsSearch
    ? { ...esPublicPlansQuery, data: esPublicPlans }
    : pubPlansQuery;

  const deletePlan      = useDeletePlanMutation();
  const bulkUpdateApplyStatus = useBulkUpdateApplyStatusMutation();
  const bulkDeletePlans  = useBulkDeletePlansMutation();
  const bulkApplyPlans   = useBulkApplyPlansMutation();
  const bulkApplyCustom  = useBulkApplyCustomMutation();
  const updateApplyStatus = useUpdateApplyStatusMutation();
  const cancelApply     = useCancelApplyMutation();

  const plants    = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const plantById = useMemo(() => new Map(plants.map((p) => [p.id, p])), [plants]);
  const plotById  = useMemo(() => new Map((plotsQuery.data ?? []).map((p) => [p.id, p])), [plotsQuery.data]);

  // Build planId → planName map from myPlans data for applies tab
  const planNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of myPlansQuery.data?.content ?? []) {
      m.set(p.id, p.planName || p.diseaseName || p.id);
    }
    return m;
  }, [myPlansQuery.data]);

  const activeQuery = viewTab === "my" ? myPlansQuery : viewTab === "public" ? effectivePubQuery : myAppliesQuery;
  const paginatedPlans = viewTab !== "applied" ? (activeQuery.data?.content ?? []) : [];
  const paginatedApplies = viewTab === "applied" ? (myAppliesQuery.data?.content ?? []) : [];
  const totalPages = activeQuery.data?.totalPages ?? 0;

  // Reset page & selection when tab / filters change
  useEffect(() => { setPage(0); setSelectedIds(new Set()); }, [viewTab, search, plantId, pageSize, applyStatusFilter]);

  // ── my-plans helpers ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deletePlan.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allPageSelected  = paginatedPlans.length > 0 && paginatedPlans.every((p) => selectedIds.has(p.id));
  const somePageSelected = paginatedPlans.some((p) => selectedIds.has(p.id)) && !allPageSelected;

  const handleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => { const n = new Set(prev); paginatedPlans.forEach((p) => n.delete(p.id)); return n; });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...paginatedPlans.map((p) => p.id)]));
    }
  };

  const clearSelection = () => { setSelectedIds(new Set()); setBulkStatusChip(""); };

  // ── Empty state messages ─────────────────────────────────────────────────
  const emptyTitle = viewTab === "public"
    ? (search ? "Không tìm thấy kế hoạch cộng đồng phù hợp" : "Chưa có kế hoạch cộng đồng")
    : viewTab === "applied"
      ? "Chưa có kế hoạch đã áp dụng"
      : "Chưa có kế hoạch điều trị";

  const emptyDesc = viewTab === "public"
    ? "Các kế hoạch được chia sẻ công khai sẽ xuất hiện tại đây để bạn tham khảo và áp dụng."
    : viewTab === "applied"
      ? "Khi bạn áp dụng kế hoạch vào vườn hoặc cây trồng, danh sách sẽ hiển thị tại đây."
      : "Khi tạo kế hoạch từ AI hoặc chuyên gia tư vấn, danh sách sẽ hiển thị tại đây.";

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5">

      {/* ── Header ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            Treatment plans
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            Kế hoạch điều trị
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Quản lý kế hoạch cá nhân hoặc khám phá kế hoạch cộng đồng từ các nông dân khác.
          </p>
        </div>
        {viewTab === "my" && (
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
        )}
      </header>

      {/* ── View Tab Switcher ── */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 w-fit">
        {([
          { key: "my" as const, icon: Lock, label: "Kế hoạch của tôi" },
          { key: "applied" as const, icon: Play, label: "Đã áp dụng" },
          { key: "public" as const, icon: Globe, label: "Cộng đồng" },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setViewTab(key)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              viewTab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Community Plans info banner ── */}
      {viewTab === "public" && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <p className="text-sm font-semibold text-blue-700">
            Đây là các kế hoạch điều trị được chia sẻ công khai bởi cộng đồng nông dân.
            Bạn có thể áp dụng chúng trực tiếp vào cây trồng hoặc lô đất của mình.
          </p>
        </div>
      )}
      {/* ── Applied Plans: status filter + info banner ── */}
      {viewTab === "applied" && (
        <>
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <Play className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-700">
              Danh sách các kế hoạch bạn đã áp dụng vào vườn hoặc cây trồng. Theo dõi trạng thái từng lần áp dụng tại đây.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "" as const, label: "Tất cả" },
              { value: "PENDING" as const, label: "Chờ xử lý" },
              { value: "APPLYING" as const, label: "Đang áp dụng" },
              { value: "ACTIVE" as const, label: "Đang thực hiện" },
              { value: "COMPLETED" as const, label: "Hoàn thành" },
              { value: "CANCELLED" as const, label: "Đã hủy" },
            ].map(({ value, label }) => (
              <button
                key={value || "all"}
                type="button"
                onClick={() => setApplyStatusFilter(value)}
                className={`rounded-2xl border px-4 py-2 text-sm font-bold transition-all ${
                  applyStatusFilter === value
                    ? "border-[#245A34] bg-[#245A34] text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}


      {/* ── Filter card ── */}
      <FilterCard viewMode={viewMode} onViewModeChange={setViewMode}>
        <div className={`grid grid-cols-1 gap-4 ${viewTab === "my" ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
          <label htmlFor="plan-search" className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Tìm kiếm</span>
            <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input
                id="plan-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={viewTab === "my" ? "Tên bệnh, câu hỏi, RAG ID..." : "Tên bệnh, tên kế hoạch..."}
                className="h-12 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              />
            </div>
          </label>

          {viewTab === "my" && (
            <div className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">Cây trồng</span>
              <Select
                className="mt-2"
                value={plantId}
                onChange={(v) => setPlantId(String(v))}
                options={[
                  { value: "", label: "Tất cả cây" },
                  ...plants.map((p) => ({ value: p.id, label: p.nickName || p.plantNumber || p.id })),
                ]}
                placeholder="Tất cả cây"
              />
            </div>
          )}
        </div>
      </FilterCard>

      {/* ── My Plans: selection + bulk actions ── */}
      {viewTab === "my" && paginatedPlans.length > 0 && !myPlansQuery.isLoading && (
        <div className="sticky top-4 z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span
                role="checkbox"
                aria-checked={allPageSelected ? true : somePageSelected || selectedIds.size > 0 ? "mixed" : false}
                onClick={handleSelectAll}
                className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all ${
                  allPageSelected || somePageSelected || selectedIds.size > 0
                    ? "border-[#245A34] bg-[#245A34]"
                    : "border-slate-300 bg-white hover:border-[#245A34]"
                }`}
              >
                {allPageSelected
                  ? <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  : somePageSelected || selectedIds.size > 0
                    ? <Minus className="h-3 w-3 text-white" strokeWidth={3} />
                    : null}
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {selectedIds.size > 0
                  ? `${selectedIds.size} / ${paginatedPlans.length} kế hoạch đã chọn`
                  : `${paginatedPlans.length} kế hoạch`}
              </span>
              {selectedIds.size > 0 && !allPageSelected && (
                <button type="button" onClick={handleSelectAll} className="text-xs font-semibold text-[#245A34] hover:underline">
                  Chọn trang này
                </button>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button type="button" onClick={clearSelection} className="text-xs font-semibold text-slate-400 hover:text-slate-600">
                Bỏ chọn
              </button>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="rounded-2xl bg-[#245A34] px-4 py-3 shadow-xl shadow-[#245A34]/20">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-bold text-white">{selectedIds.size} kế hoạch đã chọn</span>
                </div>
                <div className="h-5 w-px bg-white/20" />
                <span className="text-xs font-semibold text-white/60">Đổi trạng thái:</span>
                <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
                  {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setBulkStatusChip(bulkStatusChip === o.value ? "" : o.value as TreatmentStatus)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                        bulkStatusChip === o.value ? "bg-white text-[#245A34] shadow-sm" : "text-white/80 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!bulkStatusChip || bulkUpdateApplyStatus.isPending}
                  onClick={() => void bulkUpdateApplyStatus.mutateAsync({ planIds: [...selectedIds], status: bulkStatusChip as TreatmentStatus }).then(clearSelection)}
                  className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#245A34] hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkUpdateApplyStatus.isPending ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} /> : <Check className="h-3 w-3" strokeWidth={3} />}
                  Áp dụng
                </button>
                <div className="h-5 w-px bg-white/20" />
                <button
                  type="button"
                  onClick={() => setBulkApplyOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"
                >
                  <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Áp dụng cùng lúc
                </button>
                <button
                  type="button"
                  onClick={() => setBulkApplyCustomOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"
                >
                  <Layers className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Áp dụng riêng biệt
                </button>
                <div className="h-5 w-px bg-white/20" />
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
                <button type="button" onClick={clearSelection} className="rounded-xl p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white">
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {activeQuery.isLoading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-56 animate-pulse rounded-[1.75rem] bg-slate-100" />)}
        </div>
      )}

      {/* ── Error state ── */}
      {activeQuery.isError && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-red-700">Không tải được danh sách.</p>
            <button type="button" onClick={() => void activeQuery.refetch()} className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">
              <RefreshCw className="mr-2 h-4 w-4" />Tải lại
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!activeQuery.isLoading && !activeQuery.isError && viewTab !== "applied" && paginatedPlans.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          {viewTab === "public" ? <Globe className="mx-auto h-10 w-10 text-slate-300" /> : <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />}
          <h3 className="mt-4 text-xl font-black text-slate-900">{emptyTitle}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">{emptyDesc}</p>
        </div>
      )}
      {!activeQuery.isLoading && !activeQuery.isError && viewTab === "applied" && paginatedApplies.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <Play className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-xl font-black text-slate-900">{emptyTitle}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">{emptyDesc}</p>
        </div>
      )}

      {/* ── Plan grid (my / public) ── */}
      {viewTab !== "applied" && (
        <PagedGrid
          viewMode={viewMode}
          page={page}
          totalPages={totalPages}
          totalElements={paginatedPlans.length}
          itemLabel="kế hoạch"
          onPageChange={setPage}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
        >
          {paginatedPlans.map((plan: PlanResponse) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              plotName={null}
              selected={viewTab === "my" ? selectedIds.has(plan.id) : false}
              onToggleSelect={viewTab === "my" ? toggleSelect : undefined}
              onDelete={viewTab === "my" ? setDeleteTarget : undefined}
              onApply={viewTab === "public" ? () => setApplyTarget(plan) : undefined}
              detailUrl={ROUTES.DASHBOARD.PLAN_DETAIL(plan.id)}
              variant={viewMode}
              isPublicView={viewTab === "public"}
            />
          ))}
        </PagedGrid>
      )}

      {/* ── Applied plans grid ── */}
      {viewTab === "applied" && paginatedApplies.length > 0 && (
        <PagedGrid
          viewMode={viewMode}
          page={page}
          totalPages={totalPages}
          totalElements={paginatedApplies.length}
          itemLabel="áp dụng"
          onPageChange={setPage}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
        >
          {paginatedApplies.map((apply) => (
            <PlanApplyCard
              key={apply.id}
              apply={apply}
              planName={planNameById.get(apply.planId)}
              variant={viewMode}
              onStatusChange={(applyId, newStatus) =>
                void updateApplyStatus.mutateAsync({ applyId, status: newStatus })
              }
              onCancelApply={setCancelTarget}
            />
          ))}
        </PagedGrid>
      )}

      {/* ── My Plans dialogs ── */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          title="Xóa kế hoạch điều trị"
          description={`Bạn có chắc muốn xóa kế hoạch "${deleteTarget.diseaseName || deleteTarget.id}"?`}
          isDeleting={deletePlan.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
      {showBulkDeleteConfirm && (
        <ConfirmDeleteDialog
          title="Xóa kế hoạch đã chọn"
          description={`Bạn có chắc muốn xóa ${selectedIds.size} kế hoạch đã chọn?`}
          isDeleting={bulkDeletePlans.isPending}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          onConfirm={() => void bulkDeletePlans.mutateAsync([...selectedIds]).then(() => { clearSelection(); setShowBulkDeleteConfirm(false); })}
        />
      )}
      {bulkApplyOpen && (
        <BulkApplyPlanDialog
          planIds={[...selectedIds]}
          isSubmitting={bulkApplyPlans.isPending}
          onClose={() => setBulkApplyOpen(false)}
          onSubmit={(payload: PlanApplyRequest) =>
            void bulkApplyPlans.mutateAsync({ planIds: [...selectedIds], payload }).then(() => { setBulkApplyOpen(false); clearSelection(); })
          }
        />
      )}
      {bulkApplyCustomOpen && (
        <BulkApplyCustomDialog
          plans={paginatedPlans.filter((p) => selectedIds.has(p.id))}
          isSubmitting={bulkApplyCustom.isPending}
          onClose={() => setBulkApplyCustomOpen(false)}
          onSubmit={(payload) =>
            void bulkApplyCustom.mutateAsync(payload).then(() => { setBulkApplyCustomOpen(false); clearSelection(); })
          }
        />
      )}

      {/* ── Public Plans: apply dialog ── */}
      {applyTarget && (
        <ApplyPlanDialog
          plan={applyTarget}
          isSubmitting={bulkApplyPlans.isPending}
          onClose={() => setApplyTarget(null)}
          onSubmit={(payload) =>
            void bulkApplyPlans.mutateAsync({ planIds: [applyTarget.id], payload }).then(() => setApplyTarget(null))
          }
        />
      )}

      {/* ── Cancel apply dialog ── */}
      {cancelTarget && (
        <CancelApplyDialog
          apply={cancelTarget}
          isCancelling={cancelApply.isPending}
          onClose={() => setCancelTarget(null)}
          onConfirm={() =>
            void cancelApply.mutateAsync(cancelTarget.id).then(() => setCancelTarget(null))
          }
        />
      )}
    </div>
  );
}

export default PlansPage;
