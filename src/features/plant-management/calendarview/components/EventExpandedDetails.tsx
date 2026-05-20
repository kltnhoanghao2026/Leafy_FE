import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  DollarSign,
  ShieldAlert,
  Info,
  Pencil,
  Trash2,
  Leaf,
  MapPin,
} from 'lucide-react';
import { CheckCircle2, Circle } from 'lucide-react';
import { ROUTES } from '../../../../lib/routes';
import type { PlantEventResponse } from '../../shared/types';
import { TARGET_TYPE_LABELS, TARGET_TYPE_ICONS } from '../../shared/components/displayUtils';
import { FileThumbnail } from './FileThumbnail';
import type { EventAccentStyle } from '../../schemas/eventAccent';

interface EventExpandedDetailsProps {
  event: PlantEventResponse;
  accent: EventAccentStyle;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
  onSelectEvent?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  startLabel?: string | null;
  endLabel?: string | null;
  durationEndLabel?: string | null;
}

export function EventExpandedDetails({
  event,
  accent,
  Icon,
  onEdit,
  onDelete,
  onSelectEvent,
  onToggleTask,
  startLabel,
  endLabel,
  durationEndLabel,
}: EventExpandedDetailsProps) {
  return (
    <div className="space-y-2.5 bg-slate-50/60 px-3 py-3">
      {/* Description */}
      {event.description && (
        <p className="text-xs leading-relaxed text-slate-600">{event.description}</p>
      )}

      {/* Metric cards */}
      {(startLabel || endLabel || event.durationDays != null || event.estimatedCost != null || event.phiDays != null
        || (event.trackingGranularity && event.trackingGranularity !== 'NONE' && event.progressTotal != null && event.progressTotal > 0)
      ) && (
        <div className="grid grid-cols-2 gap-1.5">
          {startLabel && (
            <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">Bắt đầu</p>
                <p className="text-xs font-semibold text-slate-700">{startLabel}</p>
              </div>
            </div>
          )}
          {endLabel && (
            <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">Kết thúc</p>
                <p className="text-xs font-semibold text-slate-700">{endLabel}</p>
              </div>
            </div>
          )}
          {event.durationDays != null && (
            <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">Thời lượng</p>
                <p className="text-xs font-semibold text-slate-700">{event.durationDays} ngày</p>
              </div>
            </div>
          )}
          {event.estimatedCost != null && (
            <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
              <DollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">Chi phí</p>
                <p className="text-xs font-semibold text-slate-700">{event.estimatedCost}</p>
              </div>
            </div>
          )}
          {event.phiDays != null && (
            <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">PHI (ngày cách ly)</p>
                <p className="text-xs font-semibold text-slate-700">{event.phiDays} ngày</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scope badge */}
      {event.targetType && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm" aria-hidden>
            {(() => {
              const TargetIcon = TARGET_TYPE_ICONS[event.targetType];
              return TargetIcon ? <TargetIcon className="h-3.5 w-3.5" /> : null;
            })()}
          </span>
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide"
            style={{
              borderColor: `${accent.dotColor}40`,
              color: accent.dotColor,
              backgroundColor: `${accent.dotColor}10`,
            }}
          >
            {TARGET_TYPE_LABELS[event.targetType] ?? event.targetType}
          </span>
        </div>
      )}

      {/* Related entity info cards */}
      {(event.plant || event.farmPlot || event.farmZone || event.planApply) && (
        <div className="grid grid-cols-1 gap-1.5">
          {event.plant && (
            <EntityCard
              icon={<Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />}
              label="Cây"
              primaryText={event.plant.nickName || event.plant.plantNumber || event.plant.tagCode || event.plant.id}
              secondaryText={event.plant.tagCode ? `(${event.plant.tagCode})` : undefined}
              href={ROUTES.DASHBOARD.PLANT_DETAIL(event.plantId)}
              borderColor="emerald"
            />
          )}
          {event.farmPlot && (
            <EntityCard
              icon={<MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />}
              label="Vườn"
              primaryText={event.farmPlot.name || event.farmPlot.code || event.farmPlot.id}
              secondaryText={event.farmPlot.addressLine}
              href={ROUTES.DASHBOARD.FARM_PLOT_DETAIL(event.farmPlotId ?? '')}
              borderColor="amber"
            />
          )}
          {event.farmZone && (
            <EntityCard
              icon={<MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />}
              label="Khu vực"
              primaryText={event.farmZone.zoneName || event.farmZone.zoneCode || event.farmZone.id}
              href={ROUTES.DASHBOARD.FARM_ZONE_DETAIL(event.farmPlotId ?? '', event.farmZoneId ?? '')}
              borderColor="blue"
            />
          )}
          {event.planApply && (
            <EntityCard
              icon={<CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />}
              label="Kế hoạch"
              primaryText={event.planApply.planName || `...${event.planApply.planId?.slice(-6)}`}
              secondaryText={event.planApply.diseaseName}
              badge={event.planApply.status}
              href={ROUTES.DASHBOARD.PLAN_DETAIL(event.planApply.planId ?? '')}
              borderColor="purple"
            />
          )}
        </div>
      )}

      {/* PPE alert */}
      {event.ppeRequired && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-[10px] font-semibold text-amber-600">Thiết bị bảo hộ (PPE)</p>
            <p className="text-xs text-amber-700">{event.ppeRequired}</p>
          </div>
        </div>
      )}

      {/* MRL note alert */}
      {event.mrlNote && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          <div>
            <p className="text-[10px] font-semibold text-red-600">Ghi chú MRL</p>
            <p className="text-xs text-red-700">{event.mrlNote}</p>
          </div>
        </div>
      )}

      {/* Attachments */}
      {event.attachmentIds != null && event.attachmentIds.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Tệp đính kèm ({event.attachmentIds.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {event.attachmentIds.map((fileId, idx) => (
              <FileThumbnail key={idx} fileId={fileId} />
            ))}
          </div>
        </div>
      )}

      {/* Task checklist */}
      {event.tasks != null && event.tasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Công việc</p>
          {event.tasks.map((task, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2"
            >
              <button
                type="button"
                title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                onClick={() => onToggleTask?.(event, idx)}
                className="mt-0.5 shrink-0 transition-colors hover:opacity-70"
              >
                {task.completed
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <Circle className="h-4 w-4 text-slate-300" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-0.5 text-[11px] text-slate-400">{task.description}</p>
                )}
              </div>
              {task.estimatedCost && (
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${accent.countBg} ${accent.countText}`}>
                  {task.estimatedCost}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit / Delete buttons */}
      {(onEdit || onDelete || onSelectEvent) && (
        <div className="flex justify-end gap-2 pt-0.5">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(event)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <Trash2 className="h-3 w-3" />
              Xóa
            </button>
          )}
          {onSelectEvent && (
            <button
              type="button"
              onClick={() => onSelectEvent(event)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#245A34] hover:bg-[#245A34]/10 hover:text-[#245A34]"
            >
              <Leaf className="h-3 w-3" />
              Theo dõi
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(event)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${accent.badgeBg} ${accent.badgeBorder} ${accent.badgeText} hover:opacity-80`}
            >
              <Pencil className="h-3 w-3" />
              Chỉnh sửa
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── EntityCard ──────────────────────────────────────────────────────────────────

interface EntityCardProps {
  icon: React.ReactNode;
  label: string;
  primaryText: string;
  secondaryText?: string;
  badge?: string | null;
  href: string;
  borderColor: 'emerald' | 'amber' | 'blue' | 'purple';
}

function EntityCard({ icon, label, primaryText, secondaryText, badge, href, borderColor }: EntityCardProps) {
  const navigate = useNavigate();
  const colorMap = {
    emerald: { border: 'hover:border-emerald-300', bg: 'hover:bg-emerald-50/30' },
    amber: { border: 'hover:border-amber-300', bg: 'hover:bg-amber-50/30' },
    blue: { border: 'hover:border-blue-300', bg: 'hover:bg-blue-50/30' },
    purple: { border: 'hover:border-purple-300', bg: 'hover:bg-purple-50/30' },
  };
  const c = colorMap[borderColor];

  const statusBg =
    badge === 'ACTIVE' ? 'bg-green-100 text-green-700' :
    badge === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
    badge === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
    badge === 'CANCELLED' ? 'bg-red-100 text-red-700' :
    'bg-slate-100 text-slate-600';

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className={`flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2 hover:border-slate-300 transition-all cursor-pointer text-left w-full ${c.border} ${c.bg}`}
    >
      {icon}
      <div>
        <p className="text-[10px] text-slate-400">{label}</p>
        <p className="text-xs font-semibold text-slate-700">
          {primaryText}
          {secondaryText && <span className="ml-1 text-slate-400">- {secondaryText}</span>}
        </p>
        {badge && (
          <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusBg}`}>
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}
