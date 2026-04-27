import { MapPin, Sun, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../lib/routes";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();

  const tabs = [
    { name: "Khu vực", path: ROUTES.DASHBOARD.ROOT },
    { name: "Cảm biến", path: ROUTES.DASHBOARD.DEVICE_ONBOARDING },
  ];

  const activeTabName = location.pathname.includes("/devices")
    ? "Cảm biến"
    : "Khu vực";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="flex flex-col w-full h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 lg:px-8 h-16 shrink-0">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center text-gray-900">
              <MapPin
                className="w-5 h-5 text-[#245A34] mr-2"
                strokeWidth={2.5}
              />
              <h1 className="text-lg font-bold tracking-tight">
                Nông trại Cầu Đất
              </h1>
            </div>
          </div>

          <div className="hidden lg:flex items-center">
            {/* Tab Navigation */}
            <nav className="flex space-x-8 mr-12 px-6">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  to={tab.path}
                  className={`py-5 text-[15px] font-bold border-b-[3px] transition-colors whitespace-nowrap ${
                    activeTabName === tab.name
                      ? "border-[#245A34] text-[#245A34]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>

            <div className="w-px h-6 bg-slate-200 mr-8" />

            {/* Weather Widget */}
            <div className="flex items-center px-4 py-2 bg-[#F1F9F3] rounded-full">
              <Sun className="w-4 h-4 text-[#245A34] mr-2" strokeWidth={3} />
              <span className="text-[13px] font-bold text-[#245A34]">
                28°C | Nắng nhẹ
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

