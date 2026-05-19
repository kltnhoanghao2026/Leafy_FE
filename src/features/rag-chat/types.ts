export type RagRoute = "auto" | "fast" | "deep" | "planner";

export interface RagChatRequest {
  question: string;
  threadId?: string | null;
  language?: string;
  farmPlotId?: string | null;
  farmZoneId?: string | null;
  route?: RagRoute;
}

export interface RagStreamState {
  ragState?: string;
  step?: number;
  currentNode?: string;
  updatedFields?: string[];
  pathType?: string;
}

export interface RagStreamChunk {
  ragState?: string;
  step?: number;
  currentNode?: string;
  chunkIndex?: number;
}

export interface RagStreamHandlers {
  onState?: (state: RagStreamState) => void;
  onChunk?: (chunk: string, payload: RagStreamChunk) => void;
  onCompleted?: (result: RagChatResponse, conversationId?: string) => void;
}

export interface RagConversationMessage {
  messageId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  pipeline?: {
    ragState?: string;
    currentNode?: string;
    step?: number;
    pathType?: string;
  };
  responseMeta?: {
    documentsCount?: number;
    webResultsCount?: number;
    savedPlanId?: string;
    plan?: RagPlan | null;
    documents?: RagDocument[];
    webResults?: RagWebResult[];
  };
}

export interface RagConversationSummary {
  conversationId: string;
  threadId: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastPipelineState?: {
    ragState?: string;
    currentNode?: string;
    step?: number;
    pathType?: string;
  };
}

export interface RagConversationDetail extends RagConversationSummary {
  messages: RagConversationMessage[];
}

export interface RagDocument {
  [key: string]: unknown;
}

export interface RagWebResult {
  [key: string]: unknown;
}

export interface RagPlan {
  [key: string]: unknown;
}

export interface RagChatResponse {
  answer: string;
  threadId: string;
  documents: RagDocument[];
  plan?: RagPlan | null;
  plantId?: string;
  webSearchResults: RagWebResult[];
  savedPlanId?: string;
}
