import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowBigUp,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  User,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../lib/routes'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { formatDateTime } from '../../metrics-view/utils/format'
import { Avatar } from '../../../components/ui/Avatar'
import { useUnifiedSearch, useSearchPosts, useSearchProfiles } from '../queries'
import type {
  SearchMode,
  SearchPostItem,
  SearchProfileItem,
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

  const [inputValue, setInputValue] = useState(urlQ)
  const debouncedInput = useDebouncedValue(inputValue, 350)

  // Sync input when navigating from Header
  useEffect(() => { setInputValue(urlQ) }, [urlQ])

  // Push debounced term to URL
  useEffect(() => {
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
  }), [urlQ])

  const postParams = useMemo<SearchPostsParams>(() => ({
    searchTerm: urlQ, page: urlPage, size: PAGE_SIZE,
  }), [urlQ, urlPage])

  const profileParams = useMemo<SearchProfilesParams>(() => ({
    searchTerm: urlQ, page: urlPage, size: PAGE_SIZE,
  }), [urlQ, urlPage])

  const unifiedQuery  = useUnifiedSearch(unifiedParams,  canSearch && urlTab === 'all')
  const postsQuery    = useSearchPosts(postParams,        canSearch && urlTab === 'posts')
  const profilesQuery = useSearchProfiles(profileParams,  canSearch && urlTab === 'profiles')

  const activeQuery = urlTab === 'all' ? unifiedQuery : urlTab === 'posts' ? postsQuery : profilesQuery
  const isLoading   = activeQuery.isLoading
  const isError     = activeQuery.isError

  // ── tabs config ───────────────────────────────────────────────────────────
  const tabs = [
    { key: 'all'      as TabMode, label: 'Tất cả',      icon: Layers },
    { key: 'posts'    as TabMode, label: 'Bài viết',    icon: MessageCircle },
    { key: 'profiles' as TabMode, label: 'Chuyên gia',  icon: Users },
  ]

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">

      {/* ── Hero search bar ────────────────────────────────────────────── */}
      <div className="rounded-[2rem] bg-gradient-to-br from-[#1a4228] to-[#2d7248] p-6 shadow-lg">
        <h1 className="text-[21px] font-black text-white mb-1 tracking-tight">Tìm kiếm</h1>
        <p className="text-[13px] text-green-200/70 mb-5">
          Tìm bài viết và chuyên gia từ một từ khoá duy nhất
        </p>

        <form onSubmit={handleSubmit} role="search">
          <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all bg-white/10 backdrop-blur-sm ${
            inputValue ? 'border-white/40' : 'border-white/20'
          }`}>
            <Search className="w-4 h-4 text-white/60 shrink-0" strokeWidth={2.5} />
            <input
              ref={inputRef}
              type="search"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Nhập ít nhất 2 ký tự..."
              aria-label="Từ khoá tìm kiếm"
              className="flex-1 bg-transparent text-[15px] font-semibold text-white placeholder:text-white/40 outline-none"
              autoFocus
            />
            {inputValue && (
              <button type="button" onClick={() => { setInputValue(''); inputRef.current?.focus() }}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 shrink-0 transition-colors"
                aria-label="Xoá">
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
            <button type="submit"
              disabled={inputValue.trim().length < MIN_LENGTH}
              className="shrink-0 px-5 py-2 bg-white text-[#245A34] text-[13px] font-black rounded-xl hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Tìm
            </button>
          </div>
        </form>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                urlTab === key
                  ? 'bg-white text-[#245A34] shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}>
              <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

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
          title="Chuyên gia"
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
            ? <EmptyState message="Không tìm thấy chuyên gia nào" />
            : <ProfileList profiles={profilesQuery.data.items} />
          }
        </PaginatedSection>
      )}
    </div>
  )
}

// ── All results view ──────────────────────────────────────────────────────────
function AllResults({
  data, keyword, onSeeAllPosts, onSeeAllProfiles,
}: {
  data: { posts: SearchPostItem[]; profiles: SearchProfileItem[]; totalPosts: number; totalProfiles: number }
  keyword: string
  onSeeAllPosts: () => void
  onSeeAllProfiles: () => void
}) {
  const noPosts    = data.posts.length === 0
  const noProfiles = data.profiles.length === 0

  if (noPosts && noProfiles) {
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
            title="Chuyên gia"
            total={data.totalProfiles}
            onSeeAll={onSeeAllProfiles}
          />
          <ProfileList profiles={data.profiles} />
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
function PaginatedSection({ title, icon, totalItems, page, totalPages, hasPrev, hasNext, onPrev, onNext, children }: {
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
