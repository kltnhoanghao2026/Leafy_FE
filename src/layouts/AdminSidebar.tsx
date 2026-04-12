import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Sprout,
  MessageSquare,
  HeartPulse,
  BarChart3,
  Leaf,
  LogOut,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { useMyProfile } from "../features/settings/queries";
import { useLogout } from "../features/auth/hooks/useLogout";
import { ROUTES } from "../lib/routes";

export function AdminSidebar() {
  const location = useLocation();
  const { data: profile } = useMyProfile();
  const logout = useLogout();

  const displayName = profile?.fullName || "Đang tải...";
  const avatarSrc =
    profile?.avatar ||
    profile?.profilePicture ||
    "https://i.pravatar.cc/150?img=11";

  const navItems = [
    {
      name: "Tổng quan",
      path: ROUTES.ADMIN.OVERVIEW,
      icon: LayoutDashboard,
    },
    { name: "Người dùng", path: ROUTES.ADMIN.USERS, icon: Users },
    { name: "Nông trại", path: ROUTES.ADMIN.FARMS, icon: Sprout },
    { name: "Nội dung", path: ROUTES.ADMIN.CONTENT, icon: MessageSquare },
    { name: "Sức khỏe hệ thống", path: ROUTES.ADMIN.HEALTH, icon: HeartPulse },
    { name: "Phân tích", path: ROUTES.ADMIN.ANALYTICS, icon: BarChart3 },
    { name: "Cây & bệnh", path: ROUTES.ADMIN.PLANTS, icon: Leaf },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 hidden lg:flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center h-20 px-6 shrink-0 mt-2">
        <div className="flex items-center justify-center w-12 h-12 bg-[#245A34] rounded-full shrink-0 shadow-sm">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 8H3V15C3 16.8565 3.7375 18.637 5.05025 19.9497C6.36301 21.2625 8.14348 22 10 22H11C12.35 22 13.6 21.45 14.5 20.6C15.65 19.5 16.5 18 16.85 16.25C18.6 15.6 20.15 14.5 21.15 13C22.15 11.5 22.5 9.8 22.15 8.05L21.75 6.05C21.6 5.3 21 4.75 20.25 4.75H17V8ZM17 10H19.9L20.2 11.45C20.4 12.65 20.1 13.8 19.45 14.8C18.8 15.8 17.8 16.45 16.65 16.8L17 15C17 14.35 17 13.65 17 13V10ZM15 8V4C15 3.45 14.55 3 14 3H6C5.45 3 5 3.45 5 4V8H15Z"
              fill="white"
            />
            <path d="M5 4H15V2H6C4.9 2 4 2.9 4 4V8H5V4Z" fill="white" />
          </svg>
        </div>
        <div className="ml-3 flex flex-col justify-center">
          <span className="text-[17px] font-extrabold text-white leading-tight tracking-tight">
            Leafy Admin
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-[#4ade80]" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-slate-400">
              Bảng điều khiển
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-bold rounded-full transition-colors ${
                isActive
                  ? "bg-[#245A34] text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <item.icon
                className="w-4.5 h-4.5 mr-3.5 shrink-0"
                strokeWidth={2.5}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-5 pb-8 shrink-0 space-y-2 border-t border-slate-800">
        {/* Admin user card */}
        <div className="flex items-center px-4 py-3 rounded-full bg-slate-800">
          <img
            src={avatarSrc}
            alt={displayName}
            className="w-10 h-10 rounded-full border border-slate-600 shrink-0 object-cover"
          />
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">
              {displayName}
            </p>
            <p className="text-[10px] font-semibold text-[#4ade80] truncate">
              Quản trị viên
            </p>
          </div>
        </div>

        {/* Back to dashboard */}
        <Link
          to={ROUTES.DASHBOARD.ROOT}
          className="flex items-center w-full px-4 py-2.5 rounded-full text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft
            className="w-4.5 h-4.5 mr-3.5 shrink-0"
            strokeWidth={2.5}
          />
          Về trang người dùng
        </Link>

        {/* Logout */}
        <button
          onClick={() => void logout()}
          className="flex items-center w-full px-4 py-2.5 rounded-full text-sm font-bold text-red-400 hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="w-4.5 h-4.5 mr-3.5 shrink-0" strokeWidth={2.5} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
