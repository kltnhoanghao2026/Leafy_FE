import { useQuery } from '@tanstack/react-query'
import { Loader2, Users } from 'lucide-react'
import { profilesApi } from '../api/profilesApi'
import { Avatar } from '../../../components/ui/Avatar'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../lib/routes'

export function FollowersList({ profileId }: { profileId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile-followers', profileId],
    queryFn: () => profilesApi.getFollowersProfiles(profileId, { size: 50 }),
    enabled: !!profileId,
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
        <p className="mt-3 text-[14px] font-semibold text-slate-500">Đang tải người theo dõi...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-[14px] font-semibold text-slate-500">Không thể tải danh sách người theo dõi.</p>
      </div>
    )
  }

  const followers = data?.data?.data?.content || []

  if (followers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-800 mb-1">Chưa có người theo dõi</h3>
        <p className="text-[14px] text-slate-500">Khi có người theo dõi bạn, họ sẽ xuất hiện ở đây.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h2 className="text-[16px] font-bold text-slate-800 mb-4 px-1">Người theo dõi ({followers.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {followers.map(follower => {
          const avatar = follower.avatar || follower.profilePicture || undefined;
          return (
            <div key={follower.userId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-[#10B981]/30 hover:bg-slate-50 transition-colors">
              <Link to={ROUTES.DASHBOARD.PROFILE_VIEW(follower.id)} className="shrink-0">
                <Avatar 
                  src={avatar} 
                  name={follower.fullName} 
                  size="lg" 
                  className="border border-slate-200" 
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={ROUTES.DASHBOARD.PROFILE_VIEW(follower.id)} className="block">
                  <h4 className="text-[14px] font-bold text-gray-900 truncate hover:text-[#10B981] transition-colors">{follower.fullName || 'Người dùng'}</h4>
                </Link>
                {follower.specialty && (
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">{follower.specialty}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
