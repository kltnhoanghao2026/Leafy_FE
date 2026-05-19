export type PlantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type TrackingGranularity = "NONE" | "ZONE" | "PLANT";
/** Scope of a PlantEvent or EmbeddedPlanEvent. */
export type TargetType = "FARM" | "FARM_ZONE" | "PLANT";

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
  /** Scope this event targets: FARM (plot-level), FARM_ZONE (zone-level), or PLANT (individual). */
  targetType: TargetType | null;
  note: string | null;
  description: string | null;
  daysFromStart: number | null;
  durationDays: number | null;
  planned: boolean;
  calculatedStartDate: string | null;
  calculatedEndDate: string | null;
  phiDays: number | null;
  ppeRequired: string | null;
  mrlNote: string | null;
  estimatedCost: string | null;

  planApplyId: string | null;
  /** ID of the parent PlantEvent in the hierarchy (FARM → FARM_ZONE → PLANT). */
  parentPlantEventId: string | null;
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
  /** Child events in the hierarchy (FARM → FARM_ZONE → PLANT). Empty array for leaf nodes. */
  children: PlantEventResponse[];
}

export interface PlantEventCreateRequest {
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  eventType: PlantEventType;
  /**
   * Explicit scope override. Omit to let the server derive it automatically
   * from plantId / farmZoneId / farmPlotId.
   */
  targetType?: TargetType;
  note: string;
  description?: string;
  daysFromStart?: number;
  durationDays?: number;
  isPlanned?: boolean;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;

  planApplyId?: string;
  parentPlantEventId?: string;
  tasks?: EventTaskRequest[];
  trackingGranularity?: TrackingGranularity;
  excludedPlantIds?: string[];
  excludedFarmZoneIds?: string[];
}

export interface PlantEventUpdateRequest {
  farmPlotId?: string;
  farmZoneId?: string;
  /** Optional scope correction. Null leaves existing targetType unchanged. */
  targetType?: TargetType;
  eventType?: PlantEventType;
  note?: string;
  description?: string;
  daysFromStart?: number;
  durationDays?: number;
  isPlanned?: boolean;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;

  planApplyId?: string;
  parentPlantEventId?: string;
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

  planApplyId?: string;
}

export interface PlanCreateRequest {
  planName?: string;
  source?: "websearch" | "documents";
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  diseaseName: string;
  confidenceScore?: number;
  severityLevel?: string;
  requiredInputs?: string[];
  safetyWarnings?: string[];
  successIndicators?: string;
  estimatedCost?: string;
  schedule?: PlantEventCreateRequest[];
  /** Whether this plan should be visible to all users. Defaults to false (private). */
  isPublic?: boolean;
  /** Source type of the plan. Defaults to RAG_GEN for AI-generated plans. */
  sourceType?: PlanSourceType;
  /** Knowledge-base documents used to generate this plan. */
  sourceDocuments?: SourceDocument[];
  /** Web search results used to supplement this plan. */
  webSearchResults?: WebSearchResult[];
}

export interface PlanUpdateRequest {
  planName?: string;
  diseaseName?: string;
  confidenceScore?: number;
  severityLevel?: string;
  requiredInputs?: string[];
  safetyWarnings?: string[];
  successIndicators?: string;
  estimatedCost?: string;
}

/** One item in a bulk-apply-custom request — each plan gets its own schedule config */
export interface PlanApplyItemRequest {
  planId: string;
  startDate: string;
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  trackingGranularity?: TrackingGranularity;
  excludedPlantIds?: string[];
  excludedFarmZoneIds?: string[];
}

export interface BulkApplyCustomRequest {
  items: PlanApplyItemRequest[];
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

export interface PlanApplyResponse {
  id: string;
  planId: string;
  appliedById: string | null;
  plantId: string | null;
  farmPlotId: string | null;
  farmZoneId: string | null;
  planName?: string | null;
  diseaseName?: string | null;
  targetName?: string | null;
  startDate: string | null;
  trackingGranularity: TrackingGranularity | null;
  plantEventIds: string[] | null;
  status: TreatmentStatus;
  /** Whether this apply can be cancelled by the user. */
  canCancel?: boolean | null;
  createdAt: string | null;
  lastModifiedAt: string | null;
}

export interface MyAppliesParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  status?: TreatmentStatus | "";
}

export interface PlanListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  plantId?: string;
  search?: string;
  sourceType?: PlanSourceType;
}

export interface PublicPlanListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  search?: string;
  sourceType?: PlanSourceType;
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

export interface EmbeddedPlanEventResponse {
  eventType: PlantEventType;
  /** Intended scope when the plan is applied. */
  targetType: TargetType | null;
  note: string | null;
  description: string | null;
  daysFromStart: number | null;
  durationDays: number | null;
  phiDays: number | null;
  ppeRequired: string | null;
  mrlNote: string | null;
  estimatedCost: string | null;
  tasks: EventTaskResponse[] | null;
}

export type PlanSourceType = 'CONSULTED' | 'RAG_GEN' | 'USER_CREATED';

export interface SourceDocument {
  /** Full text content of the retrieved document page. */
  pageContent: string;
  /** Title of the source document. */
  title?: string;
  /** URL of the source (if available). */
  url?: string;
  /** Qdrant point ID — used to fetch full chunk details via GET /rag/v1/chunks/by-point-ids */
  pointId?: string;
  /** Arbitrary metadata from the knowledge base (score, filename, etc.). */
  metadata?: Record<string, unknown>;
}

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface PlanResponse {
  id: string;
  creatorId: string | null;
  ownerId: string | null;
  planName: string | null;
  source: string | null;
  diseaseName: string | null;
  confidenceScore: number | null;
  severityLevel: string | null;
  requiredInputs: string[] | null;
  safetyWarnings: string[] | null;
  successIndicators: string | null;
  estimatedCost: string | null;
  /** Embedded template events (blueprint schedule). */
  events: EmbeddedPlanEventResponse[] | null;
  /** Number of times this plan has been applied (PlanApply count). */
  applyCount: number | null;
  /** Inline list of applies — populated in detail views. */
  applies?: PlanApplyResponse[] | null;
  /** Whether this plan is publicly visible to all authenticated users. */
  isPublic: boolean;
  /** Whether this plan was created by an expert on behalf of a farmer. */
  isConsulted: boolean;
  sourceType?: PlanSourceType;
  sourceDocuments?: SourceDocument[];
  webSearchResults?: WebSearchResult[];
  ownerInfo: AuthorInfo | null;
  creatorInfo: AuthorInfo | null;
  createdAt: string | null;
  lastModifiedAt: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
  active: boolean;
}

// ── Agriculture Dashboard Stats ──────────────────────────────────────────────

export interface RecentEventSummary {
  id: string;
  eventType: PlantEventType;
  note: string | null;
  targetType: TargetType | null;
  completed: boolean;
  calculatedStartDate: string | null;
  createdAt: string | null;
}

export interface AgricultureStatsResponse {
  totalFarmPlots: number;
  totalFarmZones: number;
  totalAreaM2: number;
  totalPlants: number;
  activePlants: number;
  inactivePlants: number;
  archivedPlants: number;
  todayEvents: number;
  todayCompletedEvents: number;
  monthEvents: number;
  monthCompletedEvents: number;
  monthPendingEvents: number;
  upcomingEvents7d: number;
  overdueEvents: number;
  totalCompletedEvents: number;
  totalPendingEvents: number;
  eventsByType: Record<string, number>;
  monthEventsByType: Record<string, number>;
  totalPlans: number;
  activePlanApplies: number;
  completedPlanApplies: number;
  recentEvents: RecentEventSummary[];
}

