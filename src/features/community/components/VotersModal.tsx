import { useState } from 'react'
import { ArrowBigDown, ArrowBigUp, Loader2, X } from 'lucide-react'
import { Avatar } from '../../../components/ui/Avatar'
import { usePostVoters } from '../queries'
import { formatDateTime } from '../../metrics-view/utils/format'
import type { CommunityVoteType } from '../types'

// ── helpers ──────────────────────────────────────────────────────────────────
function formatStat(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

// ── props ─────────────────────────────────────────────────────────────────────
interface VotersModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  initialTab?: CommunityVoteType
  upvoteCount: number
  downvoteCount: number
}

// ── component ─────────────────────────────────────────────────────────────────
export function VotersModal({
  isOpen,
  onClose,
  postId,
  initialTab = 'UPVOTE',
  upvoteCount,
  downvoteCount,
}: VotersModalProps) {
  const [activeTab, setActiveTab] = useState<CommunityVoteType>(initialTab)

  // Fetch both tabs independently so switching is instant after first load
  const upvotersQuery = usePostVoters(
    postId,
    'UPVOTE',
    { page: 0, size: 50 },
    isOpen,
  )
  const downvotersQuery = usePostVoters(
    postId,
    'DOWNVOTE',
    { page: 0, size: 50 },
    isOpen,
  )

  const activeQuery = activeTab === 'UPVOTE' ? upvotersQuery : downvotersQuery
  const voters = activeQuery.data?.content ?? []
  const isLoading = activeQuery.isLoading

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Danh sách bình chọn"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-md mx-auto bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[80dvh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-[16px] font-bold text-gray-900">
            Danh sách bình chọn
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            aria-label="Close voters list"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Segmented Tab ────────────────────────────────────────────── */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
            {/* Upvote tab */}
            <button
              type="button"
              onClick={() => setActiveTab('UPVOTE')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-semibold transition-all duration-150 ${
                activeTab === 'UPVOTE'
                  ? 'bg-[#245A34] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ArrowBigUp
                className={`w-4 h-4 ${activeTab === 'UPVOTE' ? 'fill-white' : 'fill-transparent'}`}
                strokeWidth={2}
              />
              Upvotes ({formatStat(upvoteCount)})
            </button>

            {/* Downvote tab */}
            <button
              type="button"
              onClick={() => setActiveTab('DOWNVOTE')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-semibold transition-all duration-150 ${
                activeTab === 'DOWNVOTE'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ArrowBigDown
                className={`w-4 h-4 ${activeTab === 'DOWNVOTE' ? 'fill-white' : 'fill-transparent'}`}
                strokeWidth={2}
              />
              Downvotes ({formatStat(downvoteCount)})
            </button>
          </div>
        </div>

        {/* ── List ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin" strokeWidth={2} />
              <p className="text-[13px] font-semibold">Đang tải danh sách...</p>
            </div>
          )}

          {/* Error */}
          {activeQuery.isError && !isLoading && (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-red-600">
                Không thể tải danh sách. Vui lòng thử lại.
              </p>
              <button
                type="button"
                onClick={() => void activeQuery.refetch()}
                className="mt-3 text-sm font-bold text-[#245A34] hover:underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !activeQuery.isError && voters.length === 0 && (
            <div className="py-14 flex flex-col items-center gap-3 text-slate-400">
              {activeTab === 'UPVOTE' ? (
                <ArrowBigUp className="w-12 h-12 opacity-20" strokeWidth={1.5} />
              ) : (
                <ArrowBigDown className="w-12 h-12 opacity-20" strokeWidth={1.5} />
              )}
              <p className="text-[14px] font-semibold text-center">
                Chưa có ai {activeTab === 'UPVOTE' ? 'upvote' : 'downvote'} bài viết này
              </p>
            </div>
          )}

          {/* Voter rows */}
          {!isLoading && voters.length > 0 && (
            <ul className="space-y-4 pt-1">
              {voters.map((voter) => {
                const name = voter.authorInfo?.fullName ?? 'Người dùng ẩn danh'
                const avatar = voter.authorInfo?.avatar ?? null
                const role = voter.authorInfo?.role ?? null
                const isUpvote = voter.type === 'UPVOTE'
                return (
                  <li key={voter.id} className="flex items-center gap-3">
                    <Avatar
                      src={avatar}
                      name={name}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">
                        {name}
                      </p>
                      {role && (
                        <p className="text-[11px] text-slate-400 font-medium truncate">
                          {role}
                        </p>
                      )}
                      {voter.createdAt && (
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {formatDateTime(voter.createdAt)}
                        </p>
                      )}
                    </div>
                    {/* Vote type badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isUpvote ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {isUpvote ? (
                        <ArrowBigUp
                          className="w-4 h-4 fill-[#245A34] text-[#245A34]"
                          strokeWidth={2}
                        />
                      ) : (
                        <ArrowBigDown
                          className="w-4 h-4 fill-red-500 text-red-500"
                          strokeWidth={2}
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
