import { MapPin, Sun, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const tabs = ['Khu vực', 'Cảm biến', 'Báo cáo']
  const activeTab = 'Khu vực'

  return (
    <header className="sticky top-0 z-10 bg-transparent py-4">
      <div className="flex flex-col w-full h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 lg:px-10 h-16 shrink-0 bg-white/60 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center text-gray-900">
              <MapPin className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
              <h1 className="text-lg font-bold tracking-tight">Nông trại Cầu Đất</h1>
            </div>
          </div>

          <div className="hidden lg:flex items-center">
            {/* Tab Navigation */}
            <nav className="flex space-x-8 mr-12 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`py-5 text-[15px] font-bold border-b-[3px] transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-[#245A34] text-[#245A34]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="w-px h-6 bg-slate-200 mr-8" />

            {/* Weather Widget */}
            <div className="flex items-center px-4 py-2 bg-[#F1F9F3] rounded-full">
              <Sun className="w-4 h-4 text-[#245A34] mr-2" strokeWidth={3} />
              <span className="text-[13px] font-bold text-[#245A34]">28°C | Nắng nhẹ</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
