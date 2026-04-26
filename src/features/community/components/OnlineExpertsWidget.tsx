import { ShieldCheck, UserPlus, MessageCircle } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { communityProfilesApi } from '../api/communityProfilesApi'
import toast from 'react-hot-toast'

export function OnlineExpertsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-experts'],
    queryFn: () => communityProfilesApi.getPublicExperts({ size: 5 }),
  })

  const followMutation = useMutation({
    mutationFn: (expertId: string) => communityProfilesApi.followUser(expertId),
    onSuccess: () => {
      toast.success('Đã theo dõi chuyên gia!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  });

  const experts = data?.data?.data?.content || []

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/50">
      
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-[#10B981]" strokeWidth={2.5} />
        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Chuyên gia trực tuyến</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Chưa có chuyên gia nào.
        </div>
      ) : (
        <div className="space-y-5 mb-6">
          {experts.map((expert) => (
            <div key={expert.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={expert.profilePicture || expert.avatar || "https://i.pravatar.cc/150"} 
                    alt={expert.fullName} 
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-gray-900 group-hover:text-[#245A34] transition-colors cursor-pointer max-w-[120px] truncate">
                    {expert.fullName}
                  </span>
                  <span className="text-[12px] font-medium text-slate-500 max-w-[120px] truncate">
                    {expert.specialty || "Chuyên gia nông nghiệp"}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => followMutation.mutate(expert.userId)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-[#10B981] hover:text-white transition-colors"
                  title="Theo dõi"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-[#245A34] hover:text-white transition-colors"
                  title="Nhắn tin"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="w-full py-2.5 rounded-full border border-slate-200 text-[14px] font-bold text-[#245A34] hover:bg-slate-50 transition-colors">
        Xem tất cả chuyên gia
      </button>

    </div>
  )
}
