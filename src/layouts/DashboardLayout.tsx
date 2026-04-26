import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PushNotificationsBootstrap } from "../features/notifications/components/PushNotificationsBootstrap";
import { ExpertPendingRequests } from "../features/community/components/ExpertPendingRequests";

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#F8FAF9] min-h-screen font-sans">
      {/* Sidebar - Desktop is handled by CSS, Mobile needs state */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Wrapper */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          <PushNotificationsBootstrap />
          <ExpertPendingRequests />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
