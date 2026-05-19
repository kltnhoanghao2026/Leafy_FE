export interface RagApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

export interface RagChatRequest {
  question: string;
  language?: string;
  thread_id?: string | null;
}

export interface RagSource {
  title?: string;
  url?: string;
  content?: string;
  page_content?: string;
  metadata?: Record<string, unknown>;
  score?: number;
}

// ── V2 Plan Generation Response ─────────────────────────────────────────────────

export interface PlanSource {
  title: string;
  content: string;
  url?: string;
  score: number;
}

export interface PlanMetadata {
  disease_type: string;
  best_rerank_score: number;
  web_search_used: boolean;
  web_sources_count: number;
  refinement_attempts: number;
  safety_passed: boolean;
}

export interface PlanGenerationResponseV2 {
  plan: Record<string, unknown>;
  documents: PlanSource[];
  web_sources: PlanSource[];
  metadata: PlanMetadata;
  /** ID of the plan persisted in plant-management-service. null if save failed (non-fatal). */
  saved_plan_id: string | null;
}

export interface RagApiResponseV2 {
  code: number;
  message: string;
  result?: PlanGenerationResponseV2;
}

export interface RagPlan {
  id?: string;
  planId?: string;
  userId?: string;
  title?: string;
  name?: string;
  plantId?: string | null;
  farmPlotId?: string | null;
  farmZoneId?: string | null;
  diseaseName?: string | null;
  severityLevel?: string | null;
  urgency?: string | null;
  summary?: string;
  status?: string;
  schedule?: unknown;
  steps?: unknown[];
  plan?: Record<string, unknown>;
  question?: string;
  createdAt?: string;
}

export interface RagChatResult {
  answer?: string;
  content?: string;
  message?: string;
  thread_id?: string;
  threadId?: string;
  intent?: string;
  router?: string;
  mode?: string;
  documents?: RagSource[];
  sources?: RagSource[];
  web_search_results?: RagSource[];
  plan?: RagPlan | Record<string, unknown> | null;
  plant_id?: string | null;
  saved_plan_id?: string | null;
}

export interface RagHealthResponse {
  status?: string;
  langsmith_tracing?: boolean;
  langsmith_project?: string;
}

export interface RagConversationMessage {
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  pipeline?: Record<string, unknown>;
  responseMeta?: {
    sources?: RagSource[];
    plan?: RagPlan;
    saved_plan_id?: string;
  };
}

export interface RagConversation {
  conversationId: string;
  threadId: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastPipelineState?: Record<string, unknown>;
  messages?: RagConversationMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  plan?: RagPlan | null;
  sources?: RagSource[];
}

export interface DiseaseDiagnosisChatContext {
  diseaseClassName: string;
  diseaseLabel: string;
  confidence: number;
  plantId?: string;
  plantName?: string;
  farmPlotId?: string;
  farmPlotName?: string;
  farmZoneId?: string;
  farmZoneName?: string;
  topPredictions?: Array<{
    className: string;
    label: string;
    confidence: number;
  }>;
}
