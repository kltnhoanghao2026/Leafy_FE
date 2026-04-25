import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Send } from "lucide-react";
import type { Post } from "../types";
import { CommentItem } from "./CommentItem";
import {
  useCommunityComments,
  useCreateCommunityComment,
} from "../queries";
import { CommunityAvatar } from "./CommunityAvatar";
import { useCommunityCurrentUser } from "../hooks/useCommunityCurrentUser";

interface CommentSectionProps {
  post: Post;
}

export function CommentSection({ post }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");
  const [page, setPage] = useState(0);
  const currentUser = useCommunityCurrentUser();
  const commentsQuery = useCommunityComments(post.id, { page, size: 20 });
  const createComment = useCreateCommunityComment();
  const commentsPage = commentsQuery.data;
  const comments = commentsPage?.items ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    try {
      await createComment.mutateAsync({
        postId: post.id,
        content: commentText.trim(),
        media: [],
      });
      setCommentText("");
      setPage(0);
    } catch {
      // Mutation error state is rendered below.
    }
  };

  return (
    <div className="pt-6 border-t border-slate-100/80 mt-4 animate-in slide-in-from-top-2 duration-300">
      <form onSubmit={handleSubmit} className="flex gap-3 items-start mb-6">
        <CommunityAvatar
          source={currentUser.avatar}
          name={currentUser.name}
          alt={currentUser.name}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
        />
        <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-3xl px-5 py-2.5 flex items-center focus-within:ring-2 focus-within:ring-[#245A34]/20 focus-within:border-[#245A34] transition-all">
          <input
            type="text"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-slate-400 outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || createComment.isPending}
            className="ml-2 w-9 h-9 rounded-full bg-[#245A34] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label="Submit comment"
          >
            <Send className="w-4 h-4 ml-[-2px]" strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {createComment.isError ? (
        <p role="alert" className="mb-4 text-sm font-bold text-red-600">
          Comment could not be posted. Please try again.
        </p>
      ) : null}

      {commentsQuery.isLoading ? (
        <div aria-label="Loading comments" className="space-y-3">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-16 rounded-2xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {commentsQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-red-700">
              Comments could not be loaded.
            </p>
            <button
              type="button"
              onClick={() => void commentsQuery.refetch()}
              className="inline-flex items-center rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {commentsPage && !commentsQuery.isError ? (
        <>
          {comments.length > 0 ? (
            <div className="flex flex-col">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  postId={post.id}
                  comment={comment}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-[14px] text-slate-500 font-medium py-4">
              No comments yet. Be the first to comment.
            </p>
          )}

          {commentsPage.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={!commentsPage.hasPrevious}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous comments page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!commentsPage.hasNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next comments page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
