import { useQuery } from "@tanstack/react-query";
import { Users, Sprout, Leaf, Activity, Loader2, IdCard } from "lucide-react";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type { SpringPage } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function useCount(queryKey: string[], url: string) {
  return useQuery({
    queryKey,
    queryFn: () =>
      apiClient.get<ApiEnvelope<SpringPage<unknown>>>(url, {
        params: { page: 0, size: 1 },
      }),
    select: (res) => res.data.data?.totalElements ?? 0,
    staleTime: 60_000,
  });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  count: number | undefined;
  isLoading: boolean;
}

function StatCard({
  label,
  icon: Icon,
  color,
  bg,
  count,
  isLoading,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} shrink-0`}
      >
        <Icon className={`w-6 h-6 ${color}`} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-slate-300 animate-spin mt-1" />
        ) : (
          <p className="text-2xl font-extrabold text-slate-800">
            {count?.toLocaleString() ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminOverviewPage() {
  const users = useCount(["overview", "users"], API_ENDPOINTS.USERS.LIST);
  const farms = useCount(
    ["overview", "farms"],
    API_ENDPOINTS.FARMS.ADMIN_PLOTS,
  );
  const plants = useCount(["overview", "plants"], API_ENDPOINTS.PLANTS.LIST);
  const profiles = useCount(
    ["overview", "profiles"],
    API_ENDPOINTS.PROFILES.LIST,
  );

  const statCards = [
    {
      label: "Người dùng",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ...users,
    },
    {
      label: "Nông trại",
      icon: Sprout,
      color: "text-green-600",
      bg: "bg-green-50",
      ...farms,
    },
    {
      label: "Hồ sơ",
      icon: IdCard,
      color: "text-orange-600",
      bg: "bg-orange-50",
      ...profiles,
    },
    {
      label: "Cây trồng",
      icon: Leaf,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ...plants,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Tổng quan hệ thống
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Thống kê nhanh toàn bộ hệ thống Leafy
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
            count={card.data}
            isLoading={card.isLoading}
          />
        ))}
      </div>

      {/* Placeholder activity area */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-slate-400" strokeWidth={2} />
          <h2 className="text-sm font-bold text-slate-700">
            Hoạt động gần đây
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Activity className="w-10 h-10 mb-3 opacity-30" strokeWidth={1.5} />
          <p className="text-sm font-medium">Chưa có dữ liệu</p>
        </div>
      </div>
    </div>
  );
}
