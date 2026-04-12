import { Leaf, Search } from "lucide-react";

export function PlantDiseaseDBPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Cây trồng & Bệnh
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý cơ sở dữ liệu loài cây và bệnh
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Tìm theo tên loài hoặc tên bệnh..."
            disabled
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">
            Danh sách loài cây
          </h2>
        </div>
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
          <span className="col-span-2">Tên loài</span>
          <span>Số lượng cây</span>
          <span>Bệnh liên quan</span>
        </div>
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Leaf className="w-10 h-10 mb-3 opacity-30" strokeWidth={1.5} />
          <p className="text-sm font-medium">Chưa có dữ liệu</p>
          <p className="text-xs text-slate-400 mt-1">
            API integration coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
