import { Search, UserCheck, UserX } from "lucide-react";

export function UserManagementPage() {
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
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              disabled
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A34]/30 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Table placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">
            Danh sách tài khoản
          </h2>
        </div>
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
          <span className="col-span-2">Người dùng</span>
          <span>Vai trò</span>
          <span>Trạng thái</span>
          <span>Hành động</span>
        </div>
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="flex gap-4 mb-4 opacity-30">
            <UserCheck className="w-8 h-8" strokeWidth={1.5} />
            <UserX className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">Chưa có dữ liệu người dùng</p>
          <p className="text-xs text-slate-400 mt-1">
            API integration coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
