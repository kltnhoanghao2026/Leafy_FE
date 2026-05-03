import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Shared types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AttachmentRequest {
  key: string;
  url?: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  size: number;
}

export interface LinkPreviewMemberSnapshot {
  name: string;
  avatar: string | null;
}

export interface LinkPreviewResponse {
  url: string;
  token: string;
  groupName: string;
  groupAvatar: string | null;
  memberCount: number;
  memberPreviews: LinkPreviewMemberSnapshot[];
}

export interface AttachmentInfoResponse {
  key: string;
  url: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  size: number;
}

export interface ConversationMember {
  userId: string;     // now stores profileId (for backward compat)
  profileId: string;  // explicit profileId
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
  joinQuestion?: string;
}

export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

export interface JoinRequestResponse {
  id: string;
  conversationId: string;
  userId: string;    // now stores profileId
  profileId: string; // explicit profileId
  fullName: string;
  avatar: string | null;
  status: JoinRequestStatus;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  joinAnswer: string | null;
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
  friendshipStatus: string | null;
  lastMessage: LastMessage | null;
  members: ConversationMember[];
  settings: GroupSettings | null;
  joinLinkToken: string | null;
  pendingJoinRequestCount: number | null;
  isPinned?: boolean;
}

export type MessageType = 'CHAT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'LINK' | 'SYSTEM' | 'CALL';
export type MessageStatus = 'NORMAL' | 'REVOKED' | 'DELETED_BY_ADMIN';

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  senderAvatar: string | null;
  content: string | null;
  timestamp: string;
  createdAt?: string;
  type: MessageType;
  status: MessageStatus;
  isEdited?: boolean;
  edited?: boolean;
  replyTo: {
    messageId: string;
    senderId: string;
    senderName: string | null;
    content: string | null;
    type: string;
  } | null;
  metadata?: Record<string, any> | null;
  attachments?: AttachmentInfoResponse[];
  linkPreview?: LinkPreviewResponse | null;
}

export interface SearchMemberResponse {
  userId: string;     // now stores profileId
  profileId: string;  // explicit profileId
  fullName: string;
  avatar: string | null;
  phoneNumber: string | null;
  isFriend: boolean;
  isAlreadyMember: boolean;
}

export interface GroupMemberListItem {
  userId: string;     // now stores profileId
  profileId: string;  // explicit profileId
  fullName: string;
  avatar: string | null;
  phoneNumber: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string | null;
  isFriend: boolean;
  isCurrentUser: boolean;
  joinMethod: string | null;
  addedBy: string | null;
  addedByName: string | null;
}

