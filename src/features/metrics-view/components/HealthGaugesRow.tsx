import type { ComponentType } from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import type { ZoneHealth } from '../mockData'

interface HealthGaugesRowProps {
  health: ZoneHealth
}

function ProgressCard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass,
  iconBgClass
}: { 
  title: string, 
  value: number, 
  icon: ComponentType<{ className?: string; strokeWidth?: number }>, 
  colorClass: string,
  iconBgClass: string
}) {
  return (
    <div className={`bg-white rounded-l-full rounded-r-[2rem] p-6 md:py-6 md:pl-10 md:pr-8 flex items-center justify-between shadow-sm border border-slate-100/80 border-l-4 ${colorClass.replace('text-', 'border-l-')} overflow-hidden h-[120px]`}>
      
      <div className="z-10 relative">
        <h4 className="text-[14px] font-bold text-slate-500 mb-2">{title}</h4>
        <p className="text-[36px] font-black text-slate-800 leading-none">{value}%</p>
      </div>

      <div className={`z-10 relative w-12 h-12 rounded-full flex items-center justify-center ${iconBgClass} shrink-0`}>
        <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={3} />
      </div>
    </div>
  )
}

export function HealthGaugesRow({ health }: HealthGaugesRowProps) {
  // Using custom icons or fallback lucide icons
  const ExclamationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ProgressCard 
        title="Cây khỏe mạnh" 
        value={health.healthy} 
        icon={Check} 
        colorClass="text-[#10B981]" // Emerald
        iconBgClass="bg-[#ECFDF5]"
      />
      <ProgressCard 
        title="Cảnh báo sức khỏe" 
        value={health.warning} 
        icon={AlertTriangle} 
        colorClass="text-[#F59E0B]" // Amber
        iconBgClass="bg-[#FFFBEB]"
      />
      <ProgressCard 
        title="Nghiêm trọng" 
        value={health.danger} 
        icon={ExclamationIcon} 
        colorClass="text-[#EF4444]" // Red
        iconBgClass="bg-[#FEF2F2]"
      />
    </div>
  )
}
