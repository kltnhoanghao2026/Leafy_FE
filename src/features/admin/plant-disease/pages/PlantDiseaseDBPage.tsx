import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  Search,
  Trash2,
  Pencil,
  Plus,
  X,
  Sprout,
  CalendarDays,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { AdminTable } from "../../../../components/admin/AdminTable";
import { AdminPagination } from "../../../../components/admin/AdminPagination";
import { AdminDetailButton } from "../../../../components/admin/AdminDetailButton";
import toast from "react-hot-toast";
import { ROUTES } from "../../../../lib/routes";
import { useAdminPlants, useDeletePlant } from "../api/";
import {
  useAdminSpecies,
  useCreateSpecies,
  useUpdateSpecies,
  useDeleteSpecies,
  useSeedSpeciesFromPerenual,
} from "../api/";
import {
  useAdminPlantEvents,
  useDeletePlantEvent,
} from "../api/";

import type {
  PlantStatus,
  EventType,
  PlantListParams,
  PlantEventListParams,
  SpeciesCreatePayload,
  SpeciesUpdatePayload,
  SpeciesDto,
  SpeciesListParams,
} from "../types";

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

const PLANT_STATUS_LABELS: Record<PlantStatus, string> = {
  ACTIVE: "Đang trồng",
  INACTIVE: "Không hoạt động",
  ARCHIVED: "Đã lưu trữ",
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  IRRIGATION: "Tưới nước",
  NUTRITION: "Bón phân",
  WEED_CONTROL: "Diệt cỏ",
  PRUNING: "Cắt tỉa",
  SCOUTING: "Kiểm tra",
  DISEASE_DETECTED: "Phát hiện bệnh",
  TREATMENT_APPLICATION: "Phun thuốc",
  QUARANTINE: "Cách ly",
  HEALTH_RECOVERY: "Hồi phục",
  PHENOLOGY: "Sinh trưởng",
  REPOT: "Sang chậu",
  HARVEST: "Thu hoạch",
};

// ============================================================================
// Shared utility components
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

function PlantStatusBadge({ status }: { status: PlantStatus }) {
  const styles: Record<PlantStatus, string> = {
    ACTIVE: "bg-green-50 text-green-700 ring-green-200",
    INACTIVE: "bg-slate-100 text-slate-500 ring-slate-200",
    ARCHIVED: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {PLANT_STATUS_LABELS[status]}
    </span>
  );
}

