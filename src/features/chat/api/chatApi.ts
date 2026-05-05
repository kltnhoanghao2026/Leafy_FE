import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";

// ─────────────────────────── Shared types ───────────────────────────────────

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

export interface JoinGroupPreviewMember {
  name: string;
  avatar: string | null;
}

export interface JoinGroupPreview {
  conversationId: string;
  groupName: string;
  groupAvatar: string | null;
  memberCount: number;
  createdByName: string;
  memberPreviews: JoinGroupPreviewMember[];
  isAlreadyMember: boolean;
  isBlockedFromGroup: boolean;
  membershipApprovalEnabled: boolean;
  hasPendingRequest: boolean;
  joinQuestion: string | null;
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
  userId: string;     // stores profileId (backward compat)
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
  userId: string;    // stores profileId
  profileId: string;
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

/**
 * Shape returned by the HTTP GET /conversations/{id}/messages endpoint.
 * Backend field is `createdAt` (OffsetDateTime), NOT `timestamp`.
 */
export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  senderAvatar: string | null;
  content: string | null;
  clientMessageId?: string | null;
  /** ISO string — primary timestamp field from backend */
  createdAt: string;
  lastModifiedAt?: string | null;
  type: MessageType;
  status: MessageStatus;
  /** true if the message was edited */
  isEdited: boolean;
  isForwarded?: boolean;
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
  reactions?: Record<string, string[]> | null;
}

/**
 * Shape of the real-time WebSocket payload pushed on /queue/messages.
 * Backend: ChatNotification.java — has `timestamp` (not `createdAt`)
 * and personal `isFromMe` / `unreadCount` fields.
 */
export interface ChatNotification {
  id: string;
  conversationId: string;
  senderId: string;       // profileId
  senderName: string | null;
  senderAvatar: string | null;
  content: string | null;
  type: MessageType;
  clientMessageId?: string | null;
  /** ISO string — ChatNotification uses `timestamp` */
  timestamp: string;
  unreadCount: number;
  replyTo: {
    messageId: string;
    senderId: string;
    senderName: string | null;
    content: string | null;
    type: string;
  } | null;
  isForwarded: boolean;
  isEdited: boolean;
  isFromMe: boolean;
  status: MessageStatus;
  metadata?: Record<string, any> | null;
  attachments?: AttachmentInfoResponse[];
  linkPreview?: LinkPreviewResponse | null;
  reactions?: Record<string, string[]> | null;
}

/**
 * Normalize a ChatNotification (WebSocket) into a MessageResponse (cache shape).
 * This lets the message list render WS messages and HTTP messages identically.
 */
export function normalizeChatNotification(n: ChatNotification): MessageResponse {
  return {
    id: n.id,
    conversationId: n.conversationId,
    senderId: n.senderId,
    senderName: n.senderName,
    senderAvatar: n.senderAvatar,
    content: n.content,
    clientMessageId: n.clientMessageId,
    createdAt: n.timestamp,   // ChatNotification.timestamp → MessageResponse.createdAt
    lastModifiedAt: null,
    type: n.type,
    status: n.status,
    isEdited: n.isEdited,
    isForwarded: n.isForwarded,
    replyTo: n.replyTo,
    metadata: n.metadata,
    attachments: n.attachments,
    linkPreview: n.linkPreview,
    reactions: n.reactions,
  };
}

export interface CursorPageResponse<T> {
  data: T[];
  olderCursor: string | null;
  newerCursor: string | null;
  hasMoreOlder: boolean;
  hasMoreNewer: boolean;
  isJumpResult: boolean;
}

export interface SearchMemberResponse {
  userId: string;     // stores profileId
  profileId: string;
  fullName: string;
  avatar: string | null;
  phoneNumber: string | null;
  isFriend: boolean;
  isAlreadyMember: boolean;
}

export interface GroupMemberListItem {
  userId: string;     // stores profileId
  profileId: string;
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

// ─────────────────────────── Request types ──────────────────────────────────

export interface ReplyMetadata {
  messageId: string;
  senderId: string;
  senderName: string | null;
  content: string | null;
  type: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  recipientId?: string;
  content?: string;
  attachments?: AttachmentRequest[];
  replyTo?: ReplyMetadata;
  clientMessageId?: string;
}

export interface CreateGroupRequest {
  name: string;
  avatar?: string;
  memberIds: string[];
}

export interface MyGroupsParams {
  query?: string;
  sort?: 'activity_newest' | 'name_asc' | 'name_desc' | 'member_count' | 'joined_oldest';
  filter?: 'all' | 'owner' | 'admin' | 'member';
  page?: number;
  size?: number;
}

export interface GroupsPageResponse {
  data: ConversationResponse[];
  totalPages: number;
  totalElements: number;
}

export interface UnreadAnchorResponse {
  firstUnreadMessageId: string | null;
  unreadCount: number;
}

export interface JoinGroupPreviewMember {
  name: string;
  avatar: string | null;
}

export interface JoinGroupPreviewResponse {
  conversationId: string;
  groupName: string;
  groupAvatar: string | null;
  memberCount: number;
  createdByName: string | null;
  memberPreviews: JoinGroupPreviewMember[];
  isAlreadyMember: boolean;
  isBlockedFromGroup: boolean;
  membershipApprovalEnabled: boolean;
  hasPendingRequest: boolean;
  joinQuestion: string | null;
}

// ─────────────────────────── API ────────────────────────────────────────────

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

