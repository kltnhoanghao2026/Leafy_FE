import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Award, MapPin, MessageCircle, Loader2, CalendarDays, UserPlus, Check,
  ArrowLeft, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '../../../components/ui/Avatar'
import { ROUTES } from '../../../lib/routes'
import { profilesApi } from '../api/profilesApi'
import { chatApi } from '../../chat/api/chatApi'
import { PostCard } from '../../community/components/PostCard'
import { mapPostResponseToPost } from '../../community/mappers'
import { FollowersList } from '../components/FollowersList'
import { FollowingList } from '../components/FollowingList'

const ROLE_LABELS: Record<string, string> = { FARMER: 'Nông dân', EXPERT: 'Chuyên gia' }

function usePublicProfile(profileId: string) {
  return useQuery({
    queryKey: ['profiles', 'public', profileId],
    queryFn: () => profilesApi.getPublicProfile(profileId),
    select: (r) => r.data.data,
    enabled: !!profileId,
  })
}

function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-posts', userId],
    queryFn: () => profilesApi.getPostsByUserId(userId!),
    enabled: !!userId,
    select: (r) => r.data.data?.content.map(mapPostResponseToPost) ?? [],
  })
}

export function UserProfilePage() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: profile, isLoading, error } = usePublicProfile(profileId ?? '')
  const { data: posts = [] } = useUserPosts(profile?.id)

  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following' | 'certificates'>('posts')
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null)
  const [localConsulted, setLocalConsulted] = useState<boolean | null>(null)

  const followMutation = useMutation({
    mutationFn: (profileId: string) => profilesApi.followUser(profileId),
    onSuccess: () => {
      setLocalFollowing(true)
      toast.success('Đã theo dõi!')
      qc.invalidateQueries({ queryKey: ['profiles', 'public', profileId] })
    },
    onError: () => toast.error('Có lỗi xảy ra khi theo dõi.'),
  })

  const unfollowMutation = useMutation({
    mutationFn: (profileId: string) => profilesApi.unfollowUser(profileId),
    onSuccess: () => {
      setLocalFollowing(false)
      toast.success('Đã hủy theo dõi!')
      qc.invalidateQueries({ queryKey: ['profiles', 'public', profileId] })
    },
    onError: () => toast.error('Có lỗi xảy ra khi hủy theo dõi.'),
  })

  const consultMutation = useMutation({
    mutationFn: (profileId: string) => profilesApi.requestConsultation(profileId),
    onSuccess: () => {
      setLocalConsulted(true)
      toast.success('Đã gửi yêu cầu tư vấn!')
    },
    onError: () => toast.error('Có lỗi xảy ra khi gửi yêu cầu.'),
  })

  const cancelConsultMutation = useMutation({
    mutationFn: (profileId: string) => profilesApi.cancelConsultation(profileId),
    onSuccess: () => {
      setLocalConsulted(false)
      toast.success('Đã hủy yêu cầu tư vấn!')
    },
    onError: () => toast.error('Có lỗi xảy ra khi hủy yêu cầu.'),
  })

  const textMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const conv = await chatApi.getOrCreateConversation(profileId)
      return conv
    },
    onSuccess: (conversation) => {
      navigate(ROUTES.DASHBOARD.CHAT, {
        state: { openConversationId: conversation.id },
      })
    },
    onError: () => toast.error('Không thể mở cuộc trò chuyện.'),
  })

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
        <p className="text-sm font-semibold text-slate-500">Không tìm thấy hồ sơ này.</p>
        <Link to={ROUTES.DASHBOARD.EXPERTS} className="text-sm font-bold text-[#10B981] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách chuyên gia
        </Link>
      </div>
    )
  }

  const isFollowing = localFollowing ?? profile.isFollowing ?? false
  const isConsulted = localConsulted ?? profile.hasPendingConsultRequest ?? false
  const isExpert = profile.role === 'EXPERT'
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role
  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    : null

  const actionPending =
    followMutation.isPending ||
    unfollowMutation.isPending ||
    consultMutation.isPending ||
    cancelConsultMutation.isPending ||
    textMutation.isPending

  return (
    <div className="pb-20 animate-fade-in bg-slate-50 min-h-screen -mt-6">
      {/* ─── Full-width Header ─── */}
      <div className="bg-white shadow-sm mb-6 pb-2">
        <div className="max-w-5xl mx-auto relative">
          {/* Cover Photo */}
          <div className="h-64 md:h-80 w-full bg-gradient-to-br from-[#1a4226] via-[#245A34] to-[#10B981] md:rounded-b-2xl relative overflow-hidden">
            <Link
              to={ROUTES.DASHBOARD.EXPERTS}
              className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 text-sm font-bold text-white bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Danh sách
            </Link>
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          </div>

          {/* Profile Info Area */}
          <div className="px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-4 md:items-end -mt-16 md:-mt-20 relative z-10 mb-4">
              {/* Avatar */}
              <div className="relative inline-block shrink-0 self-center md:self-auto">
                <Avatar
                  src={profile.profilePicture || profile.avatar}
                  name={profile.fullName}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md object-cover bg-white"
                />
                {profile.isVerified && (
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-[#10B981] border-4 border-white rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left mt-2 md:mt-0 md:pb-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                  {profile.fullName || 'Không rõ tên'}
                </h1>
                <p className="text-[15px] font-semibold text-slate-500 mt-1">
                  {roleLabel} {profile.specialty ? ` • ${profile.specialty}` : ''}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center md:justify-end gap-2 md:pb-2 shrink-0">
                {/* Follow / Following */}
                <button
                  onClick={() =>
                    isFollowing
                      ? unfollowMutation.mutate(profile.id)
                      : followMutation.mutate(profile.id)
                  }
                  disabled={actionPending}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-colors disabled:opacity-60 ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'bg-[#10B981] text-white hover:bg-[#059669]'
                  }`}
                >
                  {isFollowing ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </button>

                {/* Consult (experts only) */}
                {isExpert && (
                  <button
                    onClick={() =>
                      isConsulted
                        ? cancelConsultMutation.mutate(profile.id)
                        : consultMutation.mutate(profile.id)
                    }
                    disabled={actionPending}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-colors disabled:opacity-60 ${
                      isConsulted
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'bg-[#245A34] text-white hover:bg-[#1a4226]'
                    }`}
                  >
                    {isConsulted ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                    {isConsulted ? 'Hủy tư vấn' : 'Yêu cầu tư vấn'}
                  </button>
                )}

                {/* Text / Message */}
                <button
                  onClick={() => textMutation.mutate(profile.id)}
                  disabled={actionPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-colors bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-60"
                >
                  {textMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  Nhắn tin
                </button>
              </div>
            </div>

            {/* Divider & Tabs */}
            <div className="border-t border-slate-200/60 pt-1 flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`font-bold px-4 pb-3 pt-3 whitespace-nowrap transition-colors ${activeTab === 'posts' ? 'text-[#10B981] border-b-4 border-[#10B981]' : 'text-slate-600 hover:bg-slate-50 rounded-lg'}`}>Bài viết</button>
              <button 
                onClick={() => setActiveTab('certificates')}
                className={`font-bold px-4 pb-3 pt-3 whitespace-nowrap transition-colors ${activeTab === 'certificates' ? 'text-[#10B981] border-b-4 border-[#10B981]' : 'text-slate-600 hover:bg-slate-50 rounded-lg'}`}>Chứng chỉ</button>
              <button 
                onClick={() => setActiveTab('following')}
                className={`font-bold px-4 pb-3 pt-3 whitespace-nowrap transition-colors ${activeTab === 'following' ? 'text-[#10B981] border-b-4 border-[#10B981]' : 'text-slate-600 hover:bg-slate-50 rounded-lg'}`}>Đang theo dõi</button>
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
            <h2 className="text-[16px] font-bold text-slate-800 mb-3">Giới thiệu</h2>
            <p className="text-[14px] text-slate-800 text-center leading-relaxed font-medium">
              {profile.bio || <span className="text-slate-400 font-normal italic">Chưa có phần giới thiệu.</span>}
            </p>
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
        </div>

        {/* ─── Right Column: Posts ─── */}
        <div className="lg:col-span-2 space-y-4">
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

      {activeTab === 'certificates' && (
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-[16px] font-bold text-slate-800 mb-4">Chứng chỉ</h2>
            {profile.certificates && profile.certificates.length > 0 ? (
              <div className="space-y-4">
                {profile.certificates.map((cert) => (
                  <div key={cert.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#10B981]/30 transition-colors">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-800">{cert.title}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">{cert.issuedBy}</p>
                      {cert.issueDate && (
                        <p className="text-[12px] text-slate-400 mt-1">
                          Ngày cấp: {new Date(cert.issueDate).toLocaleDateString('vi-VN')}
                          {cert.expired && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-500 font-bold rounded-full text-[11px]">Hết hạn</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-800 mb-1">Chưa có chứng chỉ</h3>
                <p className="text-[14px] text-slate-500">Người dùng này chưa có chứng chỉ nào được duyệt.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'following' && (
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <FollowingList profileId={profile.id} />
        </div>
      )}

      {activeTab === 'followers' && (
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <FollowersList profileId={profile.id} />
        </div>
      )}
    </div>
  )
}
