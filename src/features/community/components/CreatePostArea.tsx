import { useState } from 'react'
import { Image as ImageIcon, MapPin } from 'lucide-react'
import { CreatePostModal } from './CreatePostModal'
import { Avatar } from '../../../components/ui/Avatar'
import { useCommunityCurrentUser } from '../hooks/useCommunityCurrentUser'

export function CreatePostArea() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const currentUser = useCommunityCurrentUser()

  return (
    <>
      <div
        className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100/50 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Input Row */}
        <div className="flex gap-4 mb-6">
          <Avatar
            src={currentUser.avatar}
            name={currentUser.name}
            size="xl"
            className="border border-slate-200"
          />
          <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-3xl px-5 py-3 hover:bg-slate-100/50 transition-colors">
            <span className="text-[15px] text-slate-400 select-none">
              Chia sẻ tình trạng vườn của bạn...
            </span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
          
          <div className="flex items-center gap-6 pl-2">
          <button
            aria-label="Open create post"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-[14px] font-bold text-[#245A34] hover:opacity-80 transition-opacity"
          >
              <ImageIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
              Ảnh/Video
            </button>
            
            <button
              aria-label="Open create post"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-[14px] font-bold text-[#245A34] hover:opacity-80 transition-opacity"
            >
              <MapPin className="w-[18px] h-[18px]" strokeWidth={2.5} />
              Vị trí
            </button>
          </div>

          <button
            aria-label="Open create post"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3 bg-[#245A34] text-white text-[15px] font-bold rounded-full hover:bg-green-800 transition-colors shadow-sm"
          >
            Đăng bài
          </button>
          
        </div>
      </div>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

