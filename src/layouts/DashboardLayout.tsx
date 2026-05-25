import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useOpenAlertToastWatcher } from "../features/alerts/hooks/useOpenAlertToastWatcher";
import { PushNotificationsBootstrap } from "../features/notifications/components/PushNotificationsBootstrap";
import { SidebarCollapsedContext } from "./SidebarContext";

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useOpenAlertToastWatcher();

  return (
    <SidebarCollapsedContext.Provider value={collapsed}>
    <div className="flex bg-[var(--app-bg)] min-h-screen font-sans transition-colors">
      {/* Sidebar - Desktop is handled by CSS, Mobile needs state */}
      <Sidebar collapsed={collapsed} />

      {/* Collapse toggle — fixed to the sidebar's right edge, vertically centered */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        className={`fixed top-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center justify-center w-5 h-10 bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 rounded-r-lg shadow-sm transition-all duration-300 ease-in-out ${
          collapsed ? "left-14" : "left-56"
        }`}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-30 w-56 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar collapsed={false} />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "lg:pl-14" : "lg:pl-56"}`}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 h-full overflow-y-auto p-4 lg:p-8 space-y-6">
          <PushNotificationsBootstrap />
          <Outlet />
        </main>
      </div>
    </div>
    </SidebarCollapsedContext.Provider>
  );
}
