import { MessageSquare } from 'lucide-react'

// Mock Data
const EXPERTS = [
  {
    id: 1,
    name: 'ThS. Nguyễn An',
    title: 'Chuyên gia cây công nghiệp',
    imageUrl: 'https://i.pravatar.cc/150?img=11',
  },
  {
    id: 2,
    name: 'Kỹ sư Trần Bình',
    title: 'Chuyên gia bảo vệ thực vật',
    imageUrl: 'https://i.pravatar.cc/150?img=5',
  }
]

export function ExpertRecommendations() {
  return (
    <div className="bg-[#F2FCF4] rounded-[2rem] p-6 lg:p-8">
      <h3 className="text-[18px] font-bold text-[#245A34] tracking-tight mb-6">Chuyên gia gợi ý</h3>
      
      <div className="space-y-4">
        {EXPERTS.map((expert) => (
          <div key={expert.id} className="p-4 bg-white rounded-3xl shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={expert.imageUrl} 
                alt={expert.name} 
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-[15px] font-bold text-gray-900 truncate">{expert.name}</h4>
                <p className="text-[11px] font-semibold text-slate-500 leading-tight mt-0.5">{expert.title}</p>
              </div>
            </div>
            <button className="w-10 h-10 flex shrink-0 items-center justify-center bg-[#F2FCF4] text-[#245A34] hover:bg-green-100 rounded-2xl transition-colors">
              <MessageSquare className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
