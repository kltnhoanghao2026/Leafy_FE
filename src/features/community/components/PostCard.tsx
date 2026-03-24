import { useState } from 'react'
import { Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react'
import type { Post } from '../types'
import { useCommunityStore } from '../../../store/useCommunityStore'
import { CommentSection } from './CommentSection'
import { ShareModal } from './ShareModal'
import { SharedPostEmbed } from './SharedPostEmbed'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const likePost = useCommunityStore(state => state.likePost)

  const handleLike = () => {
    likePost(post.id)
  }

  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100/50 mb-6 last:mb-0">
      
      {/* Post Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={post.author.avatar} 
            alt={post.author.name}
            className="w-12 h-12 rounded-full object-cover border border-slate-200"
          />
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-gray-900">{post.author.name}</span>
            <span className="text-[13px] font-medium text-slate-500">
              {post.timestamp}{post.location ? ` • ${post.location}` : ''}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {post.isUrgent && (
            <span className="px-3 py-1 bg-red-50 text-red-500 text-[11px] font-black uppercase tracking-wider rounded-full">
              CẦN TƯ VẤN GẤP
            </span>
          )}
          <button className="text-slate-400 hover:text-gray-900 transition-colors">
            <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Post Body */}
      <div className="mb-4">
        {/* User caption - conditionally render if not empty */}
        {post.content && (
          <p className="text-[15px] text-gray-900 leading-relaxed whitespace-pre-wrap mb-3">
            {post.content}
          </p>
        )}
        
        {/* Embedded shared post (Facebook-style) */}
        {post.sharedPost && (
          <SharedPostEmbed post={post.sharedPost} />
        )}

        {/* Own attached image (only if not a reshare) */}
        {!post.sharedPost && post.images && post.images.length > 0 && (
          <div className="rounded-2xl overflow-hidden bg-slate-100 mt-3 border border-slate-200">
            <img 
              src={post.images[0]} 
              alt="Post attachment" 
              className="w-full h-auto object-cover max-h-[400px]"
            />
          </div>
        )}
      </div>

      {/* Post Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100/80">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors group ${post.isLikedByMe ? 'text-[#e41e3f]' : 'text-slate-500 hover:text-[#245A34]'}`}
          >
            <Heart className={`w-[18px] h-[18px] ${post.isLikedByMe ? 'fill-[#e41e3f]' : 'group-hover:fill-[#245A34]'}`} strokeWidth={2.5} />
            <span className="text-[14px] font-bold">{post.likes}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 transition-colors ${showComments ? 'text-[#245A34]' : 'text-slate-500 hover:text-[#245A34]'}`}
          >
            <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2.5} />
            <span className="text-[14px] font-bold">{post.comments}</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 text-slate-500 hover:text-[#245A34] transition-colors"
          >
            <Share2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
            <span className="text-[14px] font-bold">{post.shares > 0 ? post.shares : 'Chia sẻ'}</span>
          </button>
        </div>
        
        {/* Assume 'Xem thêm' logic triggers manually if text is long, static for now per design */}
        <button className="text-[14px] font-bold text-[#245A34] hover:underline">
          Xem thêm
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <CommentSection post={post} />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />

    </div>
  )
}
