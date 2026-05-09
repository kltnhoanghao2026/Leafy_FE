import { Check, Eye, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { FarmPlotResponse } from '../../../farm-management/types';
import type { PlantResponse, PlantStatus, SpeciesResponse } from '../../shared/types';
import { formatDate } from '../../shared/components/displayUtils';
import { usePlantManagementLabels } from '../../shared/components/useDisplayLabels';
import { useTranslation } from '../../../../i18n';

const STATUS_BADGE: Record<PlantStatus, string> = {
  ACTIVE: "border-emerald-100 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-amber-100 bg-amber-50 text-amber-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-600",
};

function SelectionBox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition-all
        ${checked
          ? 'border-[#245A34] bg-[#245A34]'
          : 'border-slate-300 bg-white hover:border-[#245A34]'
        }`}
    >
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </span>
  );
}

interface PlantCardProps {
  plant: PlantResponse;
  species?: SpeciesResponse;
  farmPlot?: FarmPlotResponse;
  onEdit?: (plant: PlantResponse) => void;
  onDelete?: (plant: PlantResponse) => void;
  onClickDetail?: () => void;
  detailUrl?: string;
  hideActions?: boolean;
  actions?: React.ReactNode;
  variant?: 'grid' | 'list';
  selected?: boolean;
  onToggleSelect?: (plant: PlantResponse) => void;
}

export function PlantCard({
  plant,
  species,
  farmPlot,
  onEdit,
  onDelete,
  onClickDetail,
  detailUrl,
  hideActions,
  actions,
  variant = 'grid',
  selected,
  onToggleSelect,
}: PlantCardProps) {
  const { t } = useTranslation();
  const { plantStatusLabel } = usePlantManagementLabels();
  const displayName = plant.nickName || plant.plantNumber || t('plantManagement.plant.unknownPlant');
  const speciesName = species?.commonName || species?.cultivarName || t('plantManagement.plant.unknownSpecies');
  const badgeClass = STATUS_BADGE[plant.plantStatus] ?? STATUS_BADGE.ACTIVE;

  if (variant === 'list') {
    return (
      <article
        onClick={onToggleSelect ? () => onToggleSelect(plant) : undefined}
        className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all
          ${selected ? 'border-[#245A34] bg-emerald-50/40 ring-1 ring-[#245A34]/20' : 'border-slate-100 hover:shadow-md'}
          ${onToggleSelect ? 'cursor-pointer select-none' : ''}
        `}
      >
        {onToggleSelect && (
          <SelectionBox
            checked={!!selected}
            onToggle={(e) => { e.stopPropagation(); onToggleSelect(plant); }}
          />
        )}

        {/* Name / code */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#245A34]">
            {plant.plantNumber || plant.tagCode || t('plantManagement.plant.noCode')}
          </p>
          <p className="truncate text-sm font-black text-slate-900">{displayName}</p>
          <p className="truncate text-xs font-semibold text-slate-500">{speciesName}</p>
        </div>

        {/* Farm + date */}
        <div className="hidden shrink-0 flex-col gap-0.5 sm:flex">
          <p className="text-xs font-semibold text-slate-700">{farmPlot?.name || plant.farmPlotId || '—'}</p>
          <p className="text-xs text-slate-400">{formatDate(plant.plantingDate)}</p>
        </div>

        {/* Status badge */}
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-black ${badgeClass}`}>
          {plantStatusLabel(plant.plantStatus)}
        </span>

        {/* Actions */}
        {!hideActions && (
          <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
            {actions ?? (
              <>
                {detailUrl ? (
                  <Link
                    to={detailUrl}
                    className="inline-flex items-center rounded-xl border border-[#245A34] bg-white px-3 py-1.5 text-xs font-bold text-[#245A34] hover:bg-green-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
                    {t('plantManagement.common.viewDetail')}
                  </Link>
                ) : onClickDetail ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClickDetail(); }}
                    className="inline-flex items-center rounded-xl border border-[#245A34] bg-white px-3 py-1.5 text-xs font-bold text-[#245A34] hover:bg-green-50"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
                    {t('plantManagement.common.viewDetail')}
                  </button>
                ) : null}
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(plant); }}
                    className="inline-flex items-center rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(plant); }}
                    className="inline-flex items-center rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </article>
    );
  }

  // ── Grid variant ──────────────────────────────────────────────────────────
  return (
    <article
      onClick={onToggleSelect ? () => onToggleSelect(plant) : undefined}
      className={`rounded-[1.75rem] border bg-white p-5 shadow-sm transition-all
        ${selected
          ? 'border-[#245A34] bg-emerald-50/30 ring-2 ring-[#245A34]/20'
          : 'border-slate-100 hover:-translate-y-0.5 hover:shadow-md'
        }
        ${onToggleSelect ? 'cursor-pointer select-none' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {onToggleSelect && (
            <SelectionBox
              checked={!!selected}
              onToggle={(e) => { e.stopPropagation(); onToggleSelect(plant); }}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#245A34]">
              {plant.plantNumber || plant.tagCode || t('plantManagement.plant.noCode')}
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-900">
              {displayName}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {speciesName}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${badgeClass}`}>
          {plantStatusLabel(plant.plantStatus)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{t('plantManagement.plant.farm')}</p>
          <p className="mt-2 text-sm font-bold text-slate-800">{farmPlot?.name || plant.farmPlotId}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{t('plantManagement.plant.plantingDate')}</p>
          <p className="mt-2 text-sm font-bold text-slate-800">{formatDate(plant.plantingDate)}</p>
        </div>
      </div>

      {!hideActions && (
        <div className="mt-5 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {actions ?? (
            <>
              {detailUrl ? (
                <Link
                  to={detailUrl}
                  className="inline-flex items-center rounded-2xl border border-[#245A34] bg-white px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  {t('plantManagement.common.viewDetail')}
                </Link>
              ) : onClickDetail ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClickDetail(); }}
                  className="inline-flex items-center rounded-2xl border border-[#245A34] bg-white px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-50"
                >
                  <Eye className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  {t('plantManagement.common.viewDetail')}
                </button>
              ) : null}
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(plant); }}
                  className="inline-flex items-center rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Pencil className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  {t('plantManagement.common.edit')}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(plant); }}
                  className="inline-flex items-center rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  {t('plantManagement.common.delete')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}
