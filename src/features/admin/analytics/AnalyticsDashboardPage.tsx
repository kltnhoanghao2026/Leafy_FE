import { BarChart3, TrendingUp, PieChart } from "lucide-react";

const chartPlaceholders = [
  {
    title: "Người dùng mới theo tháng",
    icon: TrendingUp,
    description: "Biểu đồ đường — tăng trưởng người dùng",
  },
  {
    title: "Phân bổ vai trò người dùng",
    icon: PieChart,
    description: "Biểu đồ tròn — FARMER / EXPERT / ADMIN",
  },
  {
    title: "Hoạt động cộng đồng",
    icon: BarChart3,
    description: "Biểu đồ cột — bài viết & bình luận theo tuần",
  },
  {
    title: "Phân bổ loại cây trồng",
    icon: PieChart,
    description: "Biểu đồ donut — phân bổ theo loài",
  },
];

export function AnalyticsDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Phân tích & Thống kê
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Dữ liệu tổng hợp toàn hệ thống
        </p>
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {chartPlaceholders.map((chart) => (
          <div
            key={chart.title}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <chart.icon className="w-5 h-5 text-[#245A34]" strokeWidth={2} />
              <h2 className="text-sm font-bold text-slate-700">
                {chart.title}
              </h2>
            </div>
            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl text-slate-400">
              <chart.icon
                className="w-10 h-10 mb-3 opacity-20"
                strokeWidth={1.5}
              />
              <p className="text-xs font-medium text-center px-4">
                {chart.description}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                API integration coming soon
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
