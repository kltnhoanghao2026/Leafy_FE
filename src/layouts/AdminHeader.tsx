import { Link, useLocation } from "react-router-dom";
import { LogOut, ArrowLeft, ShieldCheck } from "lucide-react";
import { useMyProfile } from "../features/settings/queries";
import { useLogout } from "../features/auth/hooks/useLogout";
import { ROUTES } from "../lib/routes";

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.ADMIN.OVERVIEW]: "Tổng quan",
  [ROUTES.ADMIN.USERS]: "Người dùng",
  [ROUTES.ADMIN.FARMS]: "Nông trại",
  [ROUTES.ADMIN.CONTENT]: "Kiểm duyệt nội dung",
  [ROUTES.ADMIN.HEALTH]: "Sức khỏe hệ thống",
  [ROUTES.ADMIN.ANALYTICS]: "Phân tích",
  [ROUTES.ADMIN.PLANTS]: "Cây trồng",
  [ROUTES.ADMIN.DISEASES]: "Bệnh & Điều trị",
  [ROUTES.ADMIN.PROFILES]: "Quản lý hồ sơ",
  [ROUTES.ADMIN.SEEDING]: "Khởi tạo dữ liệu",
};

function usePageTitle(): string {
  const { pathname } = useLocation();
  // Profile detail page
  if (pathname.startsWith(ROUTES.ADMIN.PROFILES + "/")) {
    return "Chi tiết hồ sơ";
  }
  // Farm detail pages
  if (/^\/admin\/farms\/zones\//.test(pathname)) {
    return "Chi tiết vùng canh tác";
  }
  if (/^\/admin\/farms\/[^/]+$/.test(pathname)) {
    return "Chi tiết nông trại";
  }
  return PAGE_TITLES[pathname] ?? "Admin";
}

export function AdminHeader() {
  const { data: profile } = useMyProfile();
  const logout = useLogout();
  const pageTitle = usePageTitle();

  const displayName = profile?.fullName || "Đang tải...";
  const avatarSrc =
    profile?.avatar ||
    profile?.profilePicture ||
    "https://i.pravatar.cc/150?img=11";

  return (
    <header className="sticky top-0 z-20 h-16 shrink-0 flex items-center justify-between bg-white border-b border-slate-200 px-6 lg:px-8">
      {/* Left side: back link + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={ROUTES.DASHBOARD.ROOT}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          <span>Về trang người dùng</span>
        </Link>

        <div className="hidden sm:block w-px h-5 bg-slate-200 shrink-0" />

        <h1 className="text-lg font-bold text-slate-800 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* User info */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <img
            src={avatarSrc}
            alt={displayName}
            className="w-7 h-7 rounded-full border border-slate-300 object-cover shrink-0"
          />
          <div className="hidden md:flex flex-col leading-tight min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate max-w-30">
              {displayName}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
              Quản trị viên
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => void logout()}
          title="Đăng xuất"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
