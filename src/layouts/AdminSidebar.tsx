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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMyProfile } from "../features/settings/queries";
import { useLogout } from "../features/auth/hooks/useLogout";
import { ROUTES } from "../lib/routes";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
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
    <aside
      className={`fixed inset-y-0 left-0 bg-slate-900 hidden lg:flex flex-col z-10 transition-all duration-300 ease-in-out overflow-hidden ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo + toggle */}
      <div
        className={`flex items-center h-20 shrink-0 mt-1 ${
          collapsed ? "justify-between px-2" : "justify-between px-5"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 bg-[#245A34] rounded-full shrink-0 shadow-sm">
            <svg
              width="20"
              height="20"
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
          {!collapsed && (
            <div className="flex flex-col justify-center overflow-hidden">
              <span className="text-[17px] font-extrabold text-white leading-tight tracking-tight whitespace-nowrap">
                Leafy Admin
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck
                  className="w-3 h-3 text-[#4ade80] shrink-0"
                  strokeWidth={2.5}
                />
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                  Bảng điều khiển
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 py-4 overflow-y-auto space-y-1 ${collapsed ? "px-1.5" : "px-3"}`}
      >
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={`flex items-center py-3 text-sm font-bold rounded-full transition-colors ${
                collapsed ? "justify-center px-0" : "px-4"
              } ${
                isActive
                  ? "bg-[#245A34] text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <item.icon
                className={`w-4.5 h-4.5 shrink-0 ${!collapsed ? "mr-3.5" : ""}`}
                strokeWidth={2.5}
              />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        className={`shrink-0 space-y-1 border-t border-slate-800 ${collapsed ? "p-2 pb-6" : "p-4 pb-7"}`}
      >
        {/* Admin user card */}
        <div
          className={`flex items-center rounded-full bg-slate-800 ${
            collapsed ? "justify-center p-2" : "px-4 py-3"
          }`}
        >
          <img
            src={avatarSrc}
            alt={displayName}
            title={collapsed ? displayName : undefined}
            className="w-8 h-8 rounded-full border border-slate-600 shrink-0 object-cover"
          />
          {!collapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">
                {displayName}
              </p>
              <p className="text-[10px] font-semibold text-[#4ade80] truncate">
                Quản trị viên
              </p>
            </div>
          )}
        </div>

        {/* Back to dashboard */}
        <Link
          to={ROUTES.DASHBOARD.ROOT}
          title={collapsed ? "Về trang người dùng" : undefined}
          className={`flex items-center w-full py-2.5 rounded-full text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors ${
            collapsed ? "justify-center px-0" : "px-4"
          }`}
        >
          <ArrowLeft
            className={`w-4.5 h-4.5 shrink-0 ${!collapsed ? "mr-3.5" : ""}`}
            strokeWidth={2.5}
          />
          {!collapsed && (
            <span className="whitespace-nowrap">Về trang người dùng</span>
          )}
        </Link>

        {/* Logout */}
        <button
          onClick={() => void logout()}
          title={collapsed ? "Đăng xuất" : undefined}
          className={`flex items-center w-full py-2.5 rounded-full text-sm font-bold text-red-400 hover:bg-red-950/40 transition-colors ${
            collapsed ? "justify-center px-0" : "px-4"
          }`}
        >
          <LogOut
            className={`w-4.5 h-4.5 shrink-0 ${!collapsed ? "mr-3.5" : ""}`}
            strokeWidth={2.5}
          />
          {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
