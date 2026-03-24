import { Flame } from 'lucide-react'
import type { HotTopic } from '../types'
import { MOCK_HOT_TOPICS } from '../mockCommunityData'

export function HotTopicsWidget() {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/50">
      
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-[#245A34]" strokeWidth={2.5} />
        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Chủ đề hot</h3>
      </div>

      <div className="space-y-5">
        {MOCK_HOT_TOPICS.map((topic: HotTopic) => (
          <div key={topic.id} className="group cursor-pointer">
            <p className="text-[14px] font-bold text-[#245A34] mb-0.5 group-hover:underline">
              {topic.tag}
            </p>
            <p className="text-[15px] font-bold text-gray-900 leading-tight mb-1 group-hover:text-[#245A34] transition-colors">
              {topic.title}
            </p>
            <p className="text-[13px] font-medium text-slate-500">
              {topic.engagementText}
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}
