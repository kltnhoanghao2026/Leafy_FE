import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Bot,
  ScanSearch,
  Bell,
  BellRing,
  ChevronDown,
  Cpu,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Sprout,
  Leaf,
  Users,
  Settings,
  MessageSquare,
  UserSquare,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useMyProfile } from "../features/settings/queries";
import { ROUTES } from "../lib/routes";
import { useNotificationState } from "../features/notifications/queries/queries";
import { useNotificationWebSocket } from "../features/notifications/hooks/useNotificationWebSocket";
import { useTranslation } from "../i18n";
import { chatApi } from "../features/chat/api/chatApi";
import { useQuery } from "@tanstack/react-query";

type SidebarNavItem = {
  name: string;
  path: string;
  icon: LucideIcon | React.ElementType;
  activePath?: string;
};

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { data: profile } = useMyProfile();

  // Live unread count — WebSocket keeps this fresh
  useNotificationWebSocket();
  const { data: stateData } = useNotificationState();
  const unreadCount = stateData?.data?.unreadCount ?? 0;

  // Total unread chat count — uses same queryKey as chat page so WebSocket updates flow through
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(0, 100),
    staleTime: 30_000,
  });
  const chatUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  const utilityBadgeMap: Record<string, number> = {
    [ROUTES.DASHBOARD.NOTIFICATIONS]: unreadCount,
    [ROUTES.DASHBOARD.CHAT]: chatUnreadCount,
  };

  const coreNavItems: SidebarNavItem[] = [
    { name: t('nav.home'), path: ROUTES.DASHBOARD.ROOT, icon: Home },
    { name: t('nav.search'), path: ROUTES.DASHBOARD.SEARCH, icon: Search },
    { name: t('nav.alerts'), path: ROUTES.DASHBOARD.ALERTS, icon: Bell },
    { name: t('nav.alertRules'), path: ROUTES.DASHBOARD.ALERT_RULES, icon: BellRing },
    { name: t('nav.devices'), path: ROUTES.DASHBOARD.DEVICES, icon: Cpu },
  ];

  const agricultureNavItems: SidebarNavItem[] = [
    { name: t('nav.agricultureOverview'), path: ROUTES.DASHBOARD.AGRICULTURE_OVERVIEW, icon: LayoutDashboard },
    { name: t('nav.plants'), path: ROUTES.DASHBOARD.PLANTS, icon: Sprout },
    { name: t('nav.species'), path: ROUTES.DASHBOARD.SPECIES, icon: Leaf },
    { name: t('nav.plans'), path: ROUTES.DASHBOARD.PLANS, icon: ClipboardList },
    { name: t('nav.plantEventsCalendar'), path: ROUTES.DASHBOARD.PLANT_EVENTS_CALENDAR, icon: CalendarDays },
    { name: t('nav.diseasePrediction'), path: ROUTES.DASHBOARD.DISEASE_DIAGNOSIS, icon: ScanSearch },
    { name: t('nav.ragPanel'), path: ROUTES.DASHBOARD.RAG_PANEL, icon: Bot },
    ...(profile?.role === 'EXPERT'
      ? [{ name: 'Tư Vấn', path: ROUTES.DASHBOARD.CONSULTING, icon: Stethoscope }]
      : []),
  ];

  const utilityNavItems: SidebarNavItem[] = [
    { name: t('nav.experts'), path: ROUTES.DASHBOARD.EXPERTS, icon: UserSquare },
    { name: t('nav.chat'), path: ROUTES.DASHBOARD.CHAT, icon: MessageSquare },
    { name: 'Thông báo', path: ROUTES.DASHBOARD.NOTIFICATIONS, icon: Bell },
    { name: t('nav.community'), path: ROUTES.DASHBOARD.COMMUNITY, icon: Users },
    { name: t('nav.settings'), path: ROUTES.DASHBOARD.SETTINGS, icon: Settings },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: true,
    agriculture: true,
    utility: true,
  });

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderNavItem = (item: SidebarNavItem, badge?: number) => {
    const isHome = item.path === ROUTES.DASHBOARD.ROOT;
    const activePath = item.activePath ?? item.path;
    const isCurrentlyActive = isHome
      ? location.pathname === ROUTES.DASHBOARD.ROOT || location.pathname.startsWith('/dashboard/metrics')
      : location.pathname.startsWith(activePath);

    return (
      <NavLink
        key={item.name}
        to={item.path}
        title={collapsed ? item.name : undefined}
        className={`relative flex items-center py-2.5 text-sm font-bold rounded-full transition-colors ${
          collapsed ? 'justify-center px-0' : 'px-3.5'
        } ${
          isCurrentlyActive
            ? 'bg-[#245A34] text-white'
            : 'text-slate-500 hover:bg-green-50/80 hover:text-[#245A34]'
        }`}
      >
        <item.icon className={`w-[1.05rem] h-[1.05rem] shrink-0 ${collapsed ? '' : 'mr-3'}`} strokeWidth={2.5} />
        {!collapsed && <span className="flex-1">{item.name}</span>}
        {!collapsed && badge != null && badge > 0 && (
          <span className={`ml-1.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full leading-none ${
            isCurrentlyActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
          }`}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {collapsed && badge != null && badge > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        )}
      </NavLink>
    );
  };

  const renderSection = (key: string, label: string, items: SidebarNavItem[], badgeMap?: Record<string, number>) => {
    const isOpen = openSections[key] ?? true;
    return (
      <div key={key}>
        {!collapsed ? (
          <button
            type="button"
            onClick={() => toggleSection(key)}
            className="flex w-full items-center px-3.5 pt-3.5 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="flex-1 text-left">{label}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
              strokeWidth={3}
            />
          </button>
        ) : (
          <div className="mx-auto my-2 w-5 border-t border-slate-200" />
        )}
        {(collapsed || isOpen) && (
          <div className="space-y-0.5 mt-0.5">
            {items.map((item) => renderNavItem(item, badgeMap?.[item.path]))}
          </div>
        )}
      </div>
    );
  };


  return (
    <aside className={`fixed inset-y-0 left-0 bg-white border-r border-gray-100 hidden lg:flex flex-col z-10 transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? 'w-14' : 'w-56'}`}>
      {/* Logo */}
      <div className={`flex items-center h-[68px] shrink-0 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        <div className="flex items-center justify-center w-10 h-10 bg-[#245A34] rounded-full shrink-0 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17 8H3V15C3 16.8565 3.7375 18.637 5.05025 19.9497C6.36301 21.2625 8.14348 22 10 22H11C12.35 22 13.6 21.45 14.5 20.6C15.65 19.5 16.5 18 16.85 16.25C18.6 15.6 20.15 14.5 21.15 13C22.15 11.5 22.5 9.8 22.15 8.05L21.75 6.05C21.6 5.3 21 4.75 20.25 4.75H17V8ZM17 10H19.9L20.2 11.45C20.4 12.65 20.1 13.8 19.45 14.8C18.8 15.8 17.8 16.45 16.65 16.8L17 15C17 14.35 17 13.65 17 13V10ZM15 8V4C15 3.45 14.55 3 14 3H6C5.45 3 5 3.45 5 4V8H15Z"
              fill="white"
            />
            <path d="M5 4H15V2H6C4.9 2 4 2.9 4 4V8H5V4Z" fill="white" />
          </svg>
        </div>
        {!collapsed && (
          <div className="ml-3 flex flex-col justify-center min-w-0">
            <span className="text-[15px] font-extrabold text-[#245A34] leading-tight tracking-tight truncate">
              Leafy
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-3 overflow-y-auto space-y-0.5 ${collapsed ? 'px-1.5' : 'px-2.5'}`}>
        <div className="space-y-0.5">
          {coreNavItems.map((item) => renderNavItem(item))}
        </div>
        {renderSection('agriculture', t('nav.sectionAgriculture'), agricultureNavItems)}
        {renderSection('utility', t('nav.sectionOther'), utilityNavItems, utilityBadgeMap)}
      </nav>
    </aside>
  );
}
