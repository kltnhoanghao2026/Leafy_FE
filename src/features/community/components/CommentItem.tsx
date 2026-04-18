import { useState } from "react";
import type { FormEvent } from "react";
import { Heart, RefreshCw, Send } from "lucide-react";
import type { Comment } from "../types";
import {
  useCommunityReplies,
  useCreateCommunityComment,
  useVoteComment,
} from "../queries";

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
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const voteComment = useVoteComment();
  const createComment = useCreateCommunityComment();
  const repliesQuery = useCommunityReplies(
    comment.id,
    { page: 0, size: 20 },
    showReplies && !isReply,
  );
  const replies = repliesQuery.data?.items ?? [];

  const handleLike = () => {
    voteComment.mutate(comment.id);
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
      <img
        src={comment.author.avatar}
        alt={comment.author.name}
        className={`${isReply ? "w-8 h-8" : "w-10 h-10"} rounded-full object-cover shrink-0 border border-slate-200`}
      />

      <div className="flex-1">
        <div className="bg-slate-50 border border-slate-100/60 rounded-2xl px-4 py-3">
          <span className="text-[14px] font-bold text-gray-900 block mb-0.5">
            {comment.author.name}
          </span>
          <p className="text-[14px] text-gray-800 leading-snug">
            {comment.content}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-2 ml-2">
          <span className="text-[12px] font-medium text-slate-400">
            {comment.timestamp}
          </span>
          <button
            type="button"
            onClick={handleLike}
            disabled={voteComment.isPending && voteComment.variables === comment.id}
            aria-label={`Like comment ${comment.id}`}
            className={`text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              comment.isLikedByMe
                ? "text-[#e41e3f]"
                : "text-slate-500 hover:text-[#245A34]"
            }`}
          >
            Like
          </button>
          {!isReply ? (
            <button
              type="button"
              onClick={() => setIsReplying(!isReplying)}
              className="text-[13px] font-bold text-slate-500 hover:text-[#245A34] transition-colors"
            >
              Reply
            </button>
          ) : null}

          {comment.likes > 0 ? (
            <div className="flex items-center gap-1 text-slate-400 ml-auto mr-2">
              <span className="text-[13px] font-semibold">
                {comment.likes}
              </span>
              <Heart
                className={`w-3.5 h-3.5 ${
                  comment.isLikedByMe ? "fill-[#e41e3f] text-[#e41e3f]" : ""
                }`}
                strokeWidth={2.5}
              />
            </div>
          ) : null}
        </div>

        {!isReply && (comment.replyCount ?? 0) > 0 ? (
          <button
            type="button"
            onClick={() => setShowReplies((current) => !current)}
            className="mt-2 ml-2 text-[13px] font-bold text-[#245A34] hover:underline"
          >
            {showReplies ? "Hide replies" : `View ${comment.replyCount} replies`}
          </button>
        ) : null}

        {isReplying ? (
          <form onSubmit={handleSubmitReply} className="mt-4 flex gap-3 items-end">
            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="Current User"
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
