import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, RefreshCw, Search, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "../../farm-management/components/ConfirmDeleteDialog";
import { ROUTES } from "../../../lib/routes";
import {
  useDeleteTreatmentPlanMutation,
  useMyTreatmentPlans,
  usePlants,
  useUpdateTreatmentPlanStatusMutation,
} from "../queries";
import type { TreatmentPlanResponse, TreatmentStatus } from "../types";
import { formatDate, TREATMENT_STATUS_LABELS } from "../components/displayUtils";

const STATUS_OPTIONS: Array<{ value: TreatmentStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "ACTIVE", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export function TreatmentPlansPage() {
  const [status, setStatus] = useState<TreatmentStatus | "">("");
  const [plantId, setPlantId] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TreatmentPlanResponse | null>(null);

  const plansQuery = useMyTreatmentPlans({ status });
  const plantsQuery = usePlants();
  const updateStatus = useUpdateTreatmentPlanStatusMutation();
  const deletePlan = useDeleteTreatmentPlanMutation();

  const plants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const plantById = useMemo(
    () => new Map(plants.map((plant) => [plant.id, plant])),
    [plants],
  );

  const filteredPlans = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (plansQuery.data ?? []).filter((plan) => {
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
          <label htmlFor="status-filter" className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Trạng thái
            </span>
            <select
              id="status-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value as TreatmentStatus | "")}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="plant-filter" className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Cây trồng
            </span>
            <select
              id="plant-filter"
              value={plantId}
              onChange={(event) => setPlantId(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
            >
              <option value="">Tất cả cây</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.nickName || plant.plantNumber || plant.id}
                </option>
              ))}
            </select>
          </label>
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
        {filteredPlans.map((plan) => {
          const plant = plan.plantId ? plantById.get(plan.plantId) : null;
          return (
            <article key={plan.id} className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {plan.diseaseName || "Kế hoạch điều trị"}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">
                    {plan.question || plan.successIndicators || "Kế hoạch AI chỉ mang tính hỗ trợ, cần kiểm tra thực tế trước khi áp dụng."}
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-[#245A34]">
                  {TREATMENT_STATUS_LABELS[plan.status] ?? plan.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-black uppercase tracking-wide text-slate-400">Cây</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {plant?.nickName || plant?.plantNumber || plan.plantId || "Chưa gắn cây"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-black uppercase tracking-wide text-slate-400">Số lịch</p>
                  <p className="mt-1 font-bold text-slate-800">{plan.plantEventIds?.length ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-black uppercase tracking-wide text-slate-400">Mức độ</p>
                  <p className="mt-1 font-bold text-slate-800">{plan.severityLevel || "Chưa rõ"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-black uppercase tracking-wide text-slate-400">Tạo lúc</p>
                  <p className="mt-1 font-bold text-slate-800">{formatDate(plan.createdAt)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={ROUTES.DASHBOARD.TREATMENT_PLAN_DETAIL(plan.id)}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
                >
                  Xem chi tiết
                </Link>
                <select
                  aria-label={`Đổi trạng thái ${plan.diseaseName || plan.id}`}
                  value={plan.status}
                  onChange={(event) =>
                    void updateStatus.mutateAsync({
                      planId: plan.id,
                      status: event.target.value as TreatmentStatus,
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                >
                  {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(plan)}
                  className="inline-flex items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
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

export default TreatmentPlansPage;
