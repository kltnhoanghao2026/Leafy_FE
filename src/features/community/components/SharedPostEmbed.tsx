import { Heart, MessageSquare, Share2, MapPin } from 'lucide-react'
import type { SharedPostSnapshot } from '../types'

interface SharedPostEmbedProps {
  post: SharedPostSnapshot
}

export function SharedPostEmbed({ post }: SharedPostEmbedProps) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 overflow-hidden">
      
      {/* Embedded Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-gray-900 leading-tight">{post.author.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-slate-500">{post.timestamp}</span>
                {post.location && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-[12px] font-medium text-slate-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" /> {post.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {post.isUrgent && (
            <span className="px-2.5 py-0.5 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0">
              CẦN TƯ VẤN GẤP
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-[14px] text-gray-900 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Embedded Image */}
      {post.images && post.images.length > 0 && (
        <div className="border-t border-slate-200/60">
          <img
            src={post.images[0]}
            alt="Shared post attachment"
            className="w-full h-auto object-cover max-h-[300px]"
          />
        </div>
      )}

      {/* Embedded Footer Stats */}
      <div className="flex items-center gap-5 px-4 py-3 border-t border-slate-200/60 bg-white/60">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Heart className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-[13px] font-bold">{post.likes}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-[13px] font-bold">{post.comments}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Share2 className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-[13px] font-bold">{post.shares}</span>
        </div>
      </div>
    </div>
  )
}