function EventTypeBadge({ type }: { type: EventType }) {
  const dangerTypes: EventType[] = [
    "DISEASE_DETECTED",
    "QUARANTINE",
    "TREATMENT_APPLICATION",
  ];
  const harvestTypes: EventType[] = ["HARVEST"];
  const isDanger = dangerTypes.includes(type);
  const isHarvest = harvestTypes.includes(type);
  const style = isDanger
    ? "bg-red-50 text-red-700 ring-red-200"
    : isHarvest
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-sky-50 text-sky-700 ring-sky-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${style}`}
    >
      {EVENT_TYPE_LABELS[type] ?? type}
    </span>
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
// Species Create/Edit modal
// ============================================================================

interface SpeciesModalProps {
  open: boolean;
  initial?: SpeciesDto | null;
  onClose: () => void;
  onSave: (data: SpeciesCreatePayload) => void;
  isSaving: boolean;
}

const EMPTY_FORM: SpeciesCreatePayload = {
  commonName: "",
  cultivarName: "",
  waterFrequencyDays: undefined,
  lightRequirements: "",
  daysToMaturity: undefined,
  plantingWindow: "",
  plantingSeason: "",
  spacing: undefined,
  expectedYieldKg: undefined,
};

function SpeciesModal({
  open,
  initial,
  onClose,
  onSave,
  isSaving,
}: SpeciesModalProps) {
  const [form, setForm] = useState<SpeciesCreatePayload>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              commonName: initial.commonName ?? "",
              cultivarName: initial.cultivarName ?? "",
              waterFrequencyDays: initial.waterFrequencyDays ?? undefined,
              lightRequirements: initial.lightRequirements ?? "",
              daysToMaturity: initial.daysToMaturity ?? undefined,
              plantingWindow: initial.plantingWindow ?? "",
              plantingSeason: initial.plantingSeason ?? "",
              spacing: initial.spacing ?? undefined,
              expectedYieldKg: initial.expectedYieldKg ?? undefined,
            }
          : EMPTY_FORM,
      );
    }
  }, [open, initial]);

  if (!open) return null;

  function handleChange(
    field: keyof SpeciesCreatePayload,
    value: string | number | undefined,
  ) {
    setForm((prev) => ({ ...prev, [field]: value === "" ? undefined : value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.commonName?.trim()) {
      toast.error("Tên loài là bắt buộc");
      return;
    }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            {initial ? "Chỉnh sửa loài cây" : "Thêm loài cây mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tên loài <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.commonName ?? ""}
              onChange={(e) => handleChange("commonName", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="vd: Cà phê Arabica"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên giống
              </label>
              <input
                type="text"
                value={form.cultivarName ?? ""}
                onChange={(e) => handleChange("cultivarName", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ánh sáng
              </label>
              <input
                type="text"
                value={form.lightRequirements ?? ""}
                onChange={(e) =>
                  handleChange("lightRequirements", e.target.value)
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="vd: Ánh sáng đầy đủ"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Chu kỳ tưới (ngày)
              </label>
              <input
                type="number"
                min={1}
                value={form.waterFrequencyDays ?? ""}
                onChange={(e) =>
                  handleChange(
                    "waterFrequencyDays",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ngày đến thu hoạch
              </label>
              <input
                type="number"
                min={1}
                value={form.daysToMaturity ?? ""}
                onChange={(e) =>
                  handleChange(
                    "daysToMaturity",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mùa vụ
              </label>
              <input
                type="text"
                value={form.plantingSeason ?? ""}
                onChange={(e) => handleChange("plantingSeason", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="vd: Xuân - Hè"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Sản lượng dự kiến (kg)
              </label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.expectedYieldKg ?? ""}
                onChange={(e) =>
                  handleChange(
                    "expectedYieldKg",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Đang lưu..." : initial ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Perenual seed modal
// ============================================================================

interface SeedModalProps {
  open: boolean;
  onClose: () => void;
  onSeed: (startPage: number, pages: number, perPage: number) => void;
  isSeeding: boolean;
}

function SeedModal({ open, onClose, onSeed, isSeeding }: SeedModalProps) {
  const [startPage, setStartPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [perPage, setPerPage] = useState(30);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            Seed từ Perenual API
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Trang bắt đầu
              </label>
              <input
                type="number"
                min={1}
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số trang
              </label>
              <input
                type="number"
                min={1}
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mỗi trang
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => onSeed(startPage, pages, perPage)}
              disabled={isSeeding}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSeeding ? "Đang seed..." : "Bắt đầu seed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Species
// ============================================================================

function SpeciesTab() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SpeciesDto | null>(null);
  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  const params: SpeciesListParams = { page, size: pageSize };
  const { data: pageData, isLoading, isError } = useAdminSpecies(params);

  const createMutation = useCreateSpecies();
  const updateMutation = useUpdateSpecies();
  const deleteMutation = useDeleteSpecies();
  const seedMutation = useSeedSpeciesFromPerenual();

  const species = pageData?.content ?? [];
  const filteredSpecies = debouncedSearch
    ? species.filter(
        (s) =>
          s.commonName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (s.cultivarName ?? "")
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      )
    : species;
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }
  function openEdit(s: SpeciesDto) {
    setEditTarget(s);
    setModalOpen(true);
  }

  function handleSave(data: SpeciesCreatePayload | SpeciesUpdatePayload) {
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, data },
        {
          onSuccess: () => {
            toast.success("Cập nhật loài thành công");
            setModalOpen(false);
          },
          onError: () => toast.error("Cập nhật thất bại"),
        },
      );
    } else {
      createMutation.mutate(data as SpeciesCreatePayload, {
        onSuccess: () => {
          toast.success("Thêm loài thành công");
          setModalOpen(false);
        },
        onError: () => toast.error("Thêm loài thất bại"),
      });
    }
  }

  function handleDelete(id: string, name: string) {
    if (
      !window.confirm(`Xóa loài "${name}"? Hành động này không thể hoàn tác.`)
    )
      return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Đã xóa loài"),
      onError: () => toast.error("Xóa loài thất bại"),
    });
  }

  function handleSeed(startPage: number, pages: number, perPage: number) {
    seedMutation.mutate(
      { startPage, pages, perPage },
      {
        onSuccess: (res) => {
          const d = res.data.data as
            | { created?: number; skipped?: number }
            | undefined;
          toast.success(
            `Seed thành công: ${d?.created ?? 0} mới, ${d?.skipped ?? 0} bỏ qua`,
          );
          setSeedModalOpen(false);
        },
        onError: () => toast.error("Seed thất bại"),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên loài hoặc tên giống..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
          />
        </div>
        {!isLoading && (
          <span className="text-sm text-slate-400 shrink-0">
            {totalElements} loài
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSeedModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Sprout className="w-3.5 h-3.5" />
            Seed từ Perenual
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm loài
          </button>
        </div>
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="loài"
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />

      <AdminTable
        gridCols="grid-cols-[2fr_1.5fr_80px_120px_120px_100px]"
        columns={[
          { label: "Tên loài" },
          { label: "Giống" },
          { label: "Tưới (ngày)" },
          { label: "Ánh sáng" },
          { label: "Ngày TH" },
          { label: "Hành động" },
        ]}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Không thể tải dữ liệu loài cây"
        isEmpty={filteredSpecies.length === 0}
        emptyMessage={
          debouncedSearch
            ? "Không tìm thấy loài phù hợp"
            : "Chưa có loài cây nào"
        }
        emptyIcon={<Leaf className="w-8 h-8" strokeWidth={1.5} />}
        renderSkeleton={() => <SkeletonRow cols={6} />}
        skeletonCount={8}
      >
        {filteredSpecies.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-[2fr_1.5fr_80px_120px_120px_100px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
          >
            <div className="min-w-0">
              <button
                onClick={() => navigate(ROUTES.ADMIN.SPECIES_DETAIL(s.id))}
                className="text-sm font-semibold text-slate-800 hover:text-emerald-600 truncate transition-colors text-left w-full"
              >
                {s.commonName}
              </button>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {s.cultivarName ?? "—"}
            </p>
            <p className="text-sm text-slate-700">
              {s.waterFrequencyDays ?? "—"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {s.lightRequirements ?? "—"}
            </p>
            <p className="text-sm text-slate-700">
              {s.daysToMaturity ? `${s.daysToMaturity} ngày` : "—"}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openEdit(s)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Chỉnh sửa"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(s.id, s.commonName)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Xóa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </AdminTable>

      <SpeciesModal
        open={modalOpen}
        initial={editTarget}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
      <SeedModal
        open={seedModalOpen}
        onClose={() => setSeedModalOpen(false)}
        onSeed={handleSeed}
        isSeeding={seedMutation.isPending}
      />
    </div>
  );
}

// ============================================================================
// Tab: Plants
// ============================================================================

type PlantStatusFilter = "all" | PlantStatus;

function PlantsTab() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<PlantStatusFilter>("all");
  const deleteMutation = useDeletePlant();

  const params: PlantListParams = {
    page,
    size: pageSize,
    ...(statusFilter !== "all" ? { status: statusFilter as PlantStatus } : {}),
  };
  const { data: pageData, isLoading, isError } = useAdminPlants(params);

  const plants = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  function handleStatusChange(v: PlantStatusFilter) {
    setStatusFilter(v);
    setPage(0);
  }

  function handleDelete(id: string, number: string) {
    if (
      !window.confirm(`Xóa cây "${number}"? Hành động này không thể hoàn tác.`)
    )
      return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Đã xóa cây trồng"),
      onError: () => toast.error("Xóa thất bại"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <FilterGroup<PlantStatusFilter>
          label="Trạng thái"
          value={statusFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "ACTIVE", label: "Đang trồng" },
            { value: "INACTIVE", label: "Không hoạt động" },
            { value: "ARCHIVED", label: "Lưu trữ" },
          ]}
          onChange={handleStatusChange}
        />
        {!isLoading && (
          <span className="text-sm text-slate-400">{totalElements} cây</span>
        )}
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="cây"
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />

      <AdminTable
        gridCols="grid-cols-[120px_1fr_1fr_130px_120px_130px]"
        columns={[
          { label: "Mã cây" },
          { label: "Loài" },
          { label: "Farm Plot" },
          { label: "Trạng thái" },
          { label: "Ngày trồng" },
          { label: "Hành động", align: "right" },
        ]}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Không thể tải dữ liệu cây trồng"
        isEmpty={plants.length === 0}
        emptyMessage="Không có cây trồng nào"
        emptyIcon={<Sprout className="w-8 h-8" strokeWidth={1.5} />}
        renderSkeleton={() => <SkeletonRow cols={6} />}
        skeletonCount={8}
      >
        {plants.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-[120px_1fr_1fr_130px_120px_130px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
          >
            <p className="text-xs font-mono font-semibold text-slate-700 truncate">
              {p.plantNumber}
            </p>
            <p className="text-xs text-slate-500 truncate">{p.speciesId}</p>
            <p className="text-xs text-slate-500 truncate">
              {p.farmPlotId ?? "—"}
            </p>
            <PlantStatusBadge status={p.plantStatus} />
            <p className="text-xs text-slate-500">
              {formatDate(p.plantingDate)}
            </p>
            <div className="flex justify-end items-center gap-1">
              <AdminDetailButton
                onClick={() => navigate(ROUTES.ADMIN.PLANT_DETAIL(p.id))}
                label={null}
              />
              <button
                onClick={() => handleDelete(p.id, p.plantNumber)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Xóa"
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
// Tab: Plant Events
// ============================================================================

type EventTypeFilter = "all" | EventType;
type PlannedFilter = "all" | "planned" | "immediate";

type EventCategory = "ROUTINE_CARE" | "HEALTH_MEDICAL" | "GROWTH_LIFECYCLE";

const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  ROUTINE_CARE: "Chăm sóc thường ngày",
  HEALTH_MEDICAL: "Sức khỏe & Y tế",
  GROWTH_LIFECYCLE: "Sinh trưởng & Vòng đời",
};

const EVENT_CATEGORY_STYLES: Record<
  EventCategory,
  { label: string; active: string; inactive: string }
> = {
  ROUTINE_CARE: {
    label: "text-blue-600",
    active: "bg-blue-600 text-white border-blue-600",
    inactive: "text-slate-600 border-slate-200 hover:bg-slate-50",
  },
  HEALTH_MEDICAL: {
    label: "text-orange-600",
    active: "bg-orange-500 text-white border-orange-500",
    inactive: "text-slate-600 border-slate-200 hover:bg-slate-50",
  },
  GROWTH_LIFECYCLE: {
    label: "text-emerald-600",
    active: "bg-emerald-600 text-white border-emerald-600",
    inactive: "text-slate-600 border-slate-200 hover:bg-slate-50",
  },
};

const EVENT_CATEGORY_MAP: Record<EventType, EventCategory> = {
  IRRIGATION: "ROUTINE_CARE",
  NUTRITION: "ROUTINE_CARE",
  WEED_CONTROL: "ROUTINE_CARE",
  PRUNING: "ROUTINE_CARE",
  SCOUTING: "HEALTH_MEDICAL",
  DISEASE_DETECTED: "HEALTH_MEDICAL",
  TREATMENT_APPLICATION: "HEALTH_MEDICAL",
  QUARANTINE: "HEALTH_MEDICAL",
  HEALTH_RECOVERY: "HEALTH_MEDICAL",
  PHENOLOGY: "GROWTH_LIFECYCLE",
  REPOT: "GROWTH_LIFECYCLE",
  HARVEST: "GROWTH_LIFECYCLE",
};

const CATEGORY_ORDER: EventCategory[] = [
  "ROUTINE_CARE",
  "HEALTH_MEDICAL",
  "GROWTH_LIFECYCLE",
];

const GROUPED_EVENT_TYPES = CATEGORY_ORDER.map((category) => ({
  category,
  types: (Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).filter(
    ([type]) => EVENT_CATEGORY_MAP[type] === category,
  ),
}));

const PLANNED_FILTER_OPTIONS: { value: PlannedFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "planned", label: "Lịch kế hoạch" },
  { value: "immediate", label: "Tức thời" },
];

function PlantEventsTab() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [filterOpen, setFilterOpen] = useState(false);

  // Pending (draft) filter state — only applied when the modal is confirmed
  const [draftEventType, setDraftEventType] = useState<EventTypeFilter>("all");
  const [draftPlanned, setDraftPlanned] = useState<PlannedFilter>("all");
  const [draftFarmPlotId, setDraftFarmPlotId] = useState("");

  // Applied filter state — used in the actual query
  const [eventTypeFilter, setEventTypeFilter] =
    useState<EventTypeFilter>("all");
  const [plannedFilter, setPlannedFilter] = useState<PlannedFilter>("all");
  const [farmPlotIdFilter, setFarmPlotIdFilter] = useState("");

  const deleteMutation = useDeletePlantEvent();

  const activeFilterCount = [
    eventTypeFilter !== "all",
    plannedFilter !== "all",
    farmPlotIdFilter !== "",
  ].filter(Boolean).length;

  function openFilter() {
    // Seed draft from current applied values
    setDraftEventType(eventTypeFilter);
    setDraftPlanned(plannedFilter);
    setDraftFarmPlotId(farmPlotIdFilter);
    setFilterOpen(true);
  }

  function applyFilter() {
    setEventTypeFilter(draftEventType);
    setPlannedFilter(draftPlanned);
    setFarmPlotIdFilter(draftFarmPlotId.trim());
    setPage(0);
    setFilterOpen(false);
  }

  function resetFilter() {
    setDraftEventType("all");
    setDraftPlanned("all");
    setDraftFarmPlotId("");
  }

  const params: PlantEventListParams = {
    page,
    size: pageSize,
    ...(eventTypeFilter !== "all"
      ? { eventType: eventTypeFilter as EventType }
      : {}),
    ...(plannedFilter !== "all"
      ? { planned: plannedFilter === "planned" }
      : {}),
    ...(farmPlotIdFilter ? { farmPlotId: farmPlotIdFilter } : {}),
  };
  const { data: pageData, isLoading, isError } = useAdminPlantEvents(params);

  const events = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  function handleDelete(id: string) {
    if (!window.confirm("Xóa sự kiện này?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Đã xóa sự kiện"),
      onError: () => toast.error("Xóa thất bại"),
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto sidebar-scroll">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                Lọc sự kiện
              </h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-5">
              {/* Event type — grouped by category */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Loại sự kiện
                </p>
                <div className="space-y-3">
                  {/* "All" chip */}
                  <button
                    onClick={() => setDraftEventType("all")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      draftEventType === "all"
                        ? "bg-slate-700 text-white border-slate-700"
                        : "text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Tất cả
                  </button>

                  {GROUPED_EVENT_TYPES.map(({ category, types }) => {
                    const styles = EVENT_CATEGORY_STYLES[category];
                    return (
                      <div key={category}>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${styles.label}`}
                        >
                          {EVENT_CATEGORY_LABELS[category]}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {types.map(([value, label]) => (
                            <button
                              key={value}
                              onClick={() =>
                                setDraftEventType(value as EventType)
                              }
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                draftEventType === value
                                  ? styles.active
                                  : styles.inactive
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Planned */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Loại lịch
                </p>
                <div className="flex gap-1.5">
                  {PLANNED_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDraftPlanned(opt.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        draftPlanned === opt.value
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Farm Plot ID */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Farm Plot ID
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Nhập Farm Plot ID..."
                    value={draftFarmPlotId}
                    onChange={(e) => setDraftFarmPlotId(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <button
                onClick={resetFilter}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Đặt lại
              </button>
              <button
                onClick={applyFilter}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={openFilter}
          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
            activeFilterCount > 0
              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
              : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-emerald-700 text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        {!isLoading && (
          <span className="text-sm text-slate-400">
            {totalElements} sự kiện
          </span>
        )}
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="sự kiện"
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />

      <AdminTable
        gridCols="grid-cols-[160px_1fr_1fr_100px_110px_110px_130px]"
        columns={[
          { label: "Loại sự kiện" },
          { label: "Mã cây" },
          { label: "Farm Plot" },
          { label: "KH?" },
          { label: "Bắt đầu" },
          { label: "Kết thúc" },
          { label: "Hành động", align: "right" },
        ]}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Không thể tải dữ liệu sự kiện"
        isEmpty={events.length === 0}
        emptyMessage="Không có sự kiện nào"
        renderSkeleton={() => <SkeletonRow cols={7} />}
        skeletonCount={8}
      >
        {events.map((ev) => (
          <div
            key={ev.id}
            className="grid grid-cols-[160px_1fr_1fr_100px_110px_110px_130px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
          >
            <EventTypeBadge type={ev.eventType} />
            <p className="text-xs font-mono text-slate-500 truncate">
              {ev.plantId ?? "—"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {ev.farmPlotId ?? "—"}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${
                ev.planned
                  ? "bg-blue-50 text-blue-700 ring-blue-200"
                  : "bg-slate-100 text-slate-500 ring-slate-200"
              }`}
            >
              {ev.planned ? "Có" : "Không"}
            </span>
            <p className="text-xs text-slate-500">
              {formatDate(ev.calculatedStartDate)}
            </p>
            <p className="text-xs text-slate-500">
              {formatDate(ev.calculatedEndDate)}
            </p>
            <div className="flex justify-end items-center gap-1">
              <AdminDetailButton
                onClick={() => navigate(ROUTES.ADMIN.PLANT_EVENT_DETAIL(ev.id))}
                label={null}
              />
              <button
                onClick={() => handleDelete(ev.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Xóa"
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
// Collapsible panel wrapper
// ============================================================================

interface PanelProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Panel({
  title,
  description,
  icon,
  accentClass,
  open,
  onToggle,
  children,
}: PanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Panel header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${accentClass}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {description}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          strokeWidth={2.5}
        />
      </button>

      {/* Panel body */}
      {open && (
        <div className="border-t border-slate-100 px-5 py-5">{children}</div>
      )}
    </div>
  );
}

// ============================================================================
// Main page (panels)
// ============================================================================

export function PlantDiseaseDBPage() {
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    species: true,
    plants: false,
    events: false,
  });

  function toggle(id: string) {
    setOpenPanels((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Cây trồng</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý cơ sở dữ liệu loài cây, cây trồng và sự kiện
        </p>
      </div>

      {/* Panels */}
      <Panel
        id="species"
        title="Loài cây"
        description="Quản lý các loài cây trong hệ thống"
        icon={<Leaf className="w-4.5 h-4.5 text-emerald-700" strokeWidth={2} />}
        accentClass="bg-emerald-50"
        open={openPanels.species}
        onToggle={() => toggle("species")}
      >
        <SpeciesTab />
      </Panel>

      <Panel
        id="plants"
        title="Cây trồng"
        description="Danh sách các cây trồng theo lô, vườn"
        icon={<Sprout className="w-4.5 h-4.5 text-sky-700" strokeWidth={2} />}
        accentClass="bg-sky-50"
        open={openPanels.plants}
        onToggle={() => toggle("plants")}
      >
        <PlantsTab />
      </Panel>

      <Panel
        id="events"
        title="Sự kiện cây trồng"
        description="Lịch sử và kế hoạch sự kiện của từng cây"
        icon={
          <CalendarDays
            className="w-4.5 h-4.5 text-violet-700"
            strokeWidth={2}
          />
        }
        accentClass="bg-violet-50"
        open={openPanels.events}
        onToggle={() => toggle("events")}
      >
        <PlantEventsTab />
      </Panel>
    </div>
  );
}

// ============================================================================
// Standalone pages (each mapped to its own sidebar route)
// ============================================================================

export function SpeciesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Loài cây</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý các loài cây trong hệ thống
        </p>
      </div>
      <SpeciesTab />
    </div>
  );
}

export function PlantsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Cây trồng</h1>
        <p className="text-sm text-slate-500 mt-1">
          Danh sách các cây trồng theo lô, vườn
        </p>
      </div>
      <PlantsTab />
    </div>
  );
}

export function PlantEventsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Sự kiện cây trồng
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Lịch sử và kế hoạch sự kiện của từng cây
        </p>
      </div>
      <PlantEventsTab />
    </div>
  );
}
