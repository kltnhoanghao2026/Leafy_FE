import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, RefreshCw, Search, Trash2, Sprout, MapPin, BarChart2, Clock } from "lucide-react";
import { ConfirmDeleteDialog } from "../../../farm-management/components/ConfirmDeleteDialog";
import { useFarmPlots, useFarmZones } from "../../../farm-management/queries";
import { useMyProfile } from "../../../settings/queries";
import { ROUTES } from "../../../../lib/routes";
import {
  useDeletePlanMutation,
  useMyPlans,
  usePlants,
  useUpdatePlanStatusMutation,
} from "../..";
import type { PlanResponse, TreatmentStatus } from "../../shared/types";
import { formatDate, TREATMENT_STATUS_LABELS } from "../../shared/components/displayUtils";
import { Select } from "../../../../components/ui/Select";

const STATUS_OPTIONS: Array<{ value: TreatmentStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "ACTIVE", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE:    "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-emerald-50 text-[#245A34] ring-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const SEVERITY_LABEL: Record<string, string> = {
  LOW: "Nhẹ",
  MEDIUM: "Trung bình",
  HIGH: "Nghiêm trọng",
  CRITICAL: "Rất nghiêm trọng",
};

const SEVERITY_STYLE: Record<string, string> = {
  LOW: "text-emerald-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  CRITICAL: "text-red-600",
};

export function PlansPage() {
  const [status, setStatus] = useState<TreatmentStatus | "">("");
  const [plantId, setPlantId] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PlanResponse | null>(null);

  const plansQuery = useMyPlans({ status });
  const plantsQuery = usePlants();
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const updateStatus = useUpdatePlanStatusMutation();
  const deletePlan = useDeletePlanMutation();

  const plants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const plantById = useMemo(
    () => new Map(plants.map((plant) => [plant.id, plant])),
    [plants],
  );
  const plotById = useMemo(
    () => new Map((plotsQuery.data ?? []).map((plot) => [plot.id, plot])),
    [plotsQuery.data],
  );

  const filteredPlans = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (plansQuery.data ?? []).filter((plan: PlanResponse) => {
      const matchesPlant = !plantId || plan.plantId === plantId;
      const matchesSearch =
        !normalizedSearch ||
        [plan.diseaseName, plan.question, plan.ragPlanId]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedSearch));
      return matchesPlant && matchesSearch;
    });
  }, [plansQuery.data, plantId, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deletePlan.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
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
        <Link
          to={ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR}
          className="inline-flex items-center justify-center rounded-2xl border border-[#245A34] bg-white px-5 py-3 text-sm font-bold text-[#245A34] hover:bg-green-50"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Xem lịch chăm sóc
        </Link>
      </header>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
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
              Trạng thái
            </span>
            <Select
              className="mt-2"
              value={status}
              onChange={(v) => setStatus(v as TreatmentStatus | "")}
              options={STATUS_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>
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
      </section>

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
            Chưa có kế hoạch điều trị
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Khi tạo kế hoạch từ AI hoặc plant-management, danh sách sẽ hiển thị tại đây.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredPlans.map((plan: PlanResponse) => {
          const plant = plan.plantId ? plantById.get(plan.plantId) : null;
          const plot = plan.farmPlotId ? plotById.get(plan.farmPlotId) : null;
          return (
            <article key={plan.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-start justify-between gap-3 p-5 pb-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-slate-900">
                    {plan.diseaseName || "Kế hoạch điều trị"}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400">
                    {plan.question || plan.successIndicators || "Kế hoạch AI chỉ mang tính hỗ trợ"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${
                  STATUS_STYLE[plan.status] ?? "bg-slate-100 text-slate-500 ring-slate-200"
                }`}>
                  {(TREATMENT_STATUS_LABELS as Record<string, string>)[plan.status] ?? plan.status}
                </span>
              </div>

              {/* Divider */}
              <div className="mx-5 border-t border-slate-100" />

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-xs sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Sprout className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="font-black uppercase tracking-wide text-slate-400">Cây</p>
                    <p className="truncate font-bold text-slate-800">
                      {plant?.nickName || plant?.plantNumber || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="font-black uppercase tracking-wide text-slate-400">Vườn</p>
                    <p className="truncate font-bold text-slate-800">
                      {plot?.name || "—"}
                    </p>
                  </div>
                </div>
                <ZoneTile farmPlotId={plan.farmPlotId} farmZoneId={plan.farmZoneId} />
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="font-black uppercase tracking-wide text-slate-400">Mức độ</p>
                    <p className={`truncate font-bold ${
                      SEVERITY_STYLE[plan.severityLevel ?? ""] ?? "text-slate-800"
                    }`}>
                      {SEVERITY_LABEL[plan.severityLevel ?? ""] || plan.severityLevel || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="font-black uppercase tracking-wide text-slate-400">Số lịch</p>
                    <p className="truncate font-bold text-slate-800">
                      {plan.plantEventIds?.length ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="font-black uppercase tracking-wide text-slate-400">Tạo lúc</p>
                    <p className="truncate font-bold text-slate-800">{formatDate(plan.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="mt-auto flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                <Link
                  to={ROUTES.DASHBOARD.PLAN_DETAIL(plan.id)}
                  className="inline-flex items-center justify-center rounded-xl bg-[#245A34] px-4 py-2 text-xs font-bold text-white hover:bg-[#1b432a]"
                >
                  Xem chi tiết
                </Link>
                <div className="flex-1">
                  <Select
                    value={plan.status}
                    onChange={(v) =>
                      void updateStatus.mutateAsync({
                        planId: plan.id,
                        status: v as TreatmentStatus,
                      })
                    }
                    options={STATUS_OPTIONS.filter((option) => option.value).map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(plan)}
                  className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                  aria-label="Xóa kế hoạch"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {deleteTarget ? (
        <ConfirmDeleteDialog
          title="Xóa kế hoạch điều trị"
          description={`Bạn có chắc muốn xóa kế hoạch "${deleteTarget.diseaseName || deleteTarget.id}"?`}
          isDeleting={deletePlan.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}

export default PlansPage;

function ZoneTile({
  farmPlotId,
  farmZoneId,
}: {
  farmPlotId?: string | null;
  farmZoneId?: string | null;
}) {
  const zonesQuery = useFarmZones(farmPlotId ?? "", Boolean(farmPlotId));
  const zoneName = farmZoneId
    ? (zonesQuery.data ?? []).find((zone) => zone.id === farmZoneId)?.zoneName ||
      farmZoneId
    : "Chưa gắn khu";

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="font-black uppercase tracking-wide text-slate-400">Khu v\u1ef1c</p>
        <p className="truncate font-bold text-slate-800">{zoneName}</p>
      </div>
    </div>
  );
}
