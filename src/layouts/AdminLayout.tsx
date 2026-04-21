import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex bg-slate-100 min-h-screen font-sans">
      <AdminSidebar collapsed={collapsed} />

      {/* Collapse toggle — fixed to the sidebar's right edge, vertically centered */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        className={`fixed top-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center justify-center w-5 h-10 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-r-lg shadow-md transition-all duration-300 ease-in-out ${
          collapsed ? "left-16" : "left-64"
        }`}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
        )}
      </button>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
