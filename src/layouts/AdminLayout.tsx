import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AuthSessionBootstrap } from "../features/auth/components/AuthSessionBootstrap";
import { PushNotificationsBootstrap } from "../features/notifications/components/PushNotificationsBootstrap";

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex bg-slate-100 min-h-screen font-sans">
      <AuthSessionBootstrap />
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <PushNotificationsBootstrap />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
