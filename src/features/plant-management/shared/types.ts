export type PlantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type TrackingGranularity = "NONE" | "ZONE" | "PLANT";

export interface EventProgressResponse {
  id: string;
  eventId: string;
  targetType: "ZONE" | "PLANT";
  targetId: string;
  farmPlotId?: string | null;
  farmZoneId?: string | null;
  plantId?: string | null;
  completed: boolean;
  completedAt?: string | null;
  note?: string | null;
  createdAt?: string | null;
}

export interface EventProgressUpdateRequest {
  completed: boolean;
  note?: string;
}
export type TreatmentStatus = "PENDING" | "APPLYING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface EventTaskResponse {
  title: string;
  description: string | null;
  order: number | null;
  estimatedCost: string | null;
  completed: boolean;
}

export interface EventTaskRequest {
  title: string;
  description?: string;
  order?: number;
  estimatedCost?: string;
  completed?: boolean;
}

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
  completed: boolean;
  trackingGranularity?: TrackingGranularity | null;
  excludedPlantIds?: string[] | null;
  excludedFarmZoneIds?: string[] | null;
  progressTotal?: number | null;
  progressCompleted?: number | null;
  tasks: EventTaskResponse[] | null;
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
  tasks?: EventTaskRequest[];
  trackingGranularity?: TrackingGranularity;
  excludedPlantIds?: string[];
  excludedFarmZoneIds?: string[];
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
  completed?: boolean;
  /** Replace the entire task list. Omit to leave tasks unchanged. */
  tasks?: EventTaskRequest[];
}

export interface PlantEventsCalendarParams {
  startDate: string;
  endDate: string;
  profileId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  plantId?: string;
  sourcePlanId?: string;
}

export interface PlanCreateRequest {
  ragPlanId?: string;
  question?: string;
  planName?: string;
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
  /** Whether this plan should be visible to all users. Defaults to false (private). */
  isPublic?: boolean;
}

export interface PlanApplyRequest {
  startDate: string;
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  trackingGranularity?: TrackingGranularity;
  excludedPlantIds?: string[];
  excludedFarmZoneIds?: string[];
}

export interface PlanListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  status?: TreatmentStatus | "";
  plantId?: string;
  search?: string;
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

export interface BulkPlantStatusUpdateRequest {
  plantIds: string[];
  status: PlantStatus;
}

export interface BulkPlantDeleteRequest {
  plantIds: string[];
}

export interface BulkPlanStatusUpdateRequest {
  planIds: string[];
  status: TreatmentStatus;
}

export interface BulkPlanDeleteRequest {
  planIds: string[];
}

export interface BulkOperationResult {
  successCount: number;
  failedCount: number;
  failedIds: string[];
}

export interface AuthorInfo {
  id: string | null;
  fullName: string | null;
  avatar: string | null;
  role: string | null;
  specialty: string | null;
  isVerified: boolean | null;
}

export interface PlanResponse {
  id: string;
  creatorId: string | null;
  ownerId: string | null;
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
  applyCount: number | null;
  /** Whether this plan is publicly visible to all authenticated users. */
  isPublic: boolean;
  /** Whether this plan was created by an expert on behalf of a farmer. */
  isConsulted: boolean;
  ownerInfo: AuthorInfo | null;
  creatorInfo: AuthorInfo | null;
  createdAt: string | null;
  lastModifiedAt: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
  active: boolean;
}
