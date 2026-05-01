import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { ROUTES } from '../../../../lib/routes';
import type { FarmPlotResponse } from '../../../farm-management/types';
import type { PlantResponse, SpeciesResponse } from '../../shared/types';
import { formatDate, PLANT_STATUS_LABELS } from '../../shared/components/displayUtils';

interface PlantCardProps {
  plant: PlantResponse;
  species?: SpeciesResponse;
  farmPlot?: FarmPlotResponse;
  onEdit: (plant: PlantResponse) => void;
  onDelete: (plant: PlantResponse) => void;
}

export function PlantCard({
  plant,
  species,
  farmPlot,
  onEdit,
  onDelete,
}: PlantCardProps) {
  const displayName = plant.nickName || plant.plantNumber || "Cây trồng";
  const speciesName =
    species?.commonName || species?.cultivarName || "Chưa rõ giống cây";

  return (
    <article className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#245A34]">
            {plant.plantNumber || plant.tagCode || "Chưa có mã"}
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-900">
            {displayName}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {speciesName}
          </p>
        </div>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {PLANT_STATUS_LABELS[plant.plantStatus]}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Vườn
          </p>
          <p className="mt-2 text-sm font-bold text-slate-800">
            {farmPlot?.name || plant.farmPlotId}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Ngày trồng
          </p>
          <p className="mt-2 text-sm font-bold text-slate-800">
            {formatDate(plant.plantingDate)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={ROUTES.DASHBOARD.PLANT_DETAIL(plant.id)}
          className="inline-flex items-center rounded-2xl border border-[#245A34] bg-white px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-50"
        >
          <Eye className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Xem chi tiết
        </Link>
        <button
          type="button"
          onClick={() => onEdit(plant)}
          className="inline-flex items-center rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          <Pencil className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Chỉnh sửa
        </button>
        <button
          type="button"
          onClick={() => onDelete(plant)}
          className="inline-flex items-center rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
        >
          <Trash2 className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Xóa
        </button>
      </div>
    </article>
  );
}
