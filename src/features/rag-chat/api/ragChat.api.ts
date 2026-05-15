import apiClient from "../../../lib/apiClient";
import { getOrCreateDeviceId } from "../../../lib/clientDevice";
import { API_ENDPOINTS } from "../../../lib/routes";
import { useAuthStore } from "../../../store/authStore";
import type {
  RagChatRequest,
  RagChatResponse,
  RagConversationDetail,
  RagConversationSummary,
  RagStreamHandlers,
} from "../types";

interface RagChatResultRaw {
  answer?: string;
  thread_id?: string;
  threadId?: string;
  documents?: unknown[];
  plan?: unknown;
  treatment_plan?: unknown;
  treatmentPlan?: unknown;
  plant_id?: string;
  plantId?: string;
  web_search_results?: unknown[];
  webSearchResults?: unknown[];
  saved_plan_id?: string;
  savedPlanId?: string;
}

interface RagChatApiResponse {
  code: number;
  message: string;
  result: RagChatResultRaw | null;
}

interface ApiResponseEnvelope<T> {
  code: number;
  message: string;
  result: T | null;
}

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const parseMaybeJson = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const mapChatResult = (raw: RagChatResultRaw): RagChatResponse => {
  return {
    answer: raw.answer ?? "",
    threadId: raw.thread_id ?? raw.threadId ?? "",
    documents: (raw.documents ?? []) as RagChatResponse["documents"],
    plan: (raw.plan ??
      raw.treatment_plan ??
      raw.treatmentPlan ??
      null) as RagChatResponse["plan"],
    plantId: raw.plant_id ?? raw.plantId,
    webSearchResults: (raw.web_search_results ??
      raw.webSearchResults ??
      []) as RagChatResponse["webSearchResults"],
    savedPlanId: raw.saved_plan_id ?? raw.savedPlanId,
  };
};

const toAbsoluteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = apiClient.defaults.baseURL ?? "";
  if (!baseUrl) {
    return path;
  }

  if (/^https?:\/\//i.test(baseUrl)) {
    return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  }

  if (baseUrl.startsWith("/")) {
    return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  }

  return `${baseUrl}/${path.replace(/^\//, "")}`;
};

const parseEventBlock = (
  block: string,
): { eventName: string; payload: JsonRecord | undefined } | undefined => {
  const lines = block
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return undefined;
  }

  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
      continue;
    }

    if (dataLines.length > 0) {
      dataLines.push(line);
    }
  }

  if (dataLines.length === 0) {
    return undefined;
  }

  const parsed = parseMaybeJson(dataLines.join("\n"));
  return {
    eventName,
    payload: parsed ? asRecord(parsed) : undefined,
  };
};

export async function askRagQuestion(
  request: RagChatRequest,
): Promise<RagChatResponse> {
  const response = await apiClient.post<RagChatApiResponse>(
    API_ENDPOINTS.RAG.CHAT,
    {
      question: request.question,
      thread_id: request.threadId ?? null,
      language: request.language ?? "Vietnamese",
      farm_plot_id: request.farmPlotId ?? null,
      farm_zone_id: request.farmZoneId ?? null,
    },
    {
      timeout: 120000,
    },
  );

  const payload = response.data;

  if (payload.code !== 200 || !payload.result) {
    throw new Error(payload.message || "RAG request failed");
  }

  return mapChatResult(payload.result);
}

