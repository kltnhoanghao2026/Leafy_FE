import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useSpecies } from '../..';
import { Select } from '../../../../components/ui/Select';

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

  const placeholder = speciesQuery.isLoading ? "Đang tải giống cây..." : "Chọn giống/loài cây";

  return (
    <div>
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        Giống/Loài cây
      </span>
      <Select
        className="mt-2"
        value={value}
        onChange={(v) => onChange(String(v))}
        options={species.map((item) => ({
          value: item.id,
          label: [item.commonName, item.cultivarName].filter(Boolean).join(" - "),
        }))}
        placeholder={placeholder}
        disabled={speciesQuery.isLoading}
      />

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
