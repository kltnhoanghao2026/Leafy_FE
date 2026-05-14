import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Play,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CommunityPlanInfo } from '../types'
import { ROUTES } from '../../../lib/routes'

const SEVERITY_BADGE: Record<string, string> = {
  LOW:      'bg-green-100 text-green-700',
  MEDIUM:   'bg-amber-100 text-amber-700',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

interface PlanReferenceCardProps {
  planId: string
  planInfo?: CommunityPlanInfo | null
}

export function PlanReferenceCard({ planId, planInfo }: PlanReferenceCardProps) {
  const title = planInfo?.diseaseName ?? planInfo?.planName ?? 'Kế hoạch điều trị'
  const severityKey = planInfo?.severityLevel?.toUpperCase() ?? ''
  const severityBadge = SEVERITY_BADGE[severityKey] ?? 'bg-slate-100 text-slate-600'

  return (
    <Link
      to={ROUTES.DASHBOARD.COMMUNITY_PLAN_VIEW(planId)}
      className="group block rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-300 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#245A34] to-emerald-400" />

      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#245A34]/10 mt-0.5">
              <ClipboardList className="w-4.5 h-4.5 text-[#245A34]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-[#245A34] uppercase tracking-widest mb-0.5">
                Kế hoạch điều trị được chia sẻ
              </p>
              <p className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">
                {title}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#245A34] shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
        </div>

        {/* Meta badges row */}
        {planInfo && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {planInfo.severityLevel && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black ${severityBadge}`}>
                {planInfo.severityLevel}
              </span>
            )}
            {planInfo.urgency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-black text-orange-700">
                <ShieldAlert className="w-3 h-3" strokeWidth={2.5} />
                {planInfo.urgency}
              </span>
            )}
            {planInfo.estimatedCost && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                <DollarSign className="w-3 h-3" strokeWidth={2.5} />
                {planInfo.estimatedCost}
              </span>
            )}
            {(planInfo.applyCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                <Users className="w-3 h-3" strokeWidth={2.5} />
                {planInfo.applyCount} đã áp dụng
              </span>
            )}
            {(planInfo.eventCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <CalendarDays className="w-3 h-3" strokeWidth={2.5} />
                {planInfo.eventCount} tác vụ
              </span>
            )}
          </div>
        )}

        {/* Required inputs preview */}
        {planInfo?.requiredInputs && planInfo.requiredInputs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {planInfo.requiredInputs.slice(0, 3).map((inp, i) => (
              <span key={i} className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {inp}
              </span>
            ))}
            {planInfo.requiredInputs.length > 3 && (
              <span className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                +{planInfo.requiredInputs.length - 3} khác
              </span>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Bấm để xem chi tiết & áp dụng</span>
          <span className="inline-flex items-center gap-1 rounded-xl bg-[#245A34] px-3 py-1 text-[11px] font-black text-white group-hover:bg-[#1b4528] transition-colors">
            <Play className="w-2.5 h-2.5" strokeWidth={3} />
            Áp dụng
          </span>
        </div>
      </div>
    </Link>
  )
}
