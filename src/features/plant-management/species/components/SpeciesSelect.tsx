import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useSpecies } from '../..';

interface SpeciesSelectProps {
  value: string;
  onChange: (speciesId: string) => void;
  required?: boolean;
}

export function SpeciesSelect({
  value,
  onChange,
  required = false,
}: SpeciesSelectProps) {
  const speciesQuery = useSpecies();
  const species = useMemo(() => speciesQuery.data ?? [], [speciesQuery.data]);

  return (
    <div>
      <label
        htmlFor="plant-species"
        className="text-xs font-black uppercase tracking-wide text-slate-500"
      >
        Giống/Loài cây
      </label>
      <select
        id="plant-species"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
      >
        <option value="">
          {speciesQuery.isLoading ? "Đang tải giống cây..." : "Chọn giống/loài cây"}
        </option>
        {species.map((item) => (
          <option key={item.id} value={item.id}>
            {[item.commonName, item.cultivarName].filter(Boolean).join(" - ")}
          </option>
        ))}
      </select>

      {speciesQuery.isError ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          <span>Không tải được danh sách giống cây.</span>
          <button
            type="button"
            onClick={() => void speciesQuery.refetch()}
            className="inline-flex items-center rounded-lg bg-amber-600 px-2 py-1 text-white"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Tải lại
          </button>
        </div>
      ) : null}
    </div>
  );
}
