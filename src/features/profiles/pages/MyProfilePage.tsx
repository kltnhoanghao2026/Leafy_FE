import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Award, MapPin, Settings, Camera, ThumbsUp, MessageCircle,
  Share2, ShieldCheck, Loader2, FileText, Edit3, Check, X,
  Briefcase, Users, CalendarDays
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '../../../components/ui/Avatar'
import { ROUTES } from '../../../lib/routes'
import { profileApi } from '../../settings/api/profile.api'
import { profilesApi } from '../api/profilesApi'
import { fileApi, isFileServiceReference } from '../../../lib/api/fileApi'
import { useFilePreviewUrl } from '../../settings/queries'
import type { ProfileUpdateRequest } from '../../settings/types'
import { PostCard } from '../../community/components/PostCard'
import { mapPostResponseToPost } from '../../community/mappers'
import { FollowersList } from '../components/FollowersList'

const ROLE_LABELS: Record<string, string> = { FARMER: 'Nông dân', EXPERT: 'Chuyên gia' }

function useMyProfile() {
  return useQuery({
    queryKey: ['profiles', 'me'],
    queryFn: () => profileApi.getMyProfile(),
    select: (r) => r.data.data,
  })
}

function useMyPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-posts', userId],
    queryFn: () => profilesApi.getPostsByUserId(userId!),
    enabled: !!userId,
    select: (r) => r.data.data?.content.map(mapPostResponseToPost) ?? [],
  })
}

function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ProfileUpdateRequest }) =>
      profileApi.updateByUserId(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles', 'me'] })
      toast.success('Đã lưu hồ sơ!')
    },
    onError: () => toast.error('Lưu thất bại, vui lòng thử lại.'),
  })
}

