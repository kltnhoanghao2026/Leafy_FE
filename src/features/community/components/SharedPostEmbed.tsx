import type { SharedPostSnapshot } from '../types'
import { MediaImage } from './MediaImage'
import { Avatar } from '../../../components/ui/Avatar'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../lib/routes'

interface SharedPostEmbedProps {
  post: SharedPostSnapshot
}

export function SharedPostEmbed({ post }: SharedPostEmbedProps) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 overflow-hidden">

      {/* Embedded Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Link to={ROUTES.DASHBOARD.PROFILE_VIEW(post.author.id)} className="block shrink-0">
            <Avatar
              src={post.author.avatar}
              name={post.author.name}
              alt={post.author.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
          </Link>
          <Link
            to={ROUTES.DASHBOARD.PROFILE_VIEW(post.author.id)}
            className="text-[13px] font-semibold text-gray-900 leading-tight hover:text-[#10B981] hover:underline transition-colors"
          >
            {post.author.name}
          </Link>
          <span className="text-[11px] text-slate-500">· {post.timestamp}</span>
          {post.isUrgent && (
            <span className="ml-auto px-2 py-0.5 bg-red-50 text-[#DC2626] text-[10px] font-black uppercase tracking-wider rounded-full shrink-0">
              Khẩn cấp
            </span>
          )}
        </div>

        {/* Title */}
        {post.title?.trim() && (
          <p className="mb-1 text-[14px] font-semibold text-gray-900 leading-snug">
            {post.title}
          </p>
        )}

        {/* Body */}
        {post.content && (
          <p
            className="text-[14px] text-gray-800 leading-relaxed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as React.CSSProperties}
          >
            {post.content}
          </p>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <p className="mt-1 text-[12px] text-[#245A34] font-medium">
            {post.hashtags.join(' ')}
          </p>
        )}
      </div>

      {/* Embedded Image */}
      {post.images && post.images.length > 0 && (
        <MediaImage
          source={post.images[0]}
          alt="Shared post attachment"
          className="w-full h-auto object-cover max-h-[180px]"
        />
      )}
    </div>
  )
}
