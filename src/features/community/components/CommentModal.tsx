import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  RefreshCw,
  Send,
  X,
} from 'lucide-react'
import type { Post } from '../types'
import { CommentItem } from './CommentItem'
import { Avatar } from '../../../components/ui/Avatar'
import { useCommunityCurrentUser } from '../hooks/useCommunityCurrentUser'
import {
  useCommunityComments,
  useCreateCommunityComment,
} from '../queries'
import { SharedPostEmbed } from './SharedPostEmbed'
import { MediaImage } from './MediaImage'

// ── helpers ─────────────────────────────────────────────────────────────────
function formatStat(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

// ── props ────────────────────────────────────────────────────────────────────
interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post
  /** Live optimistic counts passed down from PostCard */
  upvoteCount: number
  downvoteCount: number
  userVote: 'UPVOTE' | 'DOWNVOTE' | null
  onVote: (type: 'UPVOTE' | 'DOWNVOTE') => void
  isVoting: boolean
  /** Bubble up to PostCard's VotersModal */
  onOpenVoters: (tab: 'UPVOTE' | 'DOWNVOTE') => void
}

// ── component ─────────────────────────────────────────────────────────────────
export function CommentModal({
  isOpen,
  onClose,
  post,
  upvoteCount,
  downvoteCount,
  userVote,
  onVote,
  isVoting,
  onOpenVoters,
}: CommentModalProps) {
  const [commentText, setCommentText] = useState('')
  const [page, setPage] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const currentUser = useCommunityCurrentUser()

  const commentsQuery = useCommunityComments(post.id, { page, size: 20 }, isOpen)
  const createComment = useCreateCommunityComment()
  const commentsPage = commentsQuery.data
  const comments = commentsPage?.items ?? []

  const score = upvoteCount - downvoteCount
  const upvoteActive = userVote === 'UPVOTE'
  const downvoteActive = userVote === 'DOWNVOTE'
  const titleText = post.title?.trim() || null
  const bodyText = post.content || ''
  const isShare = post.postType === 'SHARE'

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    } else {
      setCommentText('')
      setPage(0)
    }
  }, [isOpen])

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!commentText.trim()) return
    try {
      await createComment.mutateAsync({
        postId: post.id,
        content: commentText.trim(),
        media: [],
      })
      setCommentText('')
      setPage(0)
    } catch {
      // error rendered below
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Comments"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-2xl mx-auto h-[92dvh] sm:h-[88dvh] bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250 overflow-hidden">

        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#245A34]" strokeWidth={2.5} />
            <h2 className="text-[16px] font-bold text-gray-900">
              Bình luận
              {commentsPage && (
                <span className="ml-1.5 text-[14px] font-medium text-slate-400">
                  ({formatStat(commentsPage.totalItems)})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            aria-label="Close comments"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Post mini-preview */}
          <div className="border-b border-slate-100/80">
            {/* Padded section: author + text + hashtags + shared embed */}
            <div className="px-6 pt-5 pb-3">
              {/* Author row */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  src={post.author.avatar}
                  name={post.author.name}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <p className="text-[14px] font-bold text-gray-900 leading-tight">
                    {post.author.name}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {post.timestamp}
                    {post.location ? ` • ${post.location}` : ''}
                  </p>
                </div>
                {post.isUrgent && (
                  <span className="ml-auto px-2.5 py-1 bg-red-50 text-[#DC2626] text-[10px] font-black uppercase tracking-widest rounded-md">
                    Khẩn cấp
                  </span>
                )}
              </div>

              {/* Content */}
              {titleText && (
                <p className="text-[15px] font-semibold text-gray-900 leading-snug mb-1">
                  {titleText}
                </p>
              )}
              {bodyText && (
                <p className="text-[14px] text-gray-800 leading-relaxed line-clamp-3">
                  {bodyText}
                </p>
              )}
              {post.hashtags && post.hashtags.length > 0 && (
                <p className="mt-1.5 text-[12px] text-[#245A34] font-medium">
                  {post.hashtags.join(' ')}
                </p>
              )}

              {/* Shared embed (compact) */}
              {isShare && post.sharedPost && (
                <div className="mt-3">
                  <SharedPostEmbed post={post.sharedPost} />
                </div>
              )}
            </div>

            {/* Media — full-width, edge-to-edge, only for non-share posts */}
            {!isShare && post.images && post.images.length > 0 && (
              <div className="bg-slate-50 border-t border-slate-100/60">
                <MediaImage
                  source={post.images[0]}
                  alt="Post attachment"
                  className="w-full object-cover max-h-[320px] h-auto"
                />
              </div>
            )}

            {/* Vote row */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
              {/* Capsule */}
              <div className="flex items-center rounded-full bg-slate-100 px-1 py-0.5">
                <button
                  onClick={() => onVote('UPVOTE')}
                  disabled={isVoting}
                  aria-label="Upvote"
                  className={`h-8 w-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-50 hover:bg-black/5 ${
                    upvoteActive ? 'text-[#245A34]' : 'text-slate-500'
                  }`}
                >
                  <ArrowBigUp
                    className={`h-5 w-5 ${upvoteActive ? 'fill-[#245A34]' : 'fill-transparent'}`}
                    strokeWidth={2}
                  />
                </button>
                <span
                  className={`min-w-[28px] text-center text-[13px] font-bold ${
                    score > 0
                      ? 'text-[#245A34]'
                      : score < 0
                        ? 'text-red-600'
                        : 'text-gray-700'
                  }`}
                >
                  {score > 0 ? `+${formatStat(score)}` : formatStat(score)}
                </span>
                <button
                  onClick={() => onVote('DOWNVOTE')}
                  disabled={isVoting}
                  aria-label="Downvote"
                  className={`h-8 w-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-50 hover:bg-black/5 ${
                    downvoteActive ? 'text-red-600' : 'text-slate-500'
                  }`}
                >
                  <ArrowBigDown
                    className={`h-5 w-5 ${downvoteActive ? 'fill-red-600' : 'fill-transparent'}`}
                    strokeWidth={2}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenVoters('UPVOTE')}
                className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="View voters"
              >
                {formatStat(upvoteCount)} up · {formatStat(downvoteCount)} down
              </button>
            </div>
          </div>

          {/* ── Comments list ────────────────────────────────────────────── */}
          <div className="px-6 py-5">

            {commentsQuery.isLoading && (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded-full animate-pulse w-1/3" />
                      <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {commentsQuery.isError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-red-700">
                    Không thể tải bình luận.
                  </p>
                  <button
                    type="button"
                    onClick={() => void commentsQuery.refetch()}
                    className="inline-flex items-center rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
                    Thử lại
                  </button>
                </div>
              </div>
            )}

            {commentsPage && !commentsQuery.isError && (
              <>
                {comments.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                    <MessageCircle className="w-10 h-10 opacity-30" strokeWidth={1.5} />
                    <p className="text-[14px] font-semibold">
                      Chưa có bình luận nào. Hãy là người đầu tiên!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        postId={post.id}
                        comment={comment}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {commentsPage.totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(p - 1, 0))}
                      disabled={!commentsPage.hasPrevious}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                    <span className="text-[13px] font-semibold text-slate-500">
                      {page + 1} / {commentsPage.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!commentsPage.hasNext}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Sticky composer at the bottom ─────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 bg-white/90 backdrop-blur-md px-4 py-3 safe-area-bottom">
          {createComment.isError && (
            <p role="alert" className="mb-2 text-xs font-bold text-red-600 px-1">
              Không thể gửi bình luận. Vui lòng thử lại.
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            />
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200/60 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-[#245A34]/20 focus-within:border-[#245A34] transition-all">
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder:text-slate-400 outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || createComment.isPending}
                aria-label="Post comment"
                className="ml-2 w-8 h-8 rounded-full bg-[#245A34] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-4 h-4 ml-[-1px]" strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