export function MyProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading, error } = useMyProfile()
  const { data: posts = [] } = useMyPosts(profile?.id)
  const updateMutation = useUpdateProfile()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'posts' | 'followers'>('posts')

  // Avatar
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { data: resolvedAvatarUrl } = useFilePreviewUrl(profile?.avatar)
  const avatarSrc =
    resolvedAvatarUrl ||
    (profile?.avatar && !isFileServiceReference(profile.avatar) ? profile.avatar : null) ||
    profile?.profilePicture ||
    undefined

  // Inline bio editing
  const [editingBio, setEditingBio] = useState(false)
  const [bioValue, setBioValue] = useState('')

  const startEditBio = () => {
    setBioValue(profile?.bio ?? '')
    setEditingBio(true)
  }
  const cancelEditBio = () => setEditingBio(false)
  const saveBio = useCallback(async () => {
    if (!profile) return
    await updateMutation.mutateAsync({ userId: profile.userId, data: { bio: bioValue } })
    setEditingBio(false)
  }, [bioValue, profile, updateMutation])

  const handleAvatarSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setIsUploading(true)
    try {
      const uploaded = await fileApi.uploadFile(file)
      await updateMutation.mutateAsync({ userId: profile.userId, data: { avatar: uploaded.id } })
      toast.success('Ảnh đại diện đã cập nhật!')
      qc.invalidateQueries({ queryKey: ['profiles', 'me'] })
    } catch {
      toast.error('Tải ảnh thất bại.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }, [profile, updateMutation, qc])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Đang tải hồ sơ...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-sm font-semibold text-slate-500">Không tải được hồ sơ.</p>
      </div>
    )
  }

  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role
  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="pb-20 animate-fade-in bg-slate-50 min-h-screen -mt-6">
      {/* ─── Full-width Header ─── */}
      <div className="bg-white shadow-sm mb-6 pb-2">
        <div className="max-w-5xl mx-auto">
          {/* Cover Photo */}
          <div className="h-64 md:h-80 w-full bg-gradient-to-br from-[#1a4226] via-[#245A34] to-[#10B981] md:rounded-b-2xl relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          </div>

          {/* Profile Info Area */}
          <div className="px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-4 md:items-end -mt-16 md:-mt-20 relative z-10 mb-4">
              {/* Avatar + Upload */}
              <div className="relative inline-block shrink-0 self-center md:self-auto">
                <Avatar
                  src={avatarSrc}
                  name={profile.fullName}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md object-cover bg-white"
                />
                {(isUploading || updateMutation.isPending) && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center border-4 border-transparent">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || updateMutation.isPending}
                  className="absolute bottom-2 right-2 w-9 h-9 bg-slate-100 rounded-full shadow border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-60"
                  aria-label="Đổi ảnh đại diện"
                >
                  <Camera className="w-4.5 h-4.5 text-gray-700" strokeWidth={2.5} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarSelected} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left mt-2 md:mt-0 md:pb-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                  {profile.fullName || 'Chưa đặt tên'}
                  {profile.isVerified && (
                    <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                  )}
                </h1>
                <p className="text-[15px] font-semibold text-slate-500 mt-1">
                  {roleLabel} {profile.specialty ? ` • ${profile.specialty}` : ''}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center md:justify-end gap-2 md:pb-2 shrink-0">
                <button
                  onClick={() => navigate(ROUTES.DASHBOARD.SETTINGS)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[14px] font-bold rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>

            {/* Divider & Tabs */}
            <div className="border-t border-slate-200/60 pt-1 flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`font-bold px-4 pb-3 pt-3 whitespace-nowrap transition-colors ${activeTab === 'posts' ? 'text-[#10B981] border-b-4 border-[#10B981]' : 'text-slate-600 hover:bg-slate-50 rounded-lg'}`}>Bài viết</button>
              <button 
                onClick={() => setActiveTab('followers')}
                className={`font-bold px-4 pb-3 pt-3 whitespace-nowrap transition-colors ${activeTab === 'followers' ? 'text-[#10B981] border-b-4 border-[#10B981]' : 'text-slate-600 hover:bg-slate-50 rounded-lg'}`}>Người theo dõi</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      {activeTab === 'posts' && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left Column ─── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Bio */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-bold text-slate-800">Giới thiệu</h2>
              {!editingBio && (
                <button onClick={startEditBio} className="text-slate-400 hover:text-[#245A34] transition-colors" aria-label="Sửa bio">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {editingBio ? (
              <div className="space-y-3">
                <textarea
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                  rows={3}
                  className="w-full text-[14px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]"
                  placeholder="Viết gì đó về bản thân..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveBio}
                    disabled={updateMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#10B981] text-white text-[14px] font-bold rounded-xl hover:bg-[#059669] transition-colors disabled:opacity-60"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Lưu
                  </button>
                  <button onClick={cancelEditBio} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-600 text-[14px] font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    <X className="w-3.5 h-3.5" /> Hủy
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-slate-800 text-center leading-relaxed font-medium">
                {profile.bio || <span className="text-slate-400 font-normal italic">Chưa có phần giới thiệu.</span>}
              </p>
            )}

            <div className="mt-5 space-y-3 text-[14px]">
              {profile.addressLine && (
                <div className="flex items-center gap-3 text-slate-800">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>Sống tại <span className="font-bold">{profile.addressLine}</span></span>
                </div>
              )}
              {joinedDate && (
                <div className="flex items-center gap-3 text-slate-800">
                  <CalendarDays className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>Tham gia vào <span className="font-bold">{joinedDate}</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Certificates */}
          {profile.certificates && profile.certificates.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h2 className="text-[16px] font-bold text-slate-800 mb-4">Chứng chỉ</h2>
              <div className="space-y-3">
                {profile.certificates.map((cert) => (
                  <div key={cert.id} className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-slate-800 truncate">{cert.title}</p>
                      <p className="text-[12px] text-slate-500">{cert.issuedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-[16px] font-bold text-slate-800 mb-4">Thông tin liên hệ</h2>
            <div className="space-y-3 text-[14px]">
              {profile.email && (
                <div className="flex items-center gap-3 text-slate-800">
                  <Users className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
              {profile.phoneNumber && (
                <div className="flex items-center gap-3 text-slate-800">
                  <Users className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>{profile.phoneNumber}</span>
                </div>
              )}
              {!profile.email && !profile.phoneNumber && (
                <p className="text-slate-500 italic text-[14px]">Chưa có thông tin liên hệ.</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Right Column: Posts ─── */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Create Post Box (Facebook Style) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex gap-3 items-center">
              <Avatar
                src={avatarSrc}
                name={profile.fullName}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
              />
              <Link
                to={ROUTES.DASHBOARD.COMMUNITY}
                className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full px-4 py-2.5 text-left text-[15px] text-slate-500 font-medium"
              >
                Bạn đang nghĩ gì thế?
              </Link>
            </div>
            <div className="border-t border-slate-100 mt-3 pt-2 flex">
              <Link to={ROUTES.DASHBOARD.COMMUNITY} className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold text-[14px] transition-colors">
                <Camera className="w-5 h-5 text-[#10B981]" />
                Ảnh/video
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-[16px] font-bold text-slate-800">Bài viết</h2>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center border border-slate-100 shadow-sm text-center">
              <p className="text-[15px] font-bold text-slate-500">Chưa có bài đăng nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                   <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'followers' && (
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <FollowersList userId={profile.userId} />
        </div>
      )}
    </div>
  )
}
