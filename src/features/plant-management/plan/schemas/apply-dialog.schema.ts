import type { ReactNode } from "react";
import type {
  FarmZoneResponse,
  PlantResponse,
  PlanApplyRequest,
  PlanResponse,
} from "../../shared/types";
import type { BulkApplyCustomRequest } from "../../shared/types";

// ── Dialog Props ────────────────────────────────────────────────────────────────

export interface ApplyPlanDialogProps {
  plan: PlanResponse;
  isSubmitting: boolean;
  onClose: () => void;
  /** Receives either a specific-scope payload or an all-farms payload */
  onSubmit: (payload: PlanApplyRequest | import("../../shared/types").ApplyToAllFarmsRequest) => void;
}

export interface BulkApplyPlanDialogProps {
  planIds: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: PlanApplyRequest) => void;
}

export interface BulkApplyCustomDialogProps {
  planIds: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: BulkApplyCustomRequest) => void;
}

// ── Row Config (Bulk Apply Custom) ──────────────────────────────────────────────

export interface PlanRowConfig {
  startDate: string;
  farmPlotId: string;
  farmZoneId: string;
  plantId: string;
  excludedPlantIds: string[];
  excludedFarmZoneIds: string[];
}

export interface PlanRowProps {
  plan: PlanResponse;
  config: PlanRowConfig;
  onUpdate: (cfg: PlanRowConfig) => void;
  plotOptions: { value: string; label: string }[];
}

// ── Scope ───────────────────────────────────────────────────────────────────────

export type ApplyScope = "all" | "plot" | "zone" | "plant";

export interface ScopeSummary {
  type: ApplyScope;
  text: string;
  icon: ReactNode;
  color: string;
  bg: string;
  border: string;
}

// ── Entity Select Modal ─────────────────────────────────────────────────────────

export interface EntitySelectModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
  items: T[];
  isLoading?: boolean;
  title: string;
  icon: ReactNode;
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  getItemCode: (item: T) => string | undefined;
  getItemSubtitle: (item: T) => string | undefined;
  emptyMessage: string;
  allOptionLabel: string;
}

// ── Exclude Section ─────────────────────────────────────────────────────────────

export interface ExcludeSectionProps {
  zones: FarmZoneResponse[];
  plants: PlantResponse[];
  excludedZoneIds: string[];
  excludedPlantIds: string[];
  onToggleZone: (id: string) => void;
  onTogglePlant: (id: string) => void;
  onClearZones: () => void;
  onClearPlants: () => void;
  showZones?: boolean;
  showPlants?: boolean;
  /** Shown below zone names in exclusion checkboxes (e.g. "Vườn: ..." for specific-scope) */
  zoneSubtitle?: string;
}

// ── Scope Selector ─────────────────────────────────────────────────────────────

export interface ScopeSelectorProps {
  farmPlotId: string;
  farmZoneId: string;
  plantId: string;
  plots: import("../../../farm-management/types").FarmPlotResponse[];
  plotsLoading: boolean;
  zones: FarmZoneResponse[];
  zonesLoading: boolean;
  plants: PlantResponse[];
  plantsLoading: boolean;
  onPlotSelect: (id: string) => void;
  onZoneSelect: (id: string) => void;
  onPlantSelect: (id: string) => void;
  plotName?: string;
  zoneName?: string;
  plantLabel?: string;
}
