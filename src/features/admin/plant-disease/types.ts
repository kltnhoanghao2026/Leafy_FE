export type { SpringPage } from "../types";
// ============================================================================
// Enums
// ============================================================================

export type PlantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type EventType =
  | "IRRIGATION"
  | "NUTRITION"
  | "WEED_CONTROL"
  | "PRUNING"
  | "SCOUTING"
  | "DISEASE_DETECTED"
  | "TREATMENT_APPLICATION"
  | "QUARANTINE"
  | "HEALTH_RECOVERY"
  | "PHENOLOGY"
  | "REPOT"
  | "HARVEST";

export type TreatmentStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

// ============================================================================
// DTOs (match backend response shapes)
// ============================================================================

export interface PlantDto {
  id: string;
  plantNumber: string;
  plantStatus: PlantStatus;
  nickName: string | null;
  tagCode: string | null;
  batchNumber: string | null;
  sourceType: string | null;
  motherPlantId: string | null;
  plantingDate: string | null;
  germinationDate: string | null;
  actualHarvestDate: string | null;
  totalYieldKg: number | null;
  speciesId: string;
  farmPlotId: string;
}

export interface SpeciesDto {
  id: string;
  commonName: string;
  cultivarName: string | null;
  waterFrequencyDays: number | null;
  lightRequirements: string | null;
  daysToMaturity: number | null;
  plantingWindow: string | null;
  plantingSeason: string | null;
  idealEnv: Record<string, unknown> | null;
  spacing: number | null;
  expectedYieldKg: number | null;
  commonDiseaseIds: string[] | null;
}

export interface PlantEventDto {
  id: string;
  plantId: string | null;
  farmPlotId: string | null;
  farmZoneId: string | null;
  eventType: EventType;
  note: string;
  description: string | null;
  daysFromNow: number | null;
  durationDays: number | null;
  planned: boolean;
  calculatedStartDate: string | null;
  calculatedEndDate: string | null;
  phiDays: number | null;
  ppeRequired: string | null;
  mrlNote: string | null;
  estimatedCost: string | null;
  sourcePlanId: string | null;
  createdAt: string;
  lastModifiedAt: string | null;
  active: boolean;
}

export interface PlanDto {
  id: string;
  userId: string;
  ragPlanId: string | null;
  question: string | null;
  source: string | null;
  plantId: string | null;
  farmPlotId: string | null;
  farmZoneId: string | null;
  diseaseName: string;
  confidenceScore: number | null;
  severityLevel: string | null;
  urgency: string | null;
  requiredInputs: string[] | null;
  safetyWarnings: string[] | null;
  successIndicators: string | null;
  estimatedCost: string | null;
  plantEventIds: string[] | null;
  status: TreatmentStatus;
  createdAt: string;
  lastModifiedAt: string | null;
  active: boolean;
}

// ============================================================================
// Query param types
// ============================================================================

export interface PlantListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  status?: PlantStatus;
}

export interface SpeciesListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

export interface PlantEventListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  eventType?: EventType;
  /** true = planned/scheduled, false = immediate/detected, undefined = all */
  planned?: boolean;
  /** Filter by farm plot ID */
  farmPlotId?: string;
  /** Filter by farm zone ID */
  farmZoneId?: string;
}

export interface PlanListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  status?: TreatmentStatus;
}

// ============================================================================
// Payloads (create / update)
// ============================================================================

export interface SpeciesCreatePayload {
  commonName: string;
  cultivarName?: string;
  waterFrequencyDays?: number;
  lightRequirements?: string;
  daysToMaturity?: number;
  plantingWindow?: string;
  plantingSeason?: string;
  idealEnv?: Record<string, unknown>;
  spacing?: number;
  expectedYieldKg?: number;
  commonDiseaseIds?: string[];
}

export type SpeciesUpdatePayload = Partial<SpeciesCreatePayload>;
