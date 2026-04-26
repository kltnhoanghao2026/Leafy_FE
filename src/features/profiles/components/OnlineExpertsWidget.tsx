import { ShieldCheck, UserPlus, MessageCircle, Check } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { profilesApi } from '../api/profilesApi'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function OnlineExpertsWidget() {
  const [localFollowState, setLocalFollowState] = useState<Record<string, boolean>>({})
  const [localConsultState, setLocalConsultState] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['public-experts'],
    queryFn: () => profilesApi.getPublicExperts({ size: 5 }),
  })

  const followMutation = useMutation({
    mutationFn: (expertId: string) => profilesApi.followUser(expertId),
    onSuccess: (_, expertId) => {
      setLocalFollowState(prev => ({ ...prev, [expertId]: true }));
      toast.success('Đã theo dõi chuyên gia!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  });

  const consultMutation = useMutation({
    mutationFn: (expertId: string) => profilesApi.requestConsultation(expertId),
    onSuccess: (_, expertId) => {
      setLocalConsultState(prev => ({ ...prev, [expertId]: true }));
      toast.success('Đã gửi yêu cầu tư vấn!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi gửi yêu cầu tư vấn.');
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: (expertId: string) => profilesApi.unfollowUser(expertId),
    onSuccess: (_, expertId) => {
      setLocalFollowState(prev => ({ ...prev, [expertId]: false }));
      toast.success('Đã hủy theo dõi!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  });

  const cancelConsultMutation = useMutation({
    mutationFn: (expertId: string) => profilesApi.cancelConsultation(expertId),
    onSuccess: (_, expertId) => {
      setLocalConsultState(prev => ({ ...prev, [expertId]: false }));
      toast.success('Đã hủy yêu cầu tư vấn!');
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
          {experts.map((expert) => {
            const isFollowed = localFollowState[expert.userId] ?? expert.isFollowing;
            const isConsulted = localConsultState[expert.userId] ?? expert.hasPendingConsultRequest;
            return (
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
                    onClick={() => isFollowed ? unfollowMutation.mutate(expert.userId) : followMutation.mutate(expert.userId)}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      isFollowed 
                        ? 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                        : 'bg-slate-50 text-slate-600 hover:bg-[#10B981] hover:text-white'
                    }`}
                    title={isFollowed ? "Hủy theo dõi" : "Theo dõi"}
                  >
                    {isFollowed ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => isConsulted ? cancelConsultMutation.mutate(expert.userId) : consultMutation.mutate(expert.userId)}
                    disabled={consultMutation.isPending || cancelConsultMutation.isPending}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      isConsulted
                        ? 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                        : 'bg-slate-50 text-slate-600 hover:bg-[#245A34] hover:text-white'
                    }`}
                    title={isConsulted ? "Hủy yêu cầu tư vấn" : "Yêu cầu tư vấn"}
                  >
                    {isConsulted ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="w-full py-2.5 rounded-full border border-slate-200 text-[14px] font-bold text-[#245A34] hover:bg-slate-50 transition-colors">
        Xem tất cả chuyên gia
      </button>

    </div>
  )
}
