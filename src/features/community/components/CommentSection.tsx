import { useState } from 'react'
import { Send } from 'lucide-react'
import type { Post, Comment } from '../types'
import { CommentItem } from './CommentItem'
import { useCommunityStore } from '../../../store/useCommunityStore'

interface CommentSectionProps {
  post: Post
}

export function CommentSection({ post }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('')
  const { addComment } = useCommunityStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: {
        id: 'currentUser', // Mock current user
        name: 'Tuấn Cường',
        avatar: 'https://i.pravatar.cc/150?img=11'
      },
      content: commentText,
      timestamp: 'Vừa xong',
      likes: 0
    }

    addComment(post.id, newComment)
    setCommentText('')
  }

  return (
    <div className="pt-6 border-t border-slate-100/80 mt-4 animate-in slide-in-from-top-2 duration-300">
      
      {/* Top Level Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-3 items-start mb-6">
        <img 
          src="https://i.pravatar.cc/150?img=11" 
          alt="Current User" 
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
        />
        <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-3xl px-5 py-2.5 flex items-center focus-within:ring-2 focus-within:ring-[#245A34]/20 focus-within:border-[#245A34] transition-all">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Viết bình luận..."
            className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-slate-400 outline-none"
          />
          <button 
            type="submit" 
            disabled={!commentText.trim()}
            className="ml-2 w-9 h-9 rounded-full bg-[#245A34] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Send className="w-4 h-4 ml-[-2px]" strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {/* Render Comments List */}
      {post.commentsList && post.commentsList.length > 0 ? (
        <div className="flex flex-col">
          {post.commentsList.map(comment => (
            <CommentItem key={comment.id} postId={post.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-center text-[14px] text-slate-500 font-medium py-4">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </p>
      )}

    </div>
  )
}
