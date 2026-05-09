import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowBigUp,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  Globe,
  Layers,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../lib/routes'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { formatDateTime } from '../../metrics-view/utils/format'
import { Avatar } from '../../../components/ui/Avatar'
import { Select } from '../../../components/ui/Select'
import { useUnifiedSearch, useSearchPosts, useSearchProfiles, useSearchPlans } from '../queries'
import type {
  SearchMode,
  SearchPlanItem,
  SearchPostItem,
  SearchProfileItem,
  SearchPlansParams,
  SearchPostsParams,
  SearchProfilesParams,
  UnifiedSearchParams,
} from '../types'

// ── constants ─────────────────────────────────────────────────────────────────
const MIN_LENGTH   = 2
const PAGE_SIZE    = 10
const UNIFIED_SIZE = 5   // items per section in "All" view

type TabMode = 'all' | SearchMode

function fmtStat(n: number | null | undefined) {
  if (!n) return '0'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ── page ──────────────────────────────────────────────────────────────────────
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const urlQ    = searchParams.get('q') ?? ''
  const urlTab  = (searchParams.get('tab') as TabMode) ?? 'all'
  const urlPage = parseInt(searchParams.get('page') ?? '0', 10)

  const urlPostType = searchParams.get('postType') ?? undefined
  const urlRole = searchParams.get('role') ?? undefined
  const urlSeverity = searchParams.get('severityLevel') ?? undefined
  const urlUrgency = searchParams.get('urgency') ?? undefined
  const urlIsPublicStr = searchParams.get('isPublic')
  const urlIsPublic = urlIsPublicStr === 'true' ? true : urlIsPublicStr === 'false' ? false : undefined
  const urlIsVerifiedStr = searchParams.get('isVerified')
  const urlIsVerified = urlIsVerifiedStr === 'true' ? true : urlIsVerifiedStr === 'false' ? false : undefined
  const urlSortDir = (searchParams.get('sortDir') as 'ASC' | 'DESC') ?? undefined

  const [inputValue, setInputValue] = useState(urlQ)
  const [filterOpen, setFilterOpen] = useState(false)
  const composingRef = useRef(false)
  const debouncedInput = useDebouncedValue(inputValue, 350)

  // Sync input when navigating from Header
  useEffect(() => { setInputValue(urlQ) }, [urlQ])

  // Push debounced term to URL (skip during IME composition)
  useEffect(() => {
    if (composingRef.current) return
    const term = debouncedInput.trim()
    if (term === urlQ || term.length < MIN_LENGTH) return
    setSearchParams(p => {
      const n = new URLSearchParams(p)
      n.set('q', term); n.set('page', '0')
      return n
    }, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput])

  const setTab = useCallback((tab: TabMode) => {
    setSearchParams(p => {
      const n = new URLSearchParams(p)
      n.set('tab', tab); n.set('page', '0')
      return n
    })
  }, [setSearchParams])

  const setPage = useCallback((page: number) => {
    setSearchParams(p => {
      const n = new URLSearchParams(p)
      n.set('page', String(page))
      return n
    })
  }, [setSearchParams])

  const setFilter = useCallback((key: string, value: string | undefined) => {
    setSearchParams(p => {
      const n = new URLSearchParams(p)
      if (value) n.set(key, value)
      else n.delete(key)
      n.set('page', '0')
      return n
    })
  }, [setSearchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = inputValue.trim()
    if (term.length < MIN_LENGTH) return
    setSearchParams({ q: term, tab: urlTab, page: '0' })
  }

  const canSearch = urlQ.trim().length >= MIN_LENGTH

  // ── data queries ─────────────────────────────────────────────────────────
  const unifiedParams = useMemo<UnifiedSearchParams>(() => ({
    searchTerm: urlQ,
    postSize: UNIFIED_SIZE,
    profileSize: UNIFIED_SIZE,
    planSize: UNIFIED_SIZE,
  }), [urlQ])

  const postParams = useMemo<SearchPostsParams>(() => ({
    searchTerm: urlQ, page: urlPage, size: PAGE_SIZE, postType: urlPostType, sortBy: 'createdAt', sortDir: urlSortDir
  }), [urlQ, urlPage, urlPostType, urlSortDir])

  const profileParams = useMemo<SearchProfilesParams>(() => ({
    searchTerm: urlQ, page: urlPage, size: PAGE_SIZE, role: urlRole, isVerified: urlIsVerified, sortBy: 'createdAt', sortDir: urlSortDir
  }), [urlQ, urlPage, urlRole, urlIsVerified, urlSortDir])

  const planParams = useMemo<SearchPlansParams>(() => ({
    searchTerm: urlQ, page: urlPage, size: PAGE_SIZE, severityLevel: urlSeverity, urgency: urlUrgency, isPublic: urlIsPublic, sortBy: 'createdAt', sortDir: urlSortDir
  }), [urlQ, urlPage, urlSeverity, urlUrgency, urlIsPublic, urlSortDir])

  const unifiedQuery  = useUnifiedSearch(unifiedParams,  canSearch && urlTab === 'all')
  const postsQuery    = useSearchPosts(postParams,        canSearch && urlTab === 'posts')
  const profilesQuery = useSearchProfiles(profileParams,  canSearch && urlTab === 'profiles')
  const plansQuery    = useSearchPlans(planParams,        canSearch && urlTab === 'plans')

  const activeQuery = urlTab === 'all' ? unifiedQuery : urlTab === 'posts' ? postsQuery : urlTab === 'profiles' ? profilesQuery : plansQuery
  const isLoading   = activeQuery.isLoading
  const isError     = activeQuery.isError

  // count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (urlSortDir) count++
    if (urlTab === 'posts' && urlPostType) count++
    if (urlTab === 'profiles') {
      if (urlRole) count++
      if (urlIsVerifiedStr) count++
    }
    if (urlTab === 'plans') {
      if (urlSeverity) count++
      if (urlUrgency) count++
      if (urlIsPublicStr) count++
    }
    return count
  }, [urlTab, urlSortDir, urlPostType, urlRole, urlIsVerifiedStr, urlSeverity, urlUrgency, urlIsPublicStr])

  const clearAllFilters = useCallback(() => {
    setSearchParams(p => {
      const n = new URLSearchParams(p)
      n.delete('sortDir')
      n.delete('postType')
      n.delete('role')
      n.delete('isVerified')
      n.delete('severityLevel')
      n.delete('urgency')
      n.delete('isPublic')
      n.set('page', '0')
      return n
    })
  }, [setSearchParams])

  // ── tabs config ───────────────────────────────────────────────────────────
  const tabs = [
    { key: 'all'      as TabMode, label: 'Tất cả',        icon: Layers },
    { key: 'posts'    as TabMode, label: 'Bài viết',      icon: MessageCircle },
    { key: 'profiles' as TabMode, label: 'Hồ sơ',         icon: Users },
    { key: 'plans'    as TabMode, label: 'Kế hoạch',      icon: ClipboardList },
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8 pb-12 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            Global Search
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            Tìm kiếm
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Tìm bài viết, chuyên gia và kế hoạch điều trị từ một từ khoá duy nhất.
          </p>
        </div>
      </header>

      {/* ── Search Input & Tabs ── */}
      <div className="flex flex-col gap-5">
        <form onSubmit={handleSubmit} role="search" className="w-full max-w-2xl">
          <div className="relative group flex items-center bg-white border-2 border-slate-200 rounded-2xl transition-all focus-within:border-[#245A34] focus-within:shadow-[0_0_0_4px_rgba(36,90,52,0.1)]">
            <div className="pl-4 pr-3 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#245A34] transition-colors" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={e => {
                composingRef.current = false
                setInputValue((e.target as HTMLInputElement).value)
              }}
              placeholder="Nhập ít nhất 2 ký tự..."
              aria-label="Từ khoá tìm kiếm"
              className="flex-1 py-3.5 bg-transparent text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
              autoFocus
            />
            {inputValue && (
              <button type="button" onClick={() => { setInputValue(''); inputRef.current?.focus() }}
                className="px-2 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Xoá">
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
            <button type="submit"
              disabled={inputValue.trim().length < MIN_LENGTH}
              className="mr-2 shrink-0 px-5 py-2 bg-[#245A34] text-white text-[13px] font-bold rounded-xl hover:bg-[#1a4226] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Tìm
            </button>
          </div>
        </form>

        {/* Tab switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex gap-2 flex-wrap">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all ${
                  urlTab === key
                    ? 'bg-green-50 text-[#245A34]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}>
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {label}
              </button>
            ))}
          </div>

          {urlTab !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#245A34] text-white text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Modal ──────────────────────────────────────────────── */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          {/* panel */}
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#245A34]" strokeWidth={2.5} />
                Bộ lọc tìm kiếm
              </h3>
              <button type="button" onClick={() => setFilterOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-5 space-y-5">
              {/* Common: Sort by date */}
              <div>
                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Sắp xếp theo ngày tạo</label>
                <Select
                  size="sm"
                  value={urlSortDir ?? ''}
                  onChange={v => setFilter('sortDir', v as string)}
                  options={[
                    { value: '', label: 'Mặc định' },
                    { value: 'DESC', label: 'Mới nhất' },
                    { value: 'ASC', label: 'Cũ nhất' },
                  ]}
                />
              </div>

              {/* Posts filters */}
              {urlTab === 'posts' && (
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Loại bài viết</label>
                  <Select
                    size="sm"
                    value={urlPostType ?? ''}
                    onChange={v => setFilter('postType', v as string)}
                    options={[
                      { value: '', label: 'Tất cả loại' },
                      { value: 'GENERAL', label: 'Bài viết chung' },
                      { value: 'QUESTION', label: 'Hỏi đáp' },
                      { value: 'PLAN_SHARE', label: 'Chia sẻ kế hoạch' },
                    ]}
                  />
                </div>
              )}

              {/* Profiles filters */}
              {urlTab === 'profiles' && (
                <>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Vai trò</label>
                    <Select
                      size="sm"
                      value={urlRole ?? ''}
                      onChange={v => setFilter('role', v as string)}
                      options={[
                        { value: '', label: 'Tất cả vai trò' },
                        { value: 'FARMER', label: 'Nông dân' },
                        { value: 'EXPERT', label: 'Chuyên gia' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Xác minh</label>
                    <Select
                      size="sm"
                      value={urlIsVerifiedStr ?? ''}
                      onChange={v => setFilter('isVerified', v as string)}
                      options={[
                        { value: '', label: 'Tất cả' },
                        { value: 'true', label: 'Đã xác minh' },
                        { value: 'false', label: 'Chưa xác minh' },
                      ]}
                    />
                  </div>
                </>
              )}

              {/* Plans filters */}
              {urlTab === 'plans' && (
                <>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Mức độ bệnh</label>
                    <Select
                      size="sm"
                      value={urlSeverity ?? ''}
                      onChange={v => setFilter('severityLevel', v as string)}
                      options={[
                        { value: '', label: 'Tất cả' },
                        { value: 'LOW', label: 'Nhẹ' },
                        { value: 'MEDIUM', label: 'Trung bình' },
                        { value: 'HIGH', label: 'Nặng' },
                        { value: 'CRITICAL', label: 'Rất nặng' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Mức độ ưu tiên</label>
                    <Select
                      size="sm"
                      value={urlUrgency ?? ''}
                      onChange={v => setFilter('urgency', v as string)}
                      options={[
                        { value: '', label: 'Tất cả' },
                        { value: 'NORMAL', label: 'Bình thường' },
                        { value: 'HIGH', label: 'Cao' },
                        { value: 'IMMEDIATE', label: 'Khẩn cấp' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Quyền riêng tư</label>
                    <Select
                      size="sm"
                      value={urlIsPublicStr ?? ''}
                      onChange={v => setFilter('isPublic', v as string)}
                      options={[
                        { value: '', label: 'Tất cả' },
                        { value: 'true', label: 'Công khai' },
                        { value: 'false', label: 'Riêng tư' },
                      ]}
                    />
                  </div>
                </>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <button type="button" onClick={clearAllFilters}
                className="text-[13px] font-bold text-slate-500 hover:text-red-600 transition-colors">
                Xóa bộ lọc
              </button>
              <button type="button" onClick={() => setFilterOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#245A34] text-white text-[13px] font-bold hover:bg-[#1a4226] transition-colors">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty prompt ──────────────────────────────────────────────── */}
      {!canSearch && (
        <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm p-14 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
            <Search className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-bold text-slate-600">Nhập từ khoá để tìm kiếm</p>
          <p className="text-[13px] text-slate-400 -mt-2">Cần ít nhất 2 ký tự</p>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {canSearch && isLoading && (
        <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm p-12 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" strokeWidth={2} />
          <p className="text-[14px] font-semibold">Đang tìm kiếm...</p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {canSearch && isError && !isLoading && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-bold text-red-700">Không thể tải kết quả</p>
            <p className="text-[12px] text-red-500 mt-0.5">Dịch vụ tìm kiếm trả về lỗi. Vui lòng thử lại.</p>
          </div>
          <button onClick={() => void activeQuery.refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 shrink-0">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.5} /> Thử lại
          </button>
        </div>
      )}

      {/* ── ALL tab ───────────────────────────────────────────────────── */}
      {canSearch && urlTab === 'all' && unifiedQuery.data && !isError && !isLoading && (
        <AllResults
          data={unifiedQuery.data}
          keyword={urlQ}
          onSeeAllPosts={() => setTab('posts')}
          onSeeAllProfiles={() => setTab('profiles')}
          onSeeAllPlans={() => setTab('plans')}
        />
      )}

      {/* ── POSTS tab ─────────────────────────────────────────────────── */}
      {canSearch && urlTab === 'posts' && postsQuery.data && !isError && !isLoading && (
        <PaginatedSection
          title="Bài viết"
          icon={<MessageCircle className="w-4 h-4" strokeWidth={2.5} />}
          totalItems={postsQuery.data.totalItems}
          page={urlPage}
          totalPages={postsQuery.data.totalPages}
          hasPrev={postsQuery.data.hasPrevious}
          hasNext={postsQuery.data.hasNext}
          onPrev={() => setPage(Math.max(urlPage - 1, 0))}
          onNext={() => setPage(urlPage + 1)}
          keyword={urlQ}
        >
          {postsQuery.data.items.length === 0
            ? <EmptyState message="Không tìm thấy bài viết nào" />
            : <PostList posts={postsQuery.data.items} keyword={urlQ} />
          }
        </PaginatedSection>
      )}

      {/* ── PROFILES tab ──────────────────────────────────────────────── */}
      {canSearch && urlTab === 'profiles' && profilesQuery.data && !isError && !isLoading && (
        <PaginatedSection
          title="Hồ sơ"
          icon={<Users className="w-4 h-4" strokeWidth={2.5} />}
          totalItems={profilesQuery.data.totalItems}
          page={urlPage}
          totalPages={profilesQuery.data.totalPages}
          hasPrev={profilesQuery.data.hasPrevious}
          hasNext={profilesQuery.data.hasNext}
          onPrev={() => setPage(Math.max(urlPage - 1, 0))}
          onNext={() => setPage(urlPage + 1)}
          keyword={urlQ}
        >
          {profilesQuery.data.items.length === 0
            ? <EmptyState message="Không tìm thấy hồ sơ nào" />
            : <ProfileList profiles={profilesQuery.data.items} />
          }
        </PaginatedSection>
      )}

      {/* ── PLANS tab ──────────────────────────────────────────────────── */}
      {canSearch && urlTab === 'plans' && plansQuery.data && !isError && !isLoading && (
        <PaginatedSection
          title="Kế hoạch điều trị"
          icon={<ClipboardList className="w-4 h-4" strokeWidth={2.5} />}
          totalItems={plansQuery.data.totalItems}
          page={urlPage}
          totalPages={plansQuery.data.totalPages}
          hasPrev={plansQuery.data.hasPrevious}
          hasNext={plansQuery.data.hasNext}
          onPrev={() => setPage(Math.max(urlPage - 1, 0))}
          onNext={() => setPage(urlPage + 1)}
          keyword={urlQ}
        >
          {plansQuery.data.items.length === 0
            ? <EmptyState message="Không tìm thấy kế hoạch nào" />
            : <PlanList plans={plansQuery.data.items} keyword={urlQ} />
          }
        </PaginatedSection>
      )}
    </div>
  )
}

// ── All results view ──────────────────────────────────────────────────────────
function AllResults({
  data, keyword, onSeeAllPosts, onSeeAllProfiles, onSeeAllPlans,
}: {
  data: { posts: SearchPostItem[]; profiles: SearchProfileItem[]; plans?: SearchPlanItem[]; totalPosts: number; totalProfiles: number; totalPlans?: number }
  keyword: string
  onSeeAllPosts: () => void
  onSeeAllProfiles: () => void
  onSeeAllPlans: () => void
}) {
  const noPosts    = data.posts.length === 0
  const noProfiles = data.profiles.length === 0
  const noPlans    = !data.plans || data.plans.length === 0

  if (noPosts && noProfiles && noPlans) {
    return (
      <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm p-14 flex flex-col items-center gap-3">
        <Search className="w-10 h-10 text-slate-200" strokeWidth={1.5} />
        <p className="text-[15px] font-bold text-slate-600">Không tìm thấy kết quả</p>
        <p className="text-[13px] text-slate-400">Thử từ khoá khác</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Posts section */}
      {!noPosts && (
        <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm overflow-hidden">
          <SectionHeader
            icon={<MessageCircle className="w-4 h-4" strokeWidth={2.5} />}
            title="Bài viết"
            total={data.totalPosts}
            onSeeAll={onSeeAllPosts}
          />
          <PostList posts={data.posts} keyword={keyword} />
        </div>
      )}

      {/* Profiles section */}
      {!noProfiles && (
        <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm overflow-hidden">
          <SectionHeader
            icon={<Users className="w-4 h-4" strokeWidth={2.5} />}
            title="Hồ sơ"
            total={data.totalProfiles}
            onSeeAll={onSeeAllProfiles}
          />
          <ProfileList profiles={data.profiles} />
        </div>
      )}

      {/* Plans section */}
      {!noPlans && data.plans && (
        <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm overflow-hidden">
          <SectionHeader
            icon={<ClipboardList className="w-4 h-4" strokeWidth={2.5} />}
            title="Kế hoạch điều trị"
            total={data.totalPlans ?? 0}
            onSeeAll={onSeeAllPlans}
          />
          <PlanList plans={data.plans} keyword={keyword} />
        </div>
      )}
    </div>
  )
}

// ── Section header (All view) ─────────────────────────────────────────────────
function SectionHeader({ icon, title, total, onSeeAll }: {
  icon: React.ReactNode; title: string; total: number; onSeeAll: () => void
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
      <div className="flex items-center gap-2 text-[14px] font-bold text-gray-800">
        <span className="text-[#245A34]">{icon}</span>
        {title}
        <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-[12px] font-bold text-slate-500">
          {fmtStat(total)}
        </span>
      </div>
      {total > UNIFIED_SIZE && (
        <button onClick={onSeeAll}
          className="text-[13px] font-bold text-[#245A34] hover:underline">
          Xem tất cả →
        </button>
      )}
    </div>
  )
}

// ── Paginated section wrapper (Posts/Profiles tabs) ────────────────────────────
function PaginatedSection({ title, icon, totalItems, page, totalPages, hasPrev, hasNext, onPrev, onNext, keyword, children }: {
  title: string; icon: React.ReactNode; totalItems: number
  page: number; totalPages: number; hasPrev: boolean; hasNext: boolean
  onPrev: () => void; onNext: () => void; keyword: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 text-[14px] font-bold text-gray-800">
          <span className="text-[#245A34]">{icon}</span>
          {title}
          <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-[12px] font-bold text-slate-500">
            {fmtStat(totalItems)}
          </span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button onClick={onPrev} disabled={!hasPrev} aria-label="Trang trước"
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <span className="text-[12px] font-semibold text-slate-400 min-w-[50px] text-center">
              {page + 1}/{totalPages}
            </span>
            <button onClick={onNext} disabled={!hasNext} aria-label="Trang sau"
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Post list ─────────────────────────────────────────────────────────────────
function PostList({ posts, keyword }: { posts: SearchPostItem[]; keyword: string }) {
  return (
    <ul className="divide-y divide-slate-100">
      {posts.map(post => {
        const name   = post.authorInfo?.fullName ?? 'Người dùng'
        const avatar = post.authorInfo?.avatar ?? null
        const body   = post.caption ?? post.title ?? ''
        return (
          <li key={post.id}>
            <Link to={`${ROUTES.DASHBOARD.COMMUNITY}?post=${encodeURIComponent(post.id)}`}
              className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors group">
              <Avatar src={avatar} name={name} alt={name} size="lg"
                className="shrink-0 mt-0.5 border border-slate-200" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[13px] font-bold text-gray-900">{name}</span>
                  {post.authorInfo?.isVerified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-[#245A34]" strokeWidth={2.5} />
                  )}
                  {post.postType && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      post.postType === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-[#245A34]'
                    }`}>{post.postType}</span>
                  )}
                </div>
                {body && (
                  <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
                    <Highlighted text={body} keyword={keyword} />
                  </p>
                )}
                {post.hashtags && post.hashtags.length > 0 && (
                  <p className="mt-1 text-[11px] text-[#245A34] font-medium">{post.hashtags.join(' ')}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                  {post.uploadedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      {formatDateTime(post.uploadedAt)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ArrowBigUp className="w-3 h-3" strokeWidth={2} />
                    {fmtStat(post.upvoteCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" strokeWidth={2} />
                    {fmtStat(post.commentCount)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

// ── Profile list ──────────────────────────────────────────────────────────────
function ProfileList({ profiles }: { profiles: SearchProfileItem[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {profiles.map(profile => {
        const avatar = profile.avatar ?? profile.profilePicture ?? null
        const name   = profile.fullName ?? 'Người dùng'
        return (
          <li key={profile.id} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors group">
            <Link to={ROUTES.DASHBOARD.PROFILE_VIEW(profile.userId!)} className="block shrink-0">
              <Avatar src={avatar} name={name} alt={name} size="xl"
                className="border border-slate-200" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <Link to={ROUTES.DASHBOARD.PROFILE_VIEW(profile.userId!)} className="text-[14px] font-bold text-gray-900 hover:text-[#10B981] hover:underline transition-colors">
                  {name}
                </Link>
                {profile.isVerified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-[#245A34]" strokeWidth={2.5} />
                )}
                {profile.role && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                    {profile.role}
                  </span>
                )}
              </div>
              {profile.specialty && (
                <p className="text-[12px] font-semibold text-[#245A34] mb-1">{profile.specialty}</p>
              )}
              {profile.bio && (
                <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed">{profile.bio}</p>
              )}
              {profile.addressLine && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <MapPin className="w-3 h-3" strokeWidth={2} />
                  {profile.addressLine}
                </p>
              )}
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-full bg-slate-50 items-center justify-center shrink-0 text-slate-300">
              <User className="w-4 h-4" strokeWidth={2} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-14 flex flex-col items-center gap-3">
      <Search className="w-10 h-10 text-slate-200" strokeWidth={1.5} />
      <p className="text-[14px] font-bold text-slate-500">{message}</p>
    </div>
  )
}

// ── Plan list ─────────────────────────────────────────────────────────────────
function PlanList({ plans, keyword }: { plans: SearchPlanItem[]; keyword: string }) {
  const severityColors: Record<string, string> = {
    LOW: 'bg-green-50 text-green-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    HIGH: 'bg-red-50 text-red-700',
  }
  const urgencyColors: Record<string, string> = {
    NORMAL: 'bg-slate-100 text-slate-600',
    HIGH: 'bg-orange-50 text-orange-700',
    IMMEDIATE: 'bg-red-50 text-red-700',
  }

  return (
    <ul className="divide-y divide-slate-100">
      {plans.map(plan => {
        const name = plan.creatorInfo?.fullName ?? 'Người dùng'
        const avatar = plan.creatorInfo?.avatar ?? null
        const title = plan.planName || plan.diseaseName || 'Kế hoạch điều trị'
        return (
          <li key={plan.id}>
            <Link to={ROUTES.DASHBOARD.PLAN_DETAIL(plan.id)}
              className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors group">
              <div className="shrink-0 mt-0.5 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[#245A34]" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[14px] font-bold text-gray-900">
                    <Highlighted text={title} keyword={keyword} />
                  </span>
                  {plan.isPublic
                    ? <Globe className="w-3 h-3 text-blue-400" strokeWidth={2} />
                    : <Lock className="w-3 h-3 text-slate-400" strokeWidth={2} />
                  }
                  {plan.isConsulted && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-black uppercase text-purple-600">Tư vấn</span>
                  )}
                </div>
                {plan.diseaseName && plan.planName && (
                  <p className="text-[13px] text-slate-600 line-clamp-1 leading-relaxed mb-1">
                    <Highlighted text={plan.diseaseName} keyword={keyword} />
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {plan.severityLevel && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${severityColors[plan.severityLevel] ?? 'bg-slate-100 text-slate-500'}`}>
                      <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5 -mt-px" strokeWidth={2.5} />
                      {plan.severityLevel}
                    </span>
                  )}
                  {plan.urgency && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${urgencyColors[plan.urgency] ?? 'bg-slate-100 text-slate-500'}`}>
                      <Zap className="w-2.5 h-2.5 inline mr-0.5 -mt-px" strokeWidth={2.5} />
                      {plan.urgency}
                    </span>
                  )}
                  {plan.estimatedCost && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-50 text-[10px] font-bold text-slate-500">
                      {plan.estimatedCost}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Avatar src={avatar} name={name} alt={name} size="xs" className="border border-slate-200" />
                    {name}
                    {plan.creatorInfo?.isVerified && <BadgeCheck className="w-3 h-3 text-[#245A34]" strokeWidth={2.5} />}
                  </span>
                  {plan.eventCount != null && plan.eventCount > 0 && (
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" strokeWidth={2} />
                      {plan.eventCount} sự kiện
                    </span>
                  )}
                  {plan.applyCount != null && plan.applyCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" strokeWidth={2} />
                      {fmtStat(plan.applyCount)} áp dụng
                    </span>
                  )}
                  {plan.createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      {formatDateTime(plan.createdAt)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

// ── Keyword highlighter ───────────────────────────────────────────────────────
function Highlighted({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5 not-italic">{part}</mark>
          : part
      )}
    </>
  )
}

export default SearchPage
