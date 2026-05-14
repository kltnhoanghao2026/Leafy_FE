import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowBigDown, ArrowBigUp, RefreshCw, Send } from "lucide-react";
import type { Comment, CommunityVoteType } from "../types";
import {
  useCommunityReplies,
  useCreateCommunityComment,
  useVoteComment,
} from "../queries";
import { Avatar } from '../../../components/ui/Avatar'
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../lib/routes';
import { useCommunityCurrentUser } from "../hooks/useCommunityCurrentUser";

interface CommentItemProps {
  postId: string;
  comment: Comment;
  isReply?: boolean;
}

export function CommentItem({
  postId,
  comment,
  isReply = false,
}: CommentItemProps) {
  // ── Optimistic vote state — mirrors PostCard pattern ──────────────────────
  const [userVote, setUserVote] = useState<CommunityVoteType | null>(
    comment.currentUserVoteType ?? null,
  );
  const [upvoteCount, setUpvoteCount] = useState(comment.likes ?? 0);
  const [downvoteCount, setDownvoteCount] = useState(comment.downvotes ?? 0);

  // Sync when the server refreshes the comment (e.g. after query invalidation)
  useEffect(() => {
    setUserVote(comment.currentUserVoteType ?? null);
    setUpvoteCount(comment.likes ?? 0);
    setDownvoteCount(comment.downvotes ?? 0);
  }, [comment.id, comment.currentUserVoteType, comment.likes, comment.downvotes]);

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const voteComment = useVoteComment();
  const createComment = useCreateCommunityComment();
  const currentUser = useCommunityCurrentUser();

  const repliesQuery = useCommunityReplies(
    comment.id,
    { page: 0, size: 20 },
    showReplies && !isReply,
  );
  const replies = repliesQuery.data?.items ?? [];

  const isVoting =
    voteComment.isPending && voteComment.variables?.commentId === comment.id;

  const upvoteActive = userVote === "UPVOTE";
  const downvoteActive = userVote === "DOWNVOTE";
  const score = upvoteCount - downvoteCount;

  // ── Optimistic transition (same logic as PostCard) ────────────────────────
  const applyVoteTransition = (nextVote: CommunityVoteType) => {
    const prevVote = userVote;
    let nextUserVote: CommunityVoteType | null = nextVote;
    let nextUp = upvoteCount;
    let nextDown = downvoteCount;

    if (prevVote === nextVote) {
      // Toggle off
      nextUserVote = null;
      if (nextVote === "UPVOTE") nextUp = Math.max(0, nextUp - 1);
      else nextDown = Math.max(0, nextDown - 1);
    } else if (nextVote === "UPVOTE") {
      nextUp += 1;
      if (prevVote === "DOWNVOTE") nextDown = Math.max(0, nextDown - 1);
    } else {
      nextDown += 1;
      if (prevVote === "UPVOTE") nextUp = Math.max(0, nextUp - 1);
    }

    return { nextUserVote, nextUp, nextDown };
  };

  const onVote = (nextVote: CommunityVoteType) => {
    if (isVoting) return;

    const prevState = { userVote, upvoteCount, downvoteCount };
    const { nextUserVote, nextUp, nextDown } = applyVoteTransition(nextVote);

    setUserVote(nextUserVote);
    setUpvoteCount(nextUp);
    setDownvoteCount(nextDown);

    voteComment.mutate(
      { commentId: comment.id, type: nextVote },
      {
        onError: () => {
          // Roll back on failure
          setUserVote(prevState.userVote);
          setUpvoteCount(prevState.upvoteCount);
          setDownvoteCount(prevState.downvoteCount);
        },
      },
    );
  };

  const handleSubmitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replyText.trim()) return;

    try {
      await createComment.mutateAsync({
        postId,
        parentId: comment.id,
        content: replyText.trim(),
        media: [],
      });
      setReplyText("");
      setIsReplying(false);
      setShowReplies(true);
    } catch {
      // Mutation error state is rendered below.
    }
  };

  return (
    <div className={`flex gap-3 ${isReply ? "mt-4" : "mt-6"}`}>
      <Link to={ROUTES.DASHBOARD.PROFILE_VIEW(comment.author.id)} className="block shrink-0">
        <Avatar
          src={comment.author.avatar}
          name={comment.author.name}
          alt={comment.author.name}
          className={`${isReply ? "w-8 h-8" : "w-10 h-10"} rounded-full object-cover border border-slate-200`}
        />
      </Link>

      <div className="flex-1">
        <div className="bg-slate-50 border border-slate-100/60 rounded-2xl px-4 py-3">
          <Link
            to={ROUTES.DASHBOARD.PROFILE_VIEW(comment.author.id)}
            className="text-[14px] font-bold text-gray-900 block mb-0.5 hover:text-[#10B981] hover:underline transition-colors inline-block"
          >
            {comment.author.name}
          </Link>
          <p className="text-[14px] text-gray-800 leading-snug">
            {comment.content}
          </p>
        </div>

        {/* ── Action row ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mt-2 ml-2 flex-wrap">
          <span className="text-[12px] font-medium text-slate-400">
            {comment.timestamp}
          </span>

          {/* Vote capsule — [↑  score  ↓]  same style as PostCard */}
          <div className="flex items-center rounded-full bg-slate-100 px-0.5 py-0.5">
            <button
              type="button"
              onClick={() => onVote("UPVOTE")}
              disabled={isVoting}
              aria-label={`Upvote comment ${comment.id}`}
              className={`h-7 w-9 flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-black/5 active:bg-black/5 ${
                upvoteActive ? "text-[#245A34]" : "text-slate-500"
              }`}
            >
              <ArrowBigUp
                className={`h-[18px] w-[18px] ${upvoteActive ? "fill-[#245A34]" : "fill-transparent"}`}
                strokeWidth={2}
              />
            </button>

            <span
              className={`min-w-[24px] text-center text-[12px] font-bold tracking-tight ${
                score > 0
                  ? "text-[#245A34]"
                  : score < 0
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {score > 0 ? `+${score}` : score}
            </span>

            <button
              type="button"
              onClick={() => onVote("DOWNVOTE")}
              disabled={isVoting}
              aria-label={`Downvote comment ${comment.id}`}
              className={`h-7 w-9 flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-black/5 active:bg-black/5 ${
                downvoteActive ? "text-red-600" : "text-slate-500"
              }`}
            >
              <ArrowBigDown
                className={`h-[18px] w-[18px] ${downvoteActive ? "fill-red-600" : "fill-transparent"}`}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* up · down count */}
          {(upvoteCount > 0 || downvoteCount > 0) && (
            <span className="text-[11px] font-medium text-slate-400">
              {upvoteCount} up · {downvoteCount} down
            </span>
          )}

          {!isReply ? (
            <button
              type="button"
              onClick={() => setIsReplying(!isReplying)}
              className="text-[13px] font-bold text-slate-500 hover:text-[#245A34] transition-colors"
            >
              Reply
            </button>
          ) : null}

          {/* View / Hide replies — same row as Reply */}
          {!isReply && (comment.replyCount ?? 0) > 0 ? (
            <button
              type="button"
              onClick={() => setShowReplies((current) => !current)}
              className="text-[13px] font-bold text-[#245A34] hover:underline"
            >
              {showReplies ? "Hide replies" : `View ${comment.replyCount} replies`}
            </button>
          ) : null}
        </div>

        {isReplying ? (
          <form onSubmit={handleSubmitReply} className="mt-4 flex gap-3 items-end">
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
            />
            <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-3xl px-4 py-2 flex items-center focus-within:ring-2 focus-within:ring-[#245A34]/20 focus-within:border-[#245A34] transition-all">
              <input
                type="text"
                autoFocus
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-transparent text-[14px] text-gray-900 placeholder:text-slate-400 outline-none"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || createComment.isPending}
                className="ml-2 w-8 h-8 rounded-full bg-[#245A34] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                aria-label="Submit reply"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
        ) : null}

        {createComment.isError ? (
          <p role="alert" className="mt-3 text-sm font-bold text-red-600">
            Reply could not be posted. Please try again.
          </p>
        ) : null}

        {showReplies && !isReply ? (
          <div className="mt-2 relative">
            <div className="absolute left-[-26px] top-0 bottom-4 w-px bg-slate-200" />

            {repliesQuery.isLoading ? (
              <p className="ml-2 py-3 text-[13px] font-semibold text-slate-500">
                Loading replies...
              </p>
            ) : null}

            {repliesQuery.isError ? (
              <button
                type="button"
                onClick={() => void repliesQuery.refetch()}
                className="ml-2 mt-2 inline-flex items-center rounded-full border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
                Retry replies
              </button>
            ) : null}

            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                postId={postId}
                comment={reply}
                isReply
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