  /** Legacy offset-based pagination — kept for compatibility */
  getMessages: async (conversationId: string, page = 0, size = 20): Promise<MessageResponse[]> => {
    const response = await apiClient.get<ApiEnvelope<{ data: MessageResponse[] }>>(
      `${API_ENDPOINTS.MESSAGES.MESSAGES(conversationId)}?page=${page}&size=${size}`
    );
    return response.data.data?.data || [];
  },

  /**
   * V2 cursor-based pagination.
   * direction: "OLDER" (scroll up) | "NEWER" (scroll down)
   * cursor: ISO timestamp string from previous response's olderCursor/newerCursor
   */
  getMessagesV2: async (
    conversationId: string,
    params: {
      cursor?: string | null;
      limit?: number;
      direction?: 'OLDER' | 'NEWER';
      aroundMessageId?: string | null;
    } = {}
  ): Promise<CursorPageResponse<MessageResponse>> => {
    const { cursor, limit = 20, direction = 'OLDER', aroundMessageId } = params;
    const query = new URLSearchParams();
    if (cursor) query.set('cursor', cursor);
    query.set('limit', String(limit));
    query.set('direction', direction);
    if (aroundMessageId) query.set('aroundMessageId', aroundMessageId);

    const response = await apiClient.get<ApiEnvelope<CursorPageResponse<MessageResponse>>>(
      `${API_ENDPOINTS.MESSAGES.MESSAGES_V2(conversationId)}?${query.toString()}`
    );
    return response.data.data ?? { data: [], olderCursor: null, newerCursor: null, hasMoreOlder: false, hasMoreNewer: false, isJumpResult: false };
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

  // ── Group discovery ──

  /**
   * My group conversations with optional search, sort and filter.
   * Backend: GET /conversations/groups/mine
   */
  getMyGroupConversations: async (params: MyGroupsParams = {}): Promise<GroupsPageResponse> => {
    const { query, sort = 'activity_newest', filter = 'all', page = 0, size = 20 } = params;
    const qs = new URLSearchParams({ sort, filter, page: String(page), size: String(size) });
    if (query) qs.set('query', query);
    const response = await apiClient.get<ApiEnvelope<GroupsPageResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/groups/mine?${qs}`
    );
    return response.data.data ?? { data: [], totalPages: 0, totalElements: 0 };
  },

  // ── Unread anchor ──

  /**
   * Get the first unread message ID and unread count for a conversation.
   * Use this to jump the message list to the unread separator.
   * Backend: GET /conversations/{id}/unread-anchor
   */
  getUnreadAnchor: async (conversationId: string): Promise<UnreadAnchorResponse> => {
    const response = await apiClient.get<ApiEnvelope<UnreadAnchorResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/unread-anchor`
    );
    return response.data.data ?? { firstUnreadMessageId: null, unreadCount: 0 };
  },

  // ── Join by invite link ──

  /**
   * Fetch preview info for a group invite link before joining.
   * Backend: GET /conversations/join/{token}/preview
   */
  getJoinLinkPreview: async (token: string): Promise<JoinGroupPreviewResponse> => {
    const response = await apiClient.get<ApiEnvelope<JoinGroupPreviewResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/join/${token}/preview`
    );
    return response.data.data!;
  },

  /**
   * Join a group conversation via an invite link token.
   * If the group requires approval, a pending join request is created instead.
   * Backend: POST /conversations/join/{token}
   */
  joinByLink: async (token: string, joinAnswer?: string): Promise<ConversationResponse> => {
    const body = joinAnswer ? { joinAnswer } : undefined;
    const response = await apiClient.post<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/join/${token}`,
      body
    );
    return response.data.data!;
  },

  // ── Group invites (non-friends) ──

  /**
   * Send group invites to users who are not yet friends.
   * Backend: POST /conversations/groups/{conversationId}/invites
   */
  sendGroupInvites: async (conversationId: string, userIds: string[]): Promise<void> => {
    await apiClient.post<ApiEnvelope<void>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/groups/${conversationId}/invites`,
      { userIds }
    );
  },

  // ── Admin message moderation ──

  /**
   * Delete a member's message in a group (Admin/Owner only).
   * Admins cannot delete the Owner's messages.
   * Backend: DELETE /conversations/{conversationId}/messages/{messageId}/admin
   */
  deleteGroupMemberMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await apiClient.delete<ApiEnvelope<void>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATION(conversationId)}/messages/${messageId}/admin`
    );
  },

  // ── Group join link ──

  /**
   * Fetch the group preview info before joining via invite link.
   * Backend: GET /conversations/join/{token}/preview
   */
  getJoinPreview: async (token: string): Promise<JoinGroupPreview> => {
    const response = await apiClient.get<ApiEnvelope<JoinGroupPreview>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/join/${token}/preview`
    );
    return response.data.data!;
  },

  /**
   * Join a group via invite link token.
   * If membership approval is enabled, this creates a pending join request.
   * Backend: POST /conversations/join/{token}
   */
  joinByLink: async (token: string, joinAnswer?: string): Promise<ConversationResponse> => {
    const response = await apiClient.post<ApiEnvelope<ConversationResponse>>(
      `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}/join/${token}`,
      joinAnswer ? { joinAnswer } : {}
    );
    return response.data.data!;
  },
};
