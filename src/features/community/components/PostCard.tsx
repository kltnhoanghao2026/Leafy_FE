import { useEffect, useState } from 'react'
import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from 'lucide-react'
import type { CommunityVoteType, Post } from '../types'
import { useVotePost } from '../queries'
import { CommentModal } from './CommentModal'
import { ShareModal } from './ShareModal'
import { SharedPostEmbed } from './SharedPostEmbed'
import { MediaImage } from './MediaImage'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../lib/routes'
import { Avatar } from '../../../components/ui/Avatar'
import { VotersModal } from './VotersModal'

// Mirrors the APP's formatStat: 1000+ → "1.0k"
function formatStat(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  // ---------------------------------------------------------------------------
  // Local optimistic vote state — mirrors APP's PostCard pattern exactly
  // ---------------------------------------------------------------------------
  const [userVote, setUserVote] = useState<CommunityVoteType | null>(
    post.currentUserVoteType,
  )
  const [upvoteCount, setUpvoteCount] = useState(post.upvotes)
  const [downvoteCount, setDownvoteCount] = useState(post.downvotes)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [votersModal, setVotersModal] = useState<{ open: boolean; tab: CommunityVoteType }>(
    { open: false, tab: 'UPVOTE' },
  )

  const openVoters = (tab: CommunityVoteType) =>
    setVotersModal({ open: true, tab })

  // Sync if parent data changes (e.g., after query invalidation)
  useEffect(() => {
    setUserVote(post.currentUserVoteType)
    setUpvoteCount(post.upvotes)
    setDownvoteCount(post.downvotes)
  }, [post.id, post.currentUserVoteType, post.upvotes, post.downvotes])

  const votePost = useVotePost()
  const isVoting =
    votePost.isPending && votePost.variables?.postId === post.id

  const upvoteActive = userVote === 'UPVOTE'
  const downvoteActive = userVote === 'DOWNVOTE'
  const score = upvoteCount - downvoteCount

  // ---------------------------------------------------------------------------
  // Optimistic transition — same logic as APP applyVoteTransition
  // ---------------------------------------------------------------------------
  const applyVoteTransition = (nextVote: CommunityVoteType) => {
    const prevVote = userVote
    let nextUserVote: CommunityVoteType | null = nextVote
    let nextUp = upvoteCount
    let nextDown = downvoteCount

    if (prevVote === nextVote) {
      // Toggle off
      nextUserVote = null
      if (nextVote === 'UPVOTE') nextUp = Math.max(0, nextUp - 1)
      else nextDown = Math.max(0, nextDown - 1)
    } else if (nextVote === 'UPVOTE') {
      nextUp += 1
      if (prevVote === 'DOWNVOTE') nextDown = Math.max(0, nextDown - 1)
    } else {
      nextDown += 1
      if (prevVote === 'UPVOTE') nextUp = Math.max(0, nextUp - 1)
    }

    return { nextUserVote, nextUp, nextDown }
  }

  const onVote = (nextVote: CommunityVoteType) => {
    if (isVoting) return

    const prevState = { userVote, upvoteCount, downvoteCount }
    const { nextUserVote, nextUp, nextDown } = applyVoteTransition(nextVote)

    setUserVote(nextUserVote)
    setUpvoteCount(nextUp)
    setDownvoteCount(nextDown)

    votePost.mutate(
      { postId: post.id, type: nextVote },
      {
        onError: () => {
          // Roll back on failure
          setUserVote(prevState.userVote)
          setUpvoteCount(prevState.upvoteCount)
          setDownvoteCount(prevState.downvoteCount)
        },
      },
    )
  }

  // ---------------------------------------------------------------------------
  // Derived content — mirrors APP's bodyText / titleText / sharedPost
  // ---------------------------------------------------------------------------
  const titleText = post.title?.trim() || null
  const bodyText = post.content || ''
  const isShare = post.postType === 'SHARE'

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100/50 shadow-sm mb-6 last:mb-0 overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start px-6 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.DASHBOARD.PROFILE_VIEW(post.author.id)} className="block shrink-0">
            <Avatar
              src={post.author.avatar}
              name={post.author.name}
              alt={post.author.name}
              className="w-11 h-11 rounded-full object-cover border border-slate-200"
            />
          </Link>
          <div className="flex flex-col">
            <Link
              to={ROUTES.DASHBOARD.PROFILE_VIEW(post.author.id)}
              className="text-[15px] font-bold text-gray-900 leading-tight hover:text-[#10B981] hover:underline transition-colors"
            >
              {post.author.name}
            </Link>
            <span className="text-[13px] font-medium text-slate-500 mt-0.5">
              {post.timestamp}
              {post.location ? ` • ${post.location}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          {post.isUrgent && (
            <span className="px-2.5 py-1 bg-red-50 text-[#DC2626] text-[11px] font-black uppercase tracking-widest rounded-md">
              Khẩn cấp
            </span>
          )}
          <button
            className="p-1 text-slate-400 hover:text-gray-700 transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Text Content ──────────────────────────────────────────────────── */}
      <div className="px-6 pb-3">
        {titleText && (
          <p className="text-[16px] font-semibold text-gray-900 leading-snug mb-1">
            {titleText}
          </p>
        )}
        {bodyText && (
          <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
            {bodyText}
          </p>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <p className="mt-2 text-[13px] text-[#245A34] font-medium">
            {post.hashtags.join(' ')}
          </p>
        )}
      </div>

      {/* ── Shared Post Embed ─────────────────────────────────────────────── */}
      {isShare && post.sharedPost && (
        <div className="px-6 pb-3">
          <SharedPostEmbed post={post.sharedPost} />
        </div>
      )}

      {/* ── Media (own image — only if not a reshare) ─────────────────────── */}
      {!isShare && post.images && post.images.length > 0 && (
        <div className="border-t border-slate-100/60 bg-slate-50">
          <MediaImage
            source={post.images[0]}
            alt="Post attachment"
            className="w-full h-auto object-cover max-h-[400px]"
          />
        </div>
      )}

      {/* ── Action Footer ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-3 pb-5">

        {/* Vote row + meta */}
        <div className="flex items-center justify-between mb-3">

          {/* Vote Capsule — [↑  score  ↓] */}
          <div className="flex items-center rounded-full bg-slate-100 px-1 py-0.5">
            <button
              onClick={() => onVote('UPVOTE')}
              onContextMenu={(e) => { e.preventDefault(); openVoters('UPVOTE') }}
              disabled={isVoting}
              aria-label={`Upvote post ${post.id}`}
              className={`h-8 w-10 flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-black/5 active:bg-black/5 ${
                upvoteActive ? 'text-[#245A34]' : 'text-slate-500'
              }`}
            >
              <ArrowBigUp
                className={`h-[22px] w-[22px] ${upvoteActive ? 'fill-[#245A34]' : 'fill-transparent'}`}
                strokeWidth={2}
              />
            </button>

            <span
              className={`min-w-[32px] text-center text-[13px] font-bold tracking-tight ${
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
              onContextMenu={(e) => { e.preventDefault(); openVoters('DOWNVOTE') }}
              disabled={isVoting}
              aria-label={`Downvote post ${post.id}`}
              className={`h-8 w-10 flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-black/5 active:bg-black/5 ${
                downvoteActive ? 'text-red-600' : 'text-slate-500'
              }`}
            >
              <ArrowBigDown
                className={`h-[22px] w-[22px] ${downvoteActive ? 'fill-red-600' : 'fill-transparent'}`}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Up/Down meta count — click opens voters modal */}
          <button
            onClick={() => openVoters('UPVOTE')}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="View voters"
          >
            <span className="text-[13px] font-medium">
              {formatStat(upvoteCount)} up · {formatStat(downvoteCount)} down
            </span>
            <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Secondary actions — border-top separator, mirrors APP */}
        <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
          <div className="flex items-center gap-6">
            {/* Comments */}
            <button
              onClick={() => setShowCommentModal(true)}
              aria-label={`Open comments for post ${post.id}`}
              className="flex items-center gap-2 text-slate-500 hover:text-[#245A34] transition-colors"
            >
              <MessageCircle className="w-[20px] h-[20px]" strokeWidth={2} />
              <span className="text-[13px] font-medium">
                {formatStat(post.comments)}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={() => setShowShareModal(true)}
              aria-label={`Share post ${post.id}`}
              className="flex items-center gap-2 text-slate-500 hover:text-[#245A34] transition-colors"
            >
              <Share2 className="w-[20px] h-[20px]" strokeWidth={2} />
              <span className="text-[13px] font-medium">
                {formatStat(post.shares)}
              </span>
            </button>
          </div>

          {/* Urgent CTA — mirrors APP's "Xem chi tiết" in footer */}
          {post.isUrgent && (
            <span className="text-[13px] font-semibold text-[#245A34] cursor-pointer hover:underline">
              Xem chi tiết
            </span>
          )}
        </div>
      </div>

      {/* ── Comment Modal ─────────────────────────────────────────────────── */}
      <CommentModal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        post={post}
        upvoteCount={upvoteCount}
        downvoteCount={downvoteCount}
        userVote={userVote}
        onVote={onVote}
        isVoting={isVoting}
        onOpenVoters={openVoters}
      />

      {/* ── Voters Modal ──────────────────────────────────────────────────── */}
      <VotersModal
        isOpen={votersModal.open}
        onClose={() => setVotersModal((s) => ({ ...s, open: false }))}
        postId={post.id}
        initialTab={votersModal.tab}
        upvoteCount={upvoteCount}
        downvoteCount={downvoteCount}
      />

      {/* ── Share Modal ───────────────────────────────────────────────────── */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />
    </div>
  )
}
