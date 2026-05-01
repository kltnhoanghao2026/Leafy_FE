import { useRef, useState } from 'react'
import { MapPin, Menu, Search, Sun, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../lib/routes'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { name: 'Khu vực', path: ROUTES.DASHBOARD.ROOT },
    { name: 'Cảm biến', path: ROUTES.DASHBOARD.DEVICE_ONBOARDING },
  ]

  const activeTabName = location.pathname.includes('/devices')
    ? 'Cảm biến'
    : 'Khu vực'

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = searchValue.trim()
    if (term.length < 2) return
    navigate(`${ROUTES.DASHBOARD.SEARCH}?q=${encodeURIComponent(term)}`)
    inputRef.current?.blur()
  }

  const clearSearch = () => {
    setSearchValue('')
    inputRef.current?.focus()
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16 gap-4">

        {/* Left: Hamburger + Farm name */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 text-gray-500 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden sm:flex items-center text-gray-900">
            <MapPin className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
            <h1 className="text-[17px] font-bold tracking-tight">
              Nông trại Cầu Đất
            </h1>
          </div>
        </div>

        {/* Centre: Search bar (grows to fill available space) */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl"
          role="search"
          aria-label="Global search"
        >
          <div
            className={`flex items-center rounded-full px-4 py-2 gap-2 transition-all duration-200 border ${
              searchFocused
                ? 'border-[#245A34] bg-white ring-2 ring-[#245A34]/10'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Search
              className={`w-4 h-4 shrink-0 transition-colors ${searchFocused ? 'text-[#245A34]' : 'text-slate-400'}`}
              strokeWidth={2.5}
            />
            <input
              ref={inputRef}
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Tìm kiếm bài viết, chuyên gia..."
              aria-label="Tìm kiếm"
              className="flex-1 bg-transparent text-[14px] font-medium text-slate-800 placeholder:text-slate-400 outline-none min-w-0"
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="shrink-0 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </form>

        {/* Right: Tab nav + weather (desktop only) */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {/* Tab Navigation */}
          <nav className="flex space-x-6" aria-label="Page tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                to={tab.path}
                className={`py-5 text-[14px] font-bold border-b-[3px] transition-colors whitespace-nowrap ${
                  activeTabName === tab.name
                    ? 'border-[#245A34] text-[#245A34]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </nav>

          <div className="w-px h-6 bg-slate-200" />

          {/* Weather Widget */}
          <div className="flex items-center px-4 py-2 bg-[#F1F9F3] rounded-full">
            <Sun className="w-4 h-4 text-[#245A34] mr-2" strokeWidth={3} />
            <span className="text-[13px] font-bold text-[#245A34]">
              28°C | Nắng nhẹ
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
