import { Users, Sprout, MessageSquare, Leaf, Activity } from "lucide-react";

const stats = [
  {
    label: "Người dùng",
    value: "—",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Nông trại",
    value: "—",
    icon: Sprout,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Bài viết",
    value: "—",
    icon: MessageSquare,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    label: "Cây trồng",
    value: "—",
    icon: Leaf,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

export function AdminOverviewPage() {
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
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} shrink-0`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {stat.label}
              </p>
              <p className="text-2xl font-extrabold text-slate-800">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder activity area */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
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