export interface AdminMember {
  userId: string;
  fullName: string;
  avatar: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface PinnedMessageInfo {
  messageId: string;
  pinnedBy: string;
  pinnedByName: string | null;
  contentSnapshot: string | null;
  messageType: string;
  pinnedAt: string | null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Request types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface SendMessageRequest {
  conversationId?: string;
  recipientId?: string;
  content?: string;
  attachments?: AttachmentRequest[];
}

export interface CreateGroupRequest {
  name: string;
  avatar?: string;
  memberIds: string[];
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const chatApi = {
  // â”€â”€ Conversations â”€â”€

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

  // â”€â”€ Messages â”€â”€

  getMessages: async (conversationId: string, page = 0, size = 50): Promise<MessageResponse[]> => {
    const response = await apiClient.get<ApiEnvelope<{ data: MessageResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.MESSAGES(conversationId)}?page=${page}&size=${size}`
    );
    return response.data.data?.data || [];
  },

  getMediaMessages: async (conversationId: string, types: string[], page = 0, size = 50): Promise<MessageResponse[]> => {
    const params = new URLSearchParams();
    types.forEach(t => params.append('types', t));
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const response = await apiClient.get<ApiEnvelope<{ data: MessageResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.MEDIA(conversationId)}?${params.toString()}`
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

  editMessage: async (messageId: string, content: string): Promise<void> => {
    await apiClient.put<ApiEnvelope<void>>(
      API_ENDPOINTS.MESSAGES.MESSAGE_EDIT(messageId),
      { content }
    );
  },

  revokeMessage: async (messageId: string): Promise<void> => {
    await apiClient.patch<ApiEnvelope<void>>(
      API_ENDPOINTS.MESSAGES.MESSAGE_REVOKE(messageId)
    );
  },

  deleteMessageForMe: async (messageId: string): Promise<void> => {
    await apiClient.delete<ApiEnvelope<void>>(
      API_ENDPOINTS.MESSAGES.MESSAGE_DELETE_ME(messageId)
    );
  },

  // â”€â”€ Group management â”€â”€

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

  updateGroupAvatar: async (conversationId: string, avatarUrl: string): Promise<ConversationResponse> => {
    const response = await apiClient.patch<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/avatar?avatarUrl=${encodeURIComponent(avatarUrl)}`
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

  removeMember: async (conversationId: string, targetUserId: string, blockFromGroup = false): Promise<ConversationResponse> => {
    const response = await apiClient.delete<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/members/${targetUserId}?blockFromGroup=${blockFromGroup}`
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
    return response.data.data || [];
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

  refreshJoinLink: async (conversationId: string): Promise<string> => {
    const response = await apiClient.post<ApiEnvelope<string>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/join-link/refresh`
    );
    return response.data.data!;
  },

  transferOwnership: async (conversationId: string, targetUserId: string): Promise<ConversationResponse> => {
    const response = await apiClient.patch<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/transfer-owner/${targetUserId}`
    );
    return response.data.data!;
  },

  blockMemberFromGroup: async (conversationId: string, targetUserId: string): Promise<ConversationResponse> => {
    const response = await apiClient.post<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/block/${targetUserId}`
    );
    return response.data.data!;
  },

  unblockMemberFromGroup: async (conversationId: string, targetUserId: string): Promise<ConversationResponse> => {
    const response = await apiClient.delete<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/block/${targetUserId}`
    );
    return response.data.data!;
  },

  getBlockedMembers: async (conversationId: string, page = 0, size = 20): Promise<SearchMemberResponse[]> => {
    const response = await apiClient.get<ApiEnvelope<{ data: SearchMemberResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/blocked-members?page=${page}&size=${size}`
    );
    return response.data.data?.data || [];
  },

  updateJoinQuestion: async (conversationId: string, question: string): Promise<void> => {
    await apiClient.put<ApiEnvelope<void>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/join-question`,
      { question }
    );
  },

  getJoinRequests: async (conversationId: string, page = 0, size = 20): Promise<JoinRequestResponse[]> => {
    const response = await apiClient.get<ApiEnvelope<{ data: JoinRequestResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/join-requests?page=${page}&size=${size}`
    );
    return response.data.data?.data || [];
  },

  approveJoinRequest: async (conversationId: string, requestId: string): Promise<ConversationResponse> => {
    const response = await apiClient.post<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/join-requests/${requestId}/approve`
    );
    return response.data.data!;
  },

  rejectJoinRequest: async (conversationId: string, requestId: string): Promise<void> => {
    await apiClient.post<ApiEnvelope<void>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/join-requests/${requestId}/reject`
    );
  },

  // â”€â”€ Member search (friends directory) â”€â”€

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

  // ── Group member views ──

  getGroupMembers: async (
    conversationId: string,
    query?: string,
    page = 0,
    size = 20
  ): Promise<GroupMemberListItem[]> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (query) params.set('query', query);
    const response = await apiClient.get<ApiEnvelope<{ data: GroupMemberListItem[] }>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/group-members?${params}`
    );
    return response.data.data?.data || [];
  },

  getGroupAdmins: async (
    conversationId: string,
    page = 0,
    size = 20
  ): Promise<AdminMember[]> => {
    const response = await apiClient.get<ApiEnvelope<{ data: AdminMember[] }>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/group-admins?page=${page}&size=${size}`
    );
    return response.data.data?.data || [];
  },

  getAdminCandidates: async (
    conversationId: string,
    query?: string,
    page = 0,
    size = 20
  ): Promise<AdminMember[]> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (query) params.set('query', query);
    const response = await apiClient.get<ApiEnvelope<{ data: AdminMember[] }>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/admin-candidates?${params}`
    );
    return response.data.data?.data || [];
  },

  // ── Pins ──

  getPins: async (conversationId: string): Promise<PinnedMessageInfo[]> => {
    const response = await apiClient.get<ApiEnvelope<PinnedMessageInfo[]>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/pins`
    );
    return response.data.data || [];
  },

  pinMessage: async (conversationId: string, messageId: string): Promise<PinnedMessageInfo> => {
    const response = await apiClient.post<ApiEnvelope<PinnedMessageInfo>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/messages/${messageId}/pin`
    );
    return response.data.data!;
  },

  unpinMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await apiClient.delete(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/messages/${messageId}/pin`
    );
  },

  // ── Join request helpers ──

  cancelMyJoinRequest: async (conversationId: string): Promise<void> => {
    await apiClient.delete(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/join-requests/me`
    );
  },

  // ── Block candidates ──

  getBlockCandidates: async (
    conversationId: string,
    query?: string,
    page = 0,
    size = 20
  ): Promise<SearchMemberResponse[]> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (query) params.set('query', query);
    const response = await apiClient.get<ApiEnvelope<{ data: SearchMemberResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/block-candidates?${params}`
    );
    return response.data.data?.data || [];
  },

  // ── Media / Files (paginated) ──

  getMediaPage: async (
    conversationId: string,
    types: string[],
    page = 0,
    size = 12
  ): Promise<{ data: MessageResponse[]; totalPages: number; totalElements: number }> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    types.forEach(t => params.append('types', t));
    const response = await apiClient.get<ApiEnvelope<{ data: MessageResponse[]; totalPages: number; totalElements: number }>>(
      `${API_ENDPOINTS.MESSAGES.MEDIA(conversationId)}?${params}`
    );
    return response.data.data ?? { data: [], totalPages: 0, totalElements: 0 };
  },

  getFilesPage: async (
    conversationId: string,
    page = 0,
    size = 10
  ): Promise<{ data: MessageResponse[]; totalPages: number; totalElements: number }> => {
    const response = await apiClient.get<ApiEnvelope<{ data: MessageResponse[]; totalPages: number; totalElements: number }>>(
      `${API_ENDPOINTS.MESSAGES.FILES(conversationId)}?page=${page}&size=${size}`
    );
    return response.data.data ?? { data: [], totalPages: 0, totalElements: 0 };
  },
};

