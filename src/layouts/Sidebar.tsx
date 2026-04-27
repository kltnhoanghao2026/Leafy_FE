import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Bot,
  Activity,
  ScanSearch,
  Bell,
  BellRing,
  Cpu,
  Bot,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Sprout,
  Stethoscope,
  Users,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useMyProfile } from "../features/settings/queries";
import { useFilePreviewUrl } from "../features/settings/queries";
import { isFileServiceReference } from "../lib/api/fileApi";
import { useLogout } from "../features/auth/hooks/useLogout";
import { ROLE_LABELS } from "../features/settings/types";
import { ROUTES } from "../lib/routes";

export function Sidebar() {
  const location = useLocation();
  const { data: profile } = useMyProfile();
  const logout = useLogout();
  const { data: avatarUrl } = useFilePreviewUrl(profile?.avatar);

  const displayName = profile?.fullName || "Đang tải...";
  const displayRole = profile?.role
    ? ROLE_LABELS[profile.role] || profile.role
    : "";
  const avatarSrc =
    avatarUrl ||
    (profile?.avatar && !isFileServiceReference(profile.avatar)
      ? profile.avatar
      : null) ||
    profile?.profilePicture ||
    "https://i.pravatar.cc/150?img=11";

  const baseNavItems = [
    { name: "Trang chủ", path: ROUTES.DASHBOARD.ROOT, icon: Home },
    { name: "Tra cứu bệnh", path: ROUTES.DASHBOARD.SEARCH, icon: Search },
    { name: "Chẩn đoán hình ảnh", path: ROUTES.DASHBOARD.DISEASE_PREDICTION, icon: ScanSearch },
    { name: "Trợ lý ảo AI", path: ROUTES.DASHBOARD.RAG_PANEL, icon: Bot },
    { name: "Theo dõi", path: ROUTES.DASHBOARD.MONITOR, icon: Activity },
    { name: "Cảnh báo", path: ROUTES.DASHBOARD.ALERTS, icon: Bell },
    { name: "Quy tắc", path: ROUTES.DASHBOARD.ALERT_RULES, icon: BellRing },
    { name: "Thiết bị", path: ROUTES.DASHBOARD.DEVICE_ONBOARDING, icon: Cpu },
    { name: "Chuyên gia", path: ROUTES.DASHBOARD.EXPERTS, icon: UserSquare },
    { name: "Nhắn tin", path: ROUTES.DASHBOARD.CHAT, icon: MessageSquare },
    { name: "Cộng đồng", path: ROUTES.DASHBOARD.COMMUNITY, icon: Users },
    { name: "Cài đặt", path: ROUTES.DASHBOARD.SETTINGS, icon: Settings },
  ];

  const renderNavItem = (
    item: (typeof coreNavItems | typeof agricultureNavItems | typeof utilityNavItems)[number],
  ) => (
    <NavLink
      key={item.name}
      to={item.path}
      className={() => {
        const isHome = item.path === ROUTES.DASHBOARD.ROOT;
        const activePath =
          "activePath" in item && item.activePath ? item.activePath : item.path;
        const isCurrentlyActive = isHome
          ? location.pathname === ROUTES.DASHBOARD.ROOT ||
            location.pathname.startsWith("/dashboard/metrics")
          : location.pathname.startsWith(activePath);

        return `flex items-center px-4 py-3 text-sm font-bold rounded-full transition-colors ${
          isCurrentlyActive
            ? "bg-[#245A34] text-white"
            : "text-slate-500 hover:bg-green-50/80 hover:text-[#245A34]"
        }`;
      }}
    >
      <item.icon
        className="w-[1.125rem] h-[1.125rem] mr-3.5 shrink-0"
        strokeWidth={2.5}
      />
      {item.name}
    </NavLink>
  );

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 hidden lg:flex flex-col z-10">
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
          <span className="text-[17px] font-extrabold text-[#245A34] leading-tight tracking-tight">
            Coffee Monitor
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Hệ thống giám sát
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto space-y-2 px-3">
        {coreNavItems.map(renderNavItem)}
        <div className="px-4 pt-4 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Nông nghiệp thông minh
        </div>
        {agricultureNavItems.map(renderNavItem)}
        <div className="px-4 pt-4 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Khác
        </div>
        {utilityNavItems.map(renderNavItem)}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-5 pb-8 shrink-0 space-y-2">
        <NavLink
          to={ROUTES.DASHBOARD.SETTINGS}
          className="flex items-center px-4 py-3 rounded-full bg-slate-50 cursor-pointer transition-colors hover:bg-slate-100"
        >
          <img
            src={avatarSrc}
            alt={displayName}
            className="w-10 h-10 rounded-full border border-slate-200 shrink-0 object-cover"
          />
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 truncate">
              {displayRole}
            </p>
          </div>
          <Settings
            className="w-4 h-4 text-slate-400 shrink-0"
            strokeWidth={2.5}
          />
        </NavLink>

        <button
          onClick={() => void logout()}
          className="flex items-center w-full px-4 py-2.5 rounded-full text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut
            className="w-[1.125rem] h-[1.125rem] mr-3.5 shrink-0"
            strokeWidth={2.5}
          />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
