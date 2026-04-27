import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";

// ─────────────────────────── Shared types ───────────────────────────

export interface ConversationMember {
  userId: string;
  fullName: string;
  avatar: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | null;
  lastReadMessageId: string | null;
}

export interface GroupSettings {
  memberCanChangeInfo: boolean;
  memberCanPinMessages: boolean;
  memberCanSendMessages: boolean;
  membershipApprovalEnabled: boolean;
  joinByLinkEnabled: boolean;
}

export interface LastMessage {
  id: string | null;
  senderId: string | null;
  senderName: string | null;
  content: string | null;
  timestamp: string | null;
  type: string | null;
  status: string | null;
  isFromMe: boolean;
}

export interface ConversationResponse {
  id: string;
  recipientId: string | null;
  name: string;
  avatar: string | null;
  isGroup: boolean;
  isDisbanded: boolean;
  unreadCount: number;
  status: "ONLINE" | "OFFLINE" | null;
  lastSeenAt: string | null;
  friendshipStatus: string | null;
  lastMessage: LastMessage | null;
  members: ConversationMember[];
  settings: GroupSettings | null;
  joinLinkToken: string | null;
  pendingJoinRequestCount: number | null;
  isPinned?: boolean;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  senderAvatar: string | null;
  content: string | null;
  timestamp: string;
  createdAt?: string;
  type: string;
  status: string;
  replyTo: {
    messageId: string;
    senderId: string;
    senderName: string | null;
    content: string | null;
    type: string;
  } | null;
}

export interface SearchMemberResponse {
  userId: string;
  fullName: string;
  avatar: string | null;
  phoneNumber: string | null;
  isFriend: boolean;
  isAlreadyMember: boolean;
}

// ─────────────────────────── Request types ───────────────────────────

export interface SendMessageRequest {
  conversationId?: string;
  recipientId?: string;
  content: string;
}

export interface CreateGroupRequest {
  name: string;
  memberIds: string[];
}


// ─────────────────────────── API ───────────────────────────

export const chatApi = {
  // ── Conversations ──

  getConversations: async (page = 0, size = 20): Promise<ConversationResponse[]> => {
    const response = await apiClient.get<ApiEnvelope<{ data: ConversationResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}?page=${page}&size=${size}`
    );
    return response.data.data?.data || [];
  },

  getOrCreateConversation: async (partnerId: string): Promise<ConversationResponse> => {
    const response = await apiClient.get<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/partner/${partnerId}`
    );
    return response.data.data!;
  },

  markAsRead: async (conversationId: string, lastReadMessageId?: string): Promise<void> => {
    await apiClient.put<ApiEnvelope<void>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/read`,
      lastReadMessageId ? { lastReadMessageId } : {}
    );
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}`);
  },

  // ── Messages ──

  getMessages: async (conversationId: string, page = 0, size = 50): Promise<MessageResponse[]> => {
    const response = await apiClient.get<ApiEnvelope<{ data: MessageResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.MESSAGES(conversationId)}?page=${page}&size=${size}`
    );
    return response.data.data?.data || [];
  },

  sendMessage: async (data: SendMessageRequest): Promise<void> => {
    if (!data.conversationId) throw new Error("conversationId is required");
    await apiClient.post<ApiEnvelope<void>>(
      API_ENDPOINTS.MESSAGES.SEND(data.conversationId),
      data
    );
  },

  // ── Group management ──

  createGroup: async (data: CreateGroupRequest): Promise<ConversationResponse> => {
    const response = await apiClient.post<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/groups`,
      data
    );
    return response.data.data!;
  },

  updateGroupName: async (conversationId: string, name: string): Promise<ConversationResponse> => {
    const response = await apiClient.patch<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/name?name=${encodeURIComponent(name)}`
    );
    return response.data.data!;
  },

  updateGroupAvatar: async (conversationId: string, file: File): Promise<ConversationResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.patch<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/avatar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!;
  },

  updateGroupSettings: async (conversationId: string, settings: Partial<GroupSettings>): Promise<ConversationResponse> => {
    const response = await apiClient.patch<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/settings`,
      settings
    );
    return response.data.data!;
  },

  addMembers: async (conversationId: string, memberIds: string[]): Promise<ConversationResponse> => {
    const response = await apiClient.post<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/members`,
      { memberIds }
    );
    return response.data.data!;
  },

  removeMember: async (conversationId: string, targetUserId: string): Promise<ConversationResponse> => {
    const response = await apiClient.delete<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/members/${targetUserId}`
    );
    return response.data.data!;
  },

  leaveGroup: async (conversationId: string): Promise<void> => {
    await apiClient.delete(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/leave`
    );
  },

  disbandGroup: async (conversationId: string): Promise<void> => {
    await apiClient.delete(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/groups`
    );
  },


  pinConversation: async (conversationId: string): Promise<void> => {
    await apiClient.post(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/pin-conversation`
    );
  },

  unpinConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/pin-conversation`
    );
  },

  getPinnedConversations: async (): Promise<ConversationResponse[]> => {
    const response = await apiClient.get<ApiEnvelope<ConversationResponse[]>>(
      `${API_ENDPOINTS.MESSAGES.ROOT}/pinned`
    );
    return response.data.data;
  },

  promoteToAdmin: async (conversationId: string, targetUserId: string): Promise<ConversationResponse> => {
    const response = await apiClient.patch<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/members/${targetUserId}/promote`
    );
    return response.data.data!;
  },

  demoteFromAdmin: async (conversationId: string, targetUserId: string): Promise<ConversationResponse> => {
    const response = await apiClient.patch<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/members/${targetUserId}/demote`
    );
    return response.data.data!;
  },

  generateJoinLink: async (conversationId: string): Promise<string> => {
    const response = await apiClient.post<ApiEnvelope<string>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/join-link`
    );
    return response.data.data!;
  },

  // ── Member search (friends directory) ──

  getFriendsDirectory: async (conversationId?: string): Promise<Record<string, SearchMemberResponse[]>> => {
    const params = conversationId ? `?conversationId=${conversationId}` : "";
    const response = await apiClient.get<ApiEnvelope<Record<string, SearchMemberResponse[]>>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/friends-directory${params}`
    );
    return response.data.data || {};
  },

  searchMembersToAdd: async (
    query: string,
    conversationId?: string,
    page = 0,
    size = 20
  ): Promise<SearchMemberResponse[]> => {
    const params = new URLSearchParams({ query, page: String(page), size: String(size) });
    if (conversationId) params.set("conversationId", conversationId);
    const response = await apiClient.get<ApiEnvelope<{ data: SearchMemberResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/search-members?${params}`
    );
    return response.data.data?.data || [];
  },
};
