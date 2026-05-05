import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BadgeCheck, X } from "lucide-react";
import { AdminDetailButton } from "../../../../components/admin/AdminDetailButton";
import { AdminTable } from "../../../../components/admin/AdminTable";
import { AdminPagination } from "../../../../components/admin/AdminPagination";
import { useAdminProfiles } from "../";
import type { AdminProfileDto, ProfileListParams, ProfileRole } from "../../types";
import { ROUTES } from "../../../../lib/routes";

const PAGE_SIZE = 20;

// ---- Filter state types ----------------------------------------------------

type ActiveFilter = "all" | "true" | "false";
type VerifiedFilter = "all" | "true" | "false";
type RoleFilter = "all" | ProfileRole;

// ---- Helpers ---------------------------------------------------------------

function getInitials(name: string | null, fallback: string): string {
  const source = name ?? fallback;
  const parts = source.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function hashColor(str: string): string {
  const colors = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function RoleBadge({ role }: { role: ProfileRole | null }) {
  if (role === "EXPERT") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-200">
        Chuyên gia
      </span>
    );
  }
  if (role === "FARMER") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
        Nông dân
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 ring-1 ring-slate-200">
      Chưa đặt
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Hoạt động
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Bị khóa
    </span>
  );
}

function VerifiedBadge({ isVerified }: { isVerified: boolean }) {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
        <BadgeCheck className="w-3 h-3" strokeWidth={2.5} />
        Đã xác minh
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 ring-1 ring-slate-200">
      Chưa xác minh
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_110px_120px_130px_130px] gap-4 items-center px-4 py-3 animate-pulse border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-200 rounded w-36" />
          <div className="h-2.5 bg-slate-100 rounded w-44" />
        </div>
      </div>
      <div className="h-5 bg-slate-100 rounded-full w-20" />
      <div className="h-5 bg-slate-100 rounded-full w-20" />
      <div className="h-5 bg-slate-100 rounded-full w-24" />
      <div className="h-7 bg-slate-100 rounded-lg w-24" />
    </div>
  );
}

// ---- Filter pill group component -------------------------------------------

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
    <div className="flex items-center gap-2">
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

// ---- Row component ---------------------------------------------------------

interface ProfileRowProps {
  profile: AdminProfileDto;
}

function ProfileRow({ profile }: ProfileRowProps) {
  const navigate = useNavigate();

  const initials = getInitials(profile.fullName, profile.email ?? profile.id);
  const colorClass = hashColor(profile.id);
  const avatarSrc = profile.avatar ?? profile.profilePicture;

  function formatDate(iso: string) {
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

  return (
    <div className="grid grid-cols-[1fr_110px_120px_130px_130px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      {/* Profile info */}
      <div className="flex items-center gap-3 min-w-0">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={profile.fullName ?? "avatar"}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full ${colorClass} shrink-0 flex items-center justify-center text-white text-xs font-bold`}
          >
            {initials || "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {profile.fullName ?? (
              <span className="text-slate-400 italic">Chưa đặt tên</span>
            )}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {profile.email ?? "—"} · {formatDate(profile.createdAt)}
          </p>
        </div>
      </div>

      {/* Role */}
      <div className="flex items-center">
        <RoleBadge role={profile.role} />
      </div>

      {/* Status */}
      <div className="flex items-center">
        <StatusBadge active={profile.active} />
      </div>

      {/* Verified */}
      <div className="flex items-center">
        <VerifiedBadge isVerified={profile.isVerified} />
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <AdminDetailButton
          onClick={() => navigate(ROUTES.ADMIN.PROFILE_DETAIL(profile.id))}
        />
      </div>
    </div>
  );
}

// ---- Main page -------------------------------------------------------------

export function ProfileManagementPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
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

  // Reset page on filter change
  function handleRoleChange(v: RoleFilter) {
    setRoleFilter(v);
    setPage(0);
  }
  function handleActiveChange(v: ActiveFilter) {
    setActiveFilter(v);
    setPage(0);
  }
  function handleVerifiedChange(v: VerifiedFilter) {
    setVerifiedFilter(v);
    setPage(0);
  }

  const hasActiveFilters =
    roleFilter !== "all" ||
    activeFilter !== "all" ||
    verifiedFilter !== "all" ||
    debouncedSearch.length > 0;

  function clearFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setActiveFilter("all");
    setVerifiedFilter("all");
    setPage(0);
  }

  // Build query params
  const queryParams: ProfileListParams = {
    page,
    size: pageSize,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(roleFilter !== "all" ? { role: roleFilter as ProfileRole } : {}),
    ...(activeFilter !== "all" ? { active: activeFilter === "true" } : {}),
    ...(verifiedFilter !== "all"
      ? { isVerified: verifiedFilter === "true" }
      : {}),
  };

  const { data: pageData, isLoading, isError } = useAdminProfiles(queryParams);

  const profiles = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quản lý hồ sơ</h1>
        <p className="text-sm text-slate-500 mt-1">
          Xem và quản lý thông tin hồ sơ của người dùng trên nền tảng.
        </p>
      </div>

      {/* Search + count row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, chuyên môn..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
          />
        </div>
        {!isLoading && (
          <span className="text-sm text-slate-400 shrink-0">
            {totalElements} hồ sơ
          </span>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Vai trò"
          value={roleFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "FARMER", label: "Nông dân" },
            { value: "EXPERT", label: "Chuyên gia" },
          ]}
          onChange={handleRoleChange}
        />
        <FilterGroup
          label="Trạng thái"
          value={activeFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "true", label: "Hoạt động" },
            { value: "false", label: "Bị khóa" },
          ]}
          onChange={handleActiveChange}
        />
        <FilterGroup
          label="Xác minh"
          value={verifiedFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "true", label: "Đã xác minh" },
            { value: "false", label: "Chưa xác minh" },
          ]}
          onChange={handleVerifiedChange}
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Pagination — top */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="hồ sơ"
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />

      {/* Table */}
      <AdminTable
        gridCols="grid-cols-[1fr_110px_120px_130px_130px]"
        columns={[
          { label: "Người dùng" },
          { label: "Vai trò" },
          { label: "Trạng thái" },
          { label: "Xác minh" },
          { label: "Hành động", align: "right" },
        ]}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Không thể tải danh sách hồ sơ"
        isEmpty={profiles.length === 0}
        emptyMessage={
          hasActiveFilters
            ? "Không tìm thấy hồ sơ phù hợp với bộ lọc"
            : "Chưa có hồ sơ nào"
        }
        emptyIcon={<Search className="w-8 h-8" />}
        renderSkeleton={() => <SkeletonRow />}
        skeletonCount={8}
      >
        {profiles.map((profile) => (
          <ProfileRow key={profile.id} profile={profile} />
        ))}
      </AdminTable>
    </div>
  );
}
