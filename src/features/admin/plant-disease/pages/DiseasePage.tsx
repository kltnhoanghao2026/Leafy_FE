import { useState } from "react";
import { FlaskConical, Trash2 } from "lucide-react";
import { AdminTable } from "../../../../components/admin/AdminTable";
import { AdminPagination } from "../../../../components/admin/AdminPagination";
import toast from "react-hot-toast";
import {
  useAdminPlans,
  useDeletePlan,
} from "../api/";
import type { TreatmentStatus, PlanListParams, PlanDto } from "../types";

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

// ============================================================================
// Utilities
// ============================================================================

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <div
      className="grid gap-4 items-center px-4 py-3 animate-pulse border-b border-slate-100 last:border-0"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-100 rounded w-3/4" />
      ))}
    </div>
  );
}

interface FilterGroupProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterGroupProps<T>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-slate-500 shrink-0">
        {label}:
      </span>
      <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors border-r border-slate-200 last:border-r-0 ${
              value === opt.value
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ============================================================================
// Treatment Plans panel
// ============================================================================

type TreatmentStatusFilter = "all" | TreatmentStatus;

function TreatmentPlansPanel() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [statusFilter, setStatusFilter] =
    useState<TreatmentStatusFilter>("all");

  const deleteMutation = useDeletePlan();

  const params: PlanListParams = {
    page,
    size: pageSize,
    ...(statusFilter !== "all"
      ? { status: statusFilter as TreatmentStatus }
      : {}),
  };
  const { data: pageData, isLoading, isError } = useAdminPlans(params);

  const plans = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  function handleStatusChange(v: TreatmentStatusFilter) {
    setStatusFilter(v);
    setPage(0);
  }

  function handleDelete(id: string, disease: string) {
    if (!window.confirm(`Xóa kế hoạch điều trị bệnh "${disease}"?`)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Đã xóa kế hoạch"),
      onError: () => toast.error("Xóa thất bại"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <FilterGroup<TreatmentStatusFilter>
          label="Trạng thái"
          value={statusFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "PENDING", label: "Chờ duyệt" },
            { value: "ACTIVE", label: "Đang xử lý" },
            { value: "COMPLETED", label: "Hoàn thành" },
            { value: "CANCELLED", label: "Đã hủy" },
          ]}
          onChange={handleStatusChange}
        />
        {!isLoading && (
          <span className="text-sm text-slate-400">
            {totalElements} kế hoạch
          </span>
        )}
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="kế hoạch"
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />

      <AdminTable
        gridCols="grid-cols-[1.5fr_80px_100px_100px_110px_120px]"
        columns={[
          { label: "Bệnh" },
          { label: "Mức độ" },
          { label: "Khẩn cấp" },
          { label: "Áp dụng" },
          { label: "Ngày tạo" },
          { label: "Hành động" },
        ]}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Không thể tải dữ liệu kế hoạch điều trị"
        isEmpty={plans.length === 0}
        emptyMessage="Không có kế hoạch điều trị nào"
        renderSkeleton={() => <SkeletonRow cols={6} />}
        skeletonCount={8}
      >
        {plans.map((plan: PlanDto) => (
          <div
            key={plan.id}
            className="grid grid-cols-[1.5fr_80px_100px_100px_110px_120px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
          >
            <p className="text-sm font-semibold text-slate-800 truncate">
              {plan.diseaseName}
            </p>
            <p className="text-xs text-slate-500">
              {plan.severityLevel ?? "—"}
            </p>
            <p className="text-xs text-slate-500">{plan.urgency ?? "—"}</p>
            <p className="text-xs text-slate-500">
              {plan.applyCount ?? 0} lần
            </p>
            <p className="text-xs text-slate-500">
              {formatDate(plan.createdAt)}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDelete(plan.id, plan.diseaseName)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </AdminTable>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export function DiseasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-rose-500" strokeWidth={2} />
          Bệnh &amp; Điều trị
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý kế hoạch điều trị bệnh cây trồng
        </p>
      </div>

      <TreatmentPlansPanel />
    </div>
  );
}
