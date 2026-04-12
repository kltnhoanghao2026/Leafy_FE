import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AuthSessionBootstrap } from "../features/auth/components/AuthSessionBootstrap";
import { PushNotificationsBootstrap } from "../features/notifications/components/PushNotificationsBootstrap";

export function AdminLayout() {
  return (
    <div className="flex bg-slate-100 min-h-screen font-sans">
      <AuthSessionBootstrap />
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <PushNotificationsBootstrap />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
