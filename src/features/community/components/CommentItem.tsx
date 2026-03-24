import { useState } from 'react'
import { Heart, Send } from 'lucide-react'
import type { Comment } from '../types'
import { useCommunityStore } from '../../../store/useCommunityStore'

interface CommentItemProps {
  postId: string
  comment: Comment
  isReply?: boolean
}

export function CommentItem({ postId, comment, isReply = false }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const { likeComment, addReply } = useCommunityStore()

  const handleLike = () => {
    likeComment(postId, comment.id)
  }

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return

    const newReply: Comment = {
      id: `r${Date.now()}`,
      author: {
        id: 'currentUser', // Mock current user
        name: 'Tuấn Cường',
        avatar: 'https://i.pravatar.cc/150?img=11'
      },
      content: replyText,
      timestamp: 'Vừa xong',
      likes: 0
    }

    addReply(postId, comment.id, newReply)
    setReplyText('')
    setIsReplying(false)
  }

  return (
    <div className={`flex gap-3 ${isReply ? 'mt-4' : 'mt-6'}`}>
      <img 
        src={comment.author.avatar} 
        alt={comment.author.name} 
        className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover shrink-0 border border-slate-200`}
      />
      
      <div className="flex-1">
        <div className="bg-slate-50 border border-slate-100/60 rounded-2xl px-4 py-3">
          <span className="text-[14px] font-bold text-gray-900 block mb-0.5">{comment.author.name}</span>
          <p className="text-[14px] text-gray-800 leading-snug">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-4 mt-2 ml-2">
          <span className="text-[12px] font-medium text-slate-400">{comment.timestamp}</span>
          <button 
            onClick={handleLike}
            className={`text-[13px] font-bold transition-colors ${comment.isLikedByMe ? 'text-[#e41e3f]' : 'text-slate-500 hover:text-[#245A34]'}`}
          >
            Thích
          </button>
          {!isReply && (
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-[13px] font-bold text-slate-500 hover:text-[#245A34] transition-colors"
            >
              Phản hồi
            </button>
          )}
          
          {comment.likes > 0 && (
            <div className="flex items-center gap-1 text-slate-400 ml-auto mr-2">
              <span className="text-[13px] font-semibold">{comment.likes}</span>
              <Heart className={`w-3.5 h-3.5 ${comment.isLikedByMe ? 'fill-[#e41e3f] text-[#e41e3f]' : ''}`} strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Reply Input Box */}
        {isReplying && (
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
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Viết phản hồi..."
                className="w-full bg-transparent text-[14px] text-gray-900 placeholder:text-slate-400 outline-none"
              />
              <button 
                type="submit" 
                disabled={!replyText.trim()}
                className="ml-2 w-8 h-8 rounded-full bg-[#245A34] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
        )}

        {/* Recursive Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 relative">
            {/* Thread line visual */}
            <div className="absolute left-[-26px] top-0 bottom-4 w-px bg-slate-200"></div>
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} postId={postId} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
