import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Leaf,
  AlertCircle,
  Loader2,
  Tag,
  Sun,
  Droplets,
  CalendarDays,
  Wheat,
  Wind,
} from "lucide-react";
import { useSpecies } from "./species.queries";

// ---- Helpers ---------------------------------------------------------------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <div className="text-sm text-slate-800 font-medium wrap-break-word">
          {value}
        </div>
      </div>
    </div>
  );
}

// ---- Page ------------------------------------------------------------------

export function SpeciesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: species, isLoading, isError } = useSpecies(id ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Đang tải...</span>
      </div>
    );
  }

  if (isError || !species) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-medium">Không tìm thấy loài cây</p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-emerald-600 hover:underline font-semibold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50">
            <Leaf className="w-5 h-5 text-emerald-600" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">
              {species.commonName}
            </h1>
            {species.cultivarName && (
              <p className="text-xs text-slate-500 mt-0.5">
                Giống: {species.cultivarName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-2">
        <InfoRow
          icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
          label="ID"
          value={<span className="font-mono text-xs">{species.id}</span>}
        />
        <InfoRow
          icon={<Leaf className="w-3.5 h-3.5 text-slate-400" />}
          label="Tên loài"
          value={species.commonName}
        />
        <InfoRow
          icon={<Leaf className="w-3.5 h-3.5 text-slate-400" />}
          label="Tên giống"
          value={species.cultivarName ?? "—"}
        />
        <InfoRow
          icon={<Droplets className="w-3.5 h-3.5 text-slate-400" />}
          label="Chu kỳ tưới (ngày)"
          value={
            species.waterFrequencyDays != null
              ? `${species.waterFrequencyDays} ngày`
              : "—"
          }
        />
        <InfoRow
          icon={<Sun className="w-3.5 h-3.5 text-slate-400" />}
          label="Yêu cầu ánh sáng"
          value={species.lightRequirements ?? "—"}
        />
        <InfoRow
          icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
          label="Ngày đến thu hoạch"
          value={
            species.daysToMaturity != null
              ? `${species.daysToMaturity} ngày`
              : "—"
          }
        />
        <InfoRow
          icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
          label="Cửa sổ trồng"
          value={species.plantingWindow ?? "—"}
        />
        <InfoRow
          icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
          label="Mùa vụ"
          value={species.plantingSeason ?? "—"}
        />
        <InfoRow
          icon={<Wind className="w-3.5 h-3.5 text-slate-400" />}
          label="Môi trường lý tưởng"
          value={species.idealEnv ? JSON.stringify(species.idealEnv) : "—"}
        />
        <InfoRow
          icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
          label="Khoảng cách (cm)"
          value={species.spacing != null ? `${species.spacing} cm` : "—"}
        />
        <InfoRow
          icon={<Wheat className="w-3.5 h-3.5 text-slate-400" />}
          label="Sản lượng dự kiến (kg)"
          value={
            species.expectedYieldKg != null
              ? `${species.expectedYieldKg} kg`
              : "—"
          }
        />
        {(species.commonDiseaseIds?.length ?? 0) > 0 && (
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Bệnh thường gặp (IDs)"
            value={
              <div className="flex flex-wrap gap-1 mt-0.5">
                {species.commonDiseaseIds!.map((did) => (
                  <span
                    key={did}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono"
                  >
                    {did}
                  </span>
                ))}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
