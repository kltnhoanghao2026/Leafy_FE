import { Sprout } from "lucide-react";

export function FarmOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Tổng quan nông trại
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Xem tất cả nông trại trong hệ thống
        </p>
      </div>

      {/* Placeholder grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">Tất cả nông trại</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Sprout className="w-10 h-10 mb-3 opacity-30" strokeWidth={1.5} />
          <p className="text-sm font-medium">Chưa có dữ liệu nông trại</p>
          <p className="text-xs text-slate-400 mt-1">
            API integration coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
