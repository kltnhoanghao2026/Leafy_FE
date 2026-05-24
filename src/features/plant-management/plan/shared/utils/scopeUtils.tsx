import { useMemo } from "react";
import { Leaf, LayoutGrid, TreePine, Globe } from "lucide-react";
import type { ScopeSummary } from "../../../schemas/apply-dialog.schema";

export interface UseScopeSummaryOptions {
  plotName?: string;
  zoneName?: string;
  plantLabel?: string | null;
}

export function useScopeSummary(
  plantId: string,
  farmZoneId: string,
  farmPlotId: string,
  options: UseScopeSummaryOptions,
): ScopeSummary | null {
  const { plotName, zoneName, plantLabel } = options;

  return useMemo(() => {
    if (plantId) {
      return {
        type: "plant",
        text: plantLabel ?? "Cây đã chọn",
        icon: <Leaf className="h-3.5 w-3.5" />,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      };
    }

    if (farmZoneId) {
      return {
        type: "zone",
        text: zoneName ?? "Khu vực đã chọn",
        icon: <LayoutGrid className="h-3.5 w-3.5" />,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };
    }

    if (farmPlotId) {
      return {
        type: "plot",
        text: plotName ?? "Vườn đã chọn",
        icon: <TreePine className="h-3.5 w-3.5" />,
        color: "text-violet-700",
        bg: "bg-violet-50",
        border: "border-violet-200",
      };
    }

    // No farm selected - apply to all farms
    return {
      type: "all",
      text: "Tất cả vườn",
      icon: <Globe className="h-3.5 w-3.5" />,
      color: "text-slate-700",
      bg: "bg-slate-50",
      border: "border-slate-200",
    };
  }, [plantId, farmZoneId, farmPlotId, plotName, zoneName, plantLabel]);
}

// ── Excluded State Factory ────────────────────────────────────────────────────────

export interface ExcludedState {
  excludedPlantIds: string[];
  excludedFarmZoneIds: string[];
}

export function getInitialExcludedState(): ExcludedState {
  return {
    excludedPlantIds: [],
    excludedFarmZoneIds: [],
  };
}

export function resetExcludedOnPlotChange(): ExcludedState {
  return {
    excludedPlantIds: [],
    excludedFarmZoneIds: [],
  };
}

export function resetExcludedOnZoneChange(): ExcludedState {
  return {
    excludedPlantIds: [],
  };
}