export async function streamRagChat(
  request: RagChatRequest,
  handlers: RagStreamHandlers,
  options?: { signal?: AbortSignal },
): Promise<RagChatResponse> {
  const streamUrl = toAbsoluteUrl(API_ENDPOINTS.RAG.CHAT_STREAM);
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Content-Type": "application/json",
    "X-Device-ID": getOrCreateDeviceId(),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(streamUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      question: request.question,
      thread_id: request.threadId ?? null,
      language: request.language ?? "Vietnamese",
      farm_plot_id: request.farmPlotId ?? null,
      farm_zone_id: request.farmZoneId ?? null,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const fallbackMessage = `RAG streaming request failed (${response.status}).`;
    const bodyText = await response.text();
    const parsedMessage = asString(asRecord(parseMaybeJson(bodyText)).message);
    throw new Error(parsedMessage ?? fallbackMessage);
  }

  let finalResult: RagChatResponse | null = null;
  let buffer = "";

  const dispatchEvent = (eventName: string, payload: JsonRecord): void => {
    if (eventName === "state") {
      handlers.onState?.({
        ragState: asString(payload.rag_state ?? payload.ragState),
        step: asNumber(payload.step),
        currentNode: asString(payload.current_node ?? payload.currentNode),
        updatedFields: Array.isArray(payload.updated_fields)
          ? payload.updated_fields.filter(
              (item): item is string => typeof item === "string",
            )
          : undefined,
      });
      return;
    }

    if (eventName === "response_chunk") {
      const chunk = asString(payload.chunk) ?? "";
      handlers.onChunk?.(chunk, {
        ragState: asString(payload.rag_state ?? payload.ragState),
        step: asNumber(payload.step),
        currentNode: asString(payload.current_node ?? payload.currentNode),
        chunkIndex: asNumber(payload.chunk_index ?? payload.chunkIndex),
      });
      return;
    }

    if (eventName === "completed") {
      const resultRecord = asRecord(payload.result);
      finalResult = mapChatResult(resultRecord as RagChatResultRaw);
      const conversationId = asString(payload.conversation_id ?? payload.conversationId);
      handlers.onCompleted?.(finalResult, conversationId);
      return;
    }

    if (eventName === "error") {
      const message =
        asString(payload.message) ?? "RAG streaming request returned an error.";
      throw new Error(message);
    }
  };

  const flushBuffer = (flushAll = false): void => {
    let separatorIndex = buffer.indexOf("\n\n");

    while (separatorIndex >= 0) {
      const block = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);

      if (block.length > 0) {
        const parsed = parseEventBlock(block);
        if (parsed?.payload) {
          dispatchEvent(parsed.eventName, parsed.payload);
        }
      }

      separatorIndex = buffer.indexOf("\n\n");
    }

    if (flushAll) {
      const trailing = buffer.trim();
      if (trailing.length > 0) {
        const parsed = parseEventBlock(trailing);
        if (parsed?.payload) {
          dispatchEvent(parsed.eventName, parsed.payload);
        }
      }
      buffer = "";
    }
  };

  if (response.body && typeof response.body.getReader === "function") {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder
          .decode(value, { stream: true })
          .replace(/\r\n/g, "\n");
        flushBuffer(false);
      }

      buffer += decoder.decode();
      flushBuffer(true);
    } finally {
      reader.releaseLock();
    }
  } else {
    buffer += (await response.text()).replace(/\r\n/g, "\n");
    flushBuffer(true);
  }

  if (!finalResult) {
    throw new Error("RAG streaming completed without a final payload.");
  }

  return finalResult;
}

export async function listRagConversations(): Promise<
  RagConversationSummary[]
> {
  const response = await apiClient.get<
    ApiResponseEnvelope<RagConversationSummary[]>
  >(API_ENDPOINTS.RAG.CONVERSATIONS);
  return response.data.result ?? [];
}

export async function getRagConversation(
  conversationId: string,
): Promise<RagConversationDetail> {
  const response = await apiClient.get<
    ApiResponseEnvelope<RagConversationDetail>
  >(API_ENDPOINTS.RAG.CONVERSATION(conversationId));

  if (!response.data.result) {
    throw new Error("Conversation payload is empty");
  }

  return response.data.result;
}

export async function renameRagConversation(
  conversationId: string,
  title: string,
): Promise<RagConversationDetail> {
  const response = await apiClient.patch<
    ApiResponseEnvelope<RagConversationDetail>
  >(API_ENDPOINTS.RAG.CONVERSATION(conversationId), { title });

  if (!response.data.result) {
    throw new Error("Conversation payload is empty");
  }

  return response.data.result;
}

export async function deleteRagConversation(
  conversationId: string,
): Promise<void> {
  await apiClient.delete<ApiResponseEnvelope<null>>(
    API_ENDPOINTS.RAG.CONVERSATION(conversationId),
  );
}

export async function getRagTreatmentPlan(planId: string) {
  const response = await apiClient.get(
    API_ENDPOINTS.RAG.PLAN(planId),
  );
  if (!response.data || !response.data.result) {
    throw new Error("Invalid response format");
  }
  return response.data.result;
}

export async function getRagPlan(planId: string) {
  const response = await apiClient.get(API_ENDPOINTS.RAG.PLAN(planId));
  return response.data.result;
}
