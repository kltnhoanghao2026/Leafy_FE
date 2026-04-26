import { useState, useEffect, useRef } from "react";
import { Search, UserCheck2, Lock, Unlock, ShieldCheck } from "lucide-react";
import { AdminTable } from "../../../components/admin/AdminTable";
import { AdminPagination } from "../../../components/admin/AdminPagination";
import {
  useAdminUsers,
  useAdminSearchUsers,
  useActivateUser,
  useDeactivateUser,
} from "./users.queries";
import { useAuthStore } from "../../../store/authStore";
import type { AdminUserDto, UserRole } from "../types";

const PAGE_SIZE = 20;

// ---- Small helpers --------------------------------------------------------

function getInitials(email: string): string {
  const parts = email.split("@")[0].split(/[._-]/);
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

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-slate-200">
      Người dùng
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

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_110px_120px_160px] gap-4 items-center px-4 py-3 animate-pulse border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-200 rounded w-44" />
          <div className="h-2.5 bg-slate-100 rounded w-28" />
        </div>
      </div>
      <div className="h-5 bg-slate-100 rounded-full w-20" />
      <div className="h-5 bg-slate-100 rounded-full w-20" />
      <div className="h-7 bg-slate-100 rounded-lg w-24" />
    </div>
  );
}

// ---- Row component --------------------------------------------------------

interface UserRowProps {
  user: AdminUserDto;
  isSelf: boolean;
}

function UserRow({ user, isSelf }: UserRowProps) {
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  const isPending =
    (activateMutation.isPending && activateMutation.variables === user.id) ||
    (deactivateMutation.isPending && deactivateMutation.variables === user.id);

  const initials = getInitials(user.email);
  const colorClass = hashColor(user.id);

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
    <div className="grid grid-cols-[1fr_110px_120px_160px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      {/* User info */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-full ${colorClass} shrink-0 flex items-center justify-center text-white text-xs font-bold`}
        >
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {user.email}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {user.phoneNumber ?? "—"} · Tham gia {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Role */}
      <div className="flex items-center">
        <RoleBadge role={user.role} />
      </div>

      {/* Status */}
      <div className="flex items-center">
        <StatusBadge active={user.active} />
      </div>

      {/* Action */}
      <div className="flex justify-end">
        {isSelf ? (
          <span className="text-xs text-slate-300 font-medium px-3">
            Tài khoản của bạn
          </span>
        ) : user.active ? (
          <button
            onClick={() => deactivateMutation.mutate(user.id)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
            Khóa
          </button>
        ) : (
          <button
            onClick={() => activateMutation.mutate(user.id)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Unlock className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
            Kích hoạt
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Main page ------------------------------------------------------------

export function UserManagementPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // Inline 300ms debounce — no extra library needed
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  const isSearching = debouncedSearch.length > 0;

  const listQuery = useAdminUsers({ page, size: pageSize });
  const searchQuery = useAdminSearchUsers(debouncedSearch, {
    page,
    size: pageSize,
  });

  const { data, isLoading, isError, error } = isSearching
    ? searchQuery
    : listQuery;

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Quản lý người dùng
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tìm kiếm, xem và quản lý tài khoản người dùng
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              strokeWidth={2.5}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm theo email hoặc số điện thoại..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 transition-shadow"
            />
          </div>
          {!isLoading && (
            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {totalElements} người dùng
            </span>
          )}
        </div>
      </div>

      {/* Pagination — top */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        itemLabel="người dùng"
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(0);
        }}
      />

      {/* Table */}
      <AdminTable
        gridCols="grid-cols-[1fr_110px_120px_160px]"
        columns={[
          { label: "Người dùng" },
          { label: "Vai trò" },
          { label: "Trạng thái" },
          { label: "Hành động", align: "right" },
        ]}
        isLoading={isLoading}
        isError={isError}
        errorMessage={`Không thể tải danh sách người dùng${
          (error as Error)?.message ? `: ${(error as Error).message}` : ""
        }`}
        isEmpty={users.length === 0}
        emptyMessage={
          isSearching
            ? `Không tìm thấy kết quả cho "${debouncedSearch}"`
            : "Chưa có dữ liệu người dùng"
        }
        emptyIcon={<UserCheck2 className="w-8 h-8" strokeWidth={1.5} />}
        renderSkeleton={() => <SkeletonRow />}
      >
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
          />
        ))}
      </AdminTable>
    </div>
  );
}
