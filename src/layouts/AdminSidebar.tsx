import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Sprout,
  MessageSquare,
  HeartPulse,
  BarChart3,
  Leaf,
  FlaskConical,
  ShieldCheck,
  ChevronDown,
  UserCircle,
  BadgeCheck,
  Database,
  RefreshCw,
  CalendarDays,
  MapPinned,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { ROUTES } from "../lib/routes";

interface AdminSidebarProps {
  collapsed: boolean;
}

export function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const location = useLocation();

  const navGroups = [
    {
      label: "Tổng quan",
      items: [
        {
          name: "Tổng quan",
          path: ROUTES.ADMIN.OVERVIEW,
          icon: LayoutDashboard,
        },
        { name: "Phân tích", path: ROUTES.ADMIN.ANALYTICS, icon: BarChart3 },
        {
          name: "Sức khỏe hệ thống",
          path: ROUTES.ADMIN.HEALTH,
          icon: HeartPulse,
        },
      ],
    },
    {
      label: "Quản lý người dùng",
      items: [
        { name: "Người dùng", path: ROUTES.ADMIN.USERS, icon: Users },
        { name: "Hồ sơ", path: ROUTES.ADMIN.PROFILES, icon: UserCircle },
        {
          name: "Chứng chỉ",
          path: ROUTES.ADMIN.CERTIFICATES,
          icon: BadgeCheck,
        },
      ],
    },
    {
      label: "Nông nghiệp",
      items: [
        { name: "Nông trại", path: ROUTES.ADMIN.FARMS, icon: MapPinned },
        { name: "Loài cây", path: ROUTES.ADMIN.SPECIES, icon: Leaf },
        { name: "Cây trồng", path: ROUTES.ADMIN.PLANTS, icon: Sprout },
        {
          name: "Sự kiện cây",
          path: ROUTES.ADMIN.PLANT_EVENTS,
          icon: CalendarDays,
        },
        {
          name: "Bệnh & Điều trị",
          path: ROUTES.ADMIN.DISEASES,
          icon: FlaskConical,
        },
      ],
    },
    {
      label: "Nội dung & Tri thức",
      items: [
        { name: "Nội dung", path: ROUTES.ADMIN.CONTENT, icon: MessageSquare },
        { name: "Cơ sở tri thức", path: ROUTES.ADMIN.KNOWLEDGE_BASE, icon: BookOpen },
      ],
    },
    {
      label: "Hệ thống",
      items: [
        {
          name: "Khởi tạo dữ liệu",
          path: ROUTES.ADMIN.SEEDING,
          icon: Database,
        },
        { name: "Đồng bộ dữ liệu", path: ROUTES.ADMIN.SYNC, icon: RefreshCw },
      ],
    },
  ];

  // All groups open by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((g) => [g.label, true])),
  );

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 bg-slate-900 hidden lg:flex flex-col z-10 transition-all duration-300 ease-in-out overflow-hidden ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center h-20 shrink-0 mt-1 ${
          collapsed ? "justify-center px-2" : "px-5"
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
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 py-4 overflow-y-auto sidebar-scroll ${collapsed ? "px-1.5" : "px-3"}`}
      >
        {navGroups.map((group, gi) => {
          const isOpen = openGroups[group.label] ?? true;
          // If any item in this group is active, keep it visually indicated
          const hasActive = group.items.some((item) =>
            location.pathname.startsWith(item.path),
          );

          return (
            <div key={group.label} className={gi > 0 ? "mt-3" : ""}>
              {/* Category header */}
              {!collapsed ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 mb-1 group"
                >
                  <p
                    className={`text-[10px] font-extrabold uppercase tracking-widest select-none transition-colors ${
                      hasActive
                        ? "text-slate-300"
                        : "text-slate-500 group-hover:text-slate-400"
                    }`}
                  >
                    {group.label}
                  </p>
                  <ChevronDown
                    className={`w-3 h-3 text-slate-500 group-hover:text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                    strokeWidth={2.5}
                  />
                </button>
              ) : (
                gi > 0 && (
                  <div className="mx-auto my-2 w-6 border-t border-slate-700" />
                )
              )}

              {/* Items — collapse when closed (skip when sidebar itself is collapsed) */}
              {(collapsed || isOpen) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        title={collapsed ? item.name : undefined}
                        className={`flex items-center py-2.5 text-sm font-bold rounded-full transition-colors ${
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
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
