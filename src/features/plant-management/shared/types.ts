export type PlantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type TreatmentStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type PlantEventType =
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

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PlantResponse {
  id: string;
  plantNumber: string | null;
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
  farmZoneId: string | null;
}

export interface PlantCreateRequest {
  plantStatus: PlantStatus;
  nickName?: string;
  tagCode?: string;
  batchNumber?: string;
  sourceType?: string;
  motherPlantId?: string;
  plantingDate?: string;
  germinationDate?: string;
  actualHarvestDate?: string;
  totalYieldKg?: number;
  speciesId: string;
  farmPlotId: string;
  farmZoneId?: string;
}

export interface PlantUpdateRequest {
  plantNumber?: string;
  plantStatus?: PlantStatus;
  nickName?: string;
  tagCode?: string;
  batchNumber?: string;
  sourceType?: string;
  motherPlantId?: string;
  plantingDate?: string;
  germinationDate?: string;
  actualHarvestDate?: string;
  totalYieldKg?: number;
  speciesId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
}

export interface SpeciesResponse {
  id: string;
  commonName: string | null;
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

export interface PlantEventResponse {
  id: string;
  plantId: string;
  farmPlotId: string | null;
  farmZoneId: string | null;
  eventType: PlantEventType;
  note: string | null;
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
  createdAt: string | null;
  lastModifiedAt: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
  active: boolean;
}

export interface PlantEventCreateRequest {
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  eventType: PlantEventType;
  note: string;
  description?: string;
  daysFromNow?: number;
  durationDays?: number;
  isPlanned?: boolean;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;
  sourcePlanId?: string;
}

export interface PlantEventUpdateRequest {
  farmPlotId?: string;
  farmZoneId?: string;
  eventType?: PlantEventType;
  note?: string;
  description?: string;
  daysFromNow?: number;
  durationDays?: number;
  isPlanned?: boolean;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;
  sourcePlanId?: string;
}

export interface PlantEventsCalendarParams {
  startDate: string;
  endDate: string;
  farmPlotId?: string;
  farmZoneId?: string;
  plantId?: string;
}

export interface PlanCreateRequest {
  ragPlanId?: string;
  question?: string;
  source?: "websearch" | "documents";
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  diseaseName: string;
  confidenceScore?: number;
  severityLevel?: string;
  urgency?: string;
  requiredInputs?: string[];
  safetyWarnings?: string[];
  successIndicators?: string;
  estimatedCost?: string;
  schedule?: PlantEventCreateRequest[];
}

export interface PlanListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  status?: TreatmentStatus | "";
}

export interface PlantListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  search?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  speciesId?: string;
  status?: PlantStatus | "";
}

export interface PlanResponse {
  id: string;
  userId: string | null;
  ragPlanId: string | null;
  question: string | null;
  planName: string | null;
  source: string | null;
  plantId: string | null;
  farmPlotId: string | null;
  farmZoneId: string | null;
  diseaseName: string | null;
  confidenceScore: number | null;
  severityLevel: string | null;
  urgency: string | null;
  requiredInputs: string[] | null;
  safetyWarnings: string[] | null;
  successIndicators: string | null;
  estimatedCost: string | null;
  plantEventIds: string[] | null;
  status: TreatmentStatus;
  createdAt: string | null;
  lastModifiedAt: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
  active: boolean;
}
