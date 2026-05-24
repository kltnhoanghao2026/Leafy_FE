import { Leaf, Droplets, Sun, CalendarDays, Wheat, Loader2 } from "lucide-react";
import { useSpecies } from "../queries/species.queries";

function SpeciesCard({ species }: { species: { id: string; commonName: string | null; cultivarName: string | null; lightRequirements: string | null; waterFrequencyDays: number | null; daysToMaturity: number | null; expectedYieldKg: number | null; plantingSeason: string | null; commonDiseaseIds: string[] | null; idealEnv: Record<string, unknown> | null } }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Leaf className="h-5 w-5 text-emerald-600" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-slate-900 truncate">
            {species.commonName ?? "—"}
          </h3>
          {species.cultivarName && (
            <p className="mt-0.5 text-xs font-medium text-slate-400 truncate">
              Giống: {species.cultivarName}
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatChip
          icon={<Droplets className="h-3 w-3" />}
          label="Tưới nước"
          value={species.waterFrequencyDays != null ? `${species.waterFrequencyDays} ngày` : "—"}
        />
        <StatChip
          icon={<Sun className="h-3 w-3" />}
          label="Ánh sáng"
          value={species.lightRequirements ?? "—"}
        />
        <StatChip
          icon={<CalendarDays className="h-3 w-3" />}
          label="Đến thu hoạch"
          value={species.daysToMaturity != null ? `${species.daysToMaturity} ngày` : "—"}
        />
        <StatChip
          icon={<Wheat className="h-3 w-3" />}
          label="Sản lượng"
          value={species.expectedYieldKg != null ? `${species.expectedYieldKg} kg` : "—"}
        />
      </div>

      {/* Planting season */}
      {species.plantingSeason && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="rounded-md bg-[#245A34]/10 px-2 py-0.5 text-[11px] font-bold text-[#245A34]">
            Mùa: {species.plantingSeason}
          </span>
        </div>
      )}

      {/* Common diseases */}
      {(species.commonDiseaseIds?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Bệnh thường gặp:</span>
          {species.commonDiseaseIds!.map((did) => (
            <span
              key={did}
              className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600"
            >
              {did}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="shrink-0 text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-slate-400 leading-tight">{label}</p>
        <p className="text-xs font-bold text-slate-700 truncate leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function SpeciesPage() {
  const { data: speciesList, isLoading, isError, refetch } = useSpecies();

  return (
    <div className="flex h-full flex-col gap-4 min-h-0 w-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Leaf className="h-5 w-5 text-emerald-600" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800">Giống / Loài cây</h1>
            <p className="text-xs text-slate-400">
              Thông tin các giống cây trồng được hỗ trợ
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#245A34]/10 px-3 py-1 text-xs font-black text-[#245A34]">
          {speciesList?.length ?? 0} giống cây
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="text-sm font-bold text-red-700">Không tải được danh sách giống cây.</p>
          <button
            onClick={() => void refetch()}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : speciesList?.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <Leaf className="h-10 w-10 text-slate-200" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-slate-500">Chưa có giống cây nào được thiết lập.</p>
          <p className="text-xs text-slate-400">
            Liên hệ quản trị viên để thêm giống cây vào hệ thống.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {speciesList!.map((species) => (
              <SpeciesCard key={species.id} species={species} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
