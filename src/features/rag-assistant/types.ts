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

export interface RagTreatmentPlan {
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
  treatment_plan?: RagTreatmentPlan | Record<string, unknown> | null;
  treatmentPlan?: RagTreatmentPlan | Record<string, unknown> | null;
  plan?: RagTreatmentPlan | Record<string, unknown> | null;
  plant_id?: string | null;
  saved_plan_id?: string | null;
}

export interface RagHealthResponse {
  status?: string;
  langsmith_tracing?: boolean;
  langsmith_project?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  treatmentPlan?: RagTreatmentPlan | null;
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
