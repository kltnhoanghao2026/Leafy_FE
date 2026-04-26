import { MessageSquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { communityProfilesApi } from '../../community/api/communityProfilesApi'

export function ExpertRecommendations() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-experts', 'recommendations'],
    queryFn: () => communityProfilesApi.getPublicExperts({ size: 3 }),
  })

  const experts = data?.data?.data?.content || []

  return (
    <div className="bg-[#F2FCF4] rounded-[2rem] p-6 lg:p-8">
      <h3 className="text-[18px] font-bold text-[#245A34] tracking-tight mb-6">Chuyên gia gợi ý</h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-4 text-[#245A34] text-sm opacity-70">
          Chưa có gợi ý nào.
        </div>
      ) : (
        <div className="space-y-4">
          {experts.map((expert) => (
            <div key={expert.id} className="p-4 bg-white rounded-3xl shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={expert.profilePicture || expert.avatar || "https://i.pravatar.cc/150"} 
                  alt={expert.fullName} 
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-[15px] font-bold text-gray-900 truncate">{expert.fullName}</h4>
                  <p className="text-[11px] font-semibold text-slate-500 leading-tight mt-0.5 truncate">{expert.specialty}</p>
                </div>
              </div>
              <button className="w-10 h-10 flex shrink-0 items-center justify-center bg-[#F2FCF4] text-[#245A34] hover:bg-green-100 rounded-2xl transition-colors">
                <MessageSquare className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
