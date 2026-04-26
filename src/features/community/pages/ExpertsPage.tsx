import { useQuery, useMutation } from '@tanstack/react-query'
import { communityProfilesApi } from '../api/communityProfilesApi'
import { ShieldCheck, UserPlus, MessageCircle, Search } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function ExpertsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  
  const { data, isLoading } = useQuery({
    queryKey: ['search-experts-es', searchTerm, specialtyFilter],
    queryFn: () => communityProfilesApi.searchExpertsES({ 
      size: 50, 
      searchTerm,
      specialty: specialtyFilter 
    }),
  })

  const followMutation = useMutation({
    mutationFn: (expertId: string) => communityProfilesApi.followUser(expertId),
    onSuccess: () => {
      toast.success('Đã theo dõi chuyên gia!')
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi theo dõi.')
    }
  })

  const consultMutation = useMutation({
    mutationFn: (expertId: string) => communityProfilesApi.requestConsultation(expertId),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu tư vấn!')
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi gửi yêu cầu tư vấn.')
    }
  })

  const experts = data?.data?.data?.content || []
  
  const uniqueSpecialties = [
    "Trồng trọt", 
    "Chăn nuôi", 
    "Phân bón", 
    "Bảo vệ thực vật", 
    "Nông nghiệp hữu cơ", 
    "Tưới tiêu"
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-[#10B981]" />
            Chuyên gia Nông nghiệp
          </h1>
          <p className="text-[15px] font-medium text-slate-500 mt-1">
            Kết nối và nhận tư vấn từ các chuyên gia hàng đầu
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Specialty Filter */}
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="w-full sm:w-48 bg-white border-0 py-3.5 px-4 text-[14px] text-gray-700 font-medium rounded-2xl shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#10B981] outline-none transition-all cursor-pointer"
          >
            <option value="all">Tất cả lĩnh vực</option>
            {uniqueSpecialties.map((spec, idx) => (
              <option key={idx} value={spec}>{spec}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="w-full bg-white border-0 py-3.5 pl-11 pr-4 text-[15px] text-gray-900 font-medium rounded-2xl shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#10B981] outline-none transition-all"
              placeholder="Tìm kiếm chuyên gia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            <p className="text-[15px] font-bold text-slate-500">Đang tải danh sách chuyên gia...</p>
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-20">
            <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-[16px] font-bold text-slate-600">Không tìm thấy chuyên gia nào.</p>
            <p className="text-[14px] font-medium text-slate-500 mt-1">Vui lòng thử lại với từ khóa khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <div key={expert.id} className="group relative bg-[#F2FCF4] rounded-3xl p-6 hover:bg-[#E8F8EC] transition-colors border border-transparent hover:border-[#10B981]/20">
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <img 
                      src={expert.profilePicture || expert.avatar || "https://i.pravatar.cc/150"} 
                      alt={expert.fullName} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#10B981] border-2 border-white rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] font-bold text-gray-900 truncate group-hover:text-[#245A34] transition-colors">
                      {expert.fullName}
                    </h3>
                    <p className="text-[13px] font-bold text-[#10B981] mt-0.5 truncate">
                      {expert.specialty || "Chuyên gia nông nghiệp"}
                    </p>
                    <p className="text-[13px] font-medium text-slate-600 mt-2 line-clamp-2">
                      {expert.bio || "Chuyên gia chưa cập nhật phần giới thiệu. Vui lòng liên hệ để biết thêm chi tiết."}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-6">
                  <button 
                    onClick={() => followMutation.mutate(expert.userId)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-gray-900 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Theo dõi
                  </button>
                  <button 
                    onClick={() => consultMutation.mutate(expert.userId)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#245A34] text-white text-[13px] font-bold rounded-xl hover:bg-[#1A4226] transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Tư vấn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
