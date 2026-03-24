import { useState, useRef } from 'react'
import { X, Image as ImageIcon, MapPin, AlertCircle, Send } from 'lucide-react'
import { useCommunityStore } from '../../../store/useCommunityStore'
import type { Post } from '../types'
import { toast } from 'react-hot-toast'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
}

const LOCATIONS = ['Di Linh, Lâm Đồng', 'Buôn Ma Thuột', 'Đà Lạt', 'Bảo Lộc', 'Gia Nghĩa']

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const addPost = useCommunityStore(state => state.addPost)

  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Use object URL as a local preview (mock level)
    const url = URL.createObjectURL(file)
    setPreviewImage(url)
  }

  const handleRemoveImage = () => {
    setPreviewImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setIsSubmitting(true)

    // Simulate short delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const newPost: Post = {
      id: `p${Date.now()}`,
      author: {
        id: 'currentUser',
        name: 'Lê Văn Tám',
        avatar: 'https://i.pravatar.cc/150?img=11'
      },
      timestamp: 'Vừa xong',
      location: location || undefined,
      content: content.trim(),
      images: previewImage ? [previewImage] : undefined,
      isUrgent,
      likes: 0,
      comments: 0,
      commentsList: [],
      shares: 0
    }

    addPost(newPost)
    toast.success('Đã đăng bài thành công!')

    // Reset
    setContent('')
    setLocation('')
    setIsUrgent(false)
    setPreviewImage(null)
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="w-8" />
          <h2 className="text-[17px] font-bold text-gray-900">Tạo bài viết</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5">
            
            {/* Author Row */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://i.pravatar.cc/150?img=11"
                alt="Current User"
                className="w-11 h-11 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="text-[15px] font-bold text-gray-900">Lê Văn Tám</p>
                {location && (
                  <p className="text-[12px] font-semibold text-[#245A34] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {location}
                  </p>
                )}
              </div>
            </div>

            {/* Content Textarea */}
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ tình trạng vườn của bạn, đặt câu hỏi, hoặc chia sẻ kinh nghiệm..."
              rows={4}
              className="w-full text-[15px] text-gray-900 placeholder:text-slate-400 outline-none resize-none leading-relaxed"
            />

            {/* Image Preview */}
            {previewImage && (
              <div className="relative mt-3 rounded-2xl overflow-hidden border border-slate-200">
                <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[200px] object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              </div>
            )}

            {/* Location selector */}
            {location === 'PICKING' && (
              <div className="mt-3 bg-slate-50 rounded-2xl p-3 border border-slate-200 animate-in slide-in-from-top-2 duration-150">
                <p className="text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Chọn vị trí</p>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="px-3 py-1.5 text-[13px] font-bold rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#245A34] hover:text-[#245A34] transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Urgent toggle */}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsUrgent(!isUrgent)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold border transition-all ${
                  isUrgent
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-400'
                }`}
              >
                <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
                CẦN TƯ VẤN GẤP
              </button>
              {location && location !== 'PICKING' && (
                <button type="button" onClick={() => setLocation('')} className="text-[13px] font-semibold text-slate-400 hover:text-red-400 transition-colors">
                  Xóa vị trí
                </button>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-6 pb-5">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2.5 mb-4">
              <p className="text-[13px] font-bold text-slate-500">Thêm vào bài viết</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#245A34] hover:opacity-70 transition-opacity"
                  title="Thêm ảnh"
                >
                  <ImageIcon className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setLocation(location && location !== 'PICKING' ? '' : 'PICKING')}
                  className={`transition-opacity ${location && location !== 'PICKING' ? 'text-[#245A34]' : 'text-slate-400'} hover:opacity-70`}
                  title="Vị trí"
                >
                  <MapPin className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="w-full py-3 bg-[#245A34] text-white text-[15px] font-bold rounded-full hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" strokeWidth={2.5} />
                  Đăng bài
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
