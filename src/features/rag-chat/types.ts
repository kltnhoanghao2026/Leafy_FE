export interface RagChatRequest {
  question: string;
  threadId?: string | null;
  language?: string;
}

export interface RagStreamState {
  ragState?: string;
  step?: number;
  currentNode?: string;
  updatedFields?: string[];
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
  };
  responseMeta?: {
    documentsCount?: number;
    webResultsCount?: number;
    savedPlanId?: string;
    treatmentPlan?: RagTreatmentPlan | null;
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

export interface RagTreatmentPlan {
  [key: string]: unknown;
}

export interface RagChatResponse {
  answer: string;
  threadId: string;
  documents: RagDocument[];
  treatmentPlan?: RagTreatmentPlan | null;
  plantId?: string;
  webSearchResults: RagWebResult[];
  savedPlanId?: string;
}
