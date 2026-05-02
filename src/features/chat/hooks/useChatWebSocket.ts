import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import type { MessageResponse, ConversationResponse, ChatNotification } from '../api/chatApi';
import { normalizeChatNotification, chatApi } from '../api/chatApi';
import { useWebSocketClient } from '../../../providers/WebSocketProvider';

export const useChatWebSocket = (activeConversationId?: string | null) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { client, connected } = useWebSocketClient();

  const activeConversationIdRef = useRef<string | null | undefined>(activeConversationId);
  useEffect(() => { activeConversationIdRef.current = activeConversationId; }, [activeConversationId]);

  useEffect(() => {
    if (!connected || !client || !user) return;

    // ────────── /queue/messages ──────────
    // Backend pushes ChatNotification (has `timestamp`, `isFromMe`, `unreadCount`).
    // We normalize it to MessageResponse shape so the cache stays consistent.
    const messagesSub = client.subscribe('/user/queue/messages', (payload) => {
      try {
        const notification = JSON.parse(payload.body) as ChatNotification;
        const conversationId = notification.conversationId;
        if (!conversationId) return;

        // Normalize ChatNotification → MessageResponse for the live messages cache
        const msg = normalizeChatNotification(notification);

        // ── Update live messages cache (separate from paginated V2 cache) ──
        queryClient.setQueryData(
          ['chat-live-messages', conversationId],
          (oldData: MessageResponse[] | undefined) => {
            if (!oldData) return [msg];
            // Deduplicate by id
            if (oldData.some(m => m.id === msg.id)) return oldData;
            // Append newest at end (display order ASC)
            return [...oldData, msg];
          }
        );

        // ── Update conversations cache ──
        queryClient.setQueryData(
          ['conversations'],
          (oldData: ConversationResponse[] | undefined) => {
            if (!oldData) return oldData;
            const convIndex = oldData.findIndex(c => c.id === conversationId);

            // ─ Fix: senderId is profileId, compare with user.profileId (not user.id) ─
            const isFromMe = notification.isFromMe; // backend already personalises this field

            if (convIndex >= 0) {
              const conv = oldData[convIndex];
              const updatedConv: ConversationResponse = {
                ...conv,
                lastMessage: {
                  id: msg.id,
                  content: msg.content,
                  timestamp: notification.timestamp,
                  isFromMe,
                  type: msg.type,
                  status: msg.status,
                  senderName: msg.senderName,
                  senderId: msg.senderId,
                },
                // Backend sends the personalised unreadCount in the notification
                unreadCount: isFromMe || conversationId === activeConversationIdRef.current
                  ? 0
                  : notification.unreadCount,
              };
              const updated = [
                updatedConv,
                ...oldData.slice(0, convIndex),
                ...oldData.slice(convIndex + 1),
              ].sort((a, b) =>
                new Date(b.lastMessage?.timestamp || 0).getTime() -
                new Date(a.lastMessage?.timestamp || 0).getTime()
              );
              return updated;
            } else {
              // New conversation appeared — refetch
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
              return oldData;
            }
          }
        );

        // ── Tell backend to mark as read if we are actively viewing ──
        if (conversationId === activeConversationIdRef.current && !notification.isFromMe) {
          chatApi.markAsRead(conversationId).catch(() => {});
        }
      } catch (e) {
        console.error('[WS] Failed to parse /queue/messages payload', e);
      }
    });

    // ────────── /queue/conversations ──────────
    // Full ConversationResponse pushed on any group/conversation change.
    const convSub = client.subscribe('/user/queue/conversations', (payload) => {
      try {
        const conv = JSON.parse(payload.body) as ConversationResponse;
        queryClient.setQueryData(
          ['conversations'],
          (oldData: ConversationResponse[] | undefined) => {
            if (!oldData) {
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
              return oldData;
            }
            const idx = oldData.findIndex(c => c.id === conv.id);
            const isViewing = conv.id === activeConversationIdRef.current;
            const updatedConv = {
              ...conv,
              unreadCount: isViewing ? 0 : conv.unreadCount
            };

            let updated: ConversationResponse[];
            if (idx >= 0) {
              updated = [...oldData];
              updated[idx] = updatedConv;
            } else {
              updated = [updatedConv, ...oldData];
            }
            return updated.sort((a, b) =>
              new Date(b.lastMessage?.timestamp || 0).getTime() -
              new Date(a.lastMessage?.timestamp || 0).getTime()
            );
          }
        );
      } catch {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });

    // ────────── /queue/status-updates ──────────
    // Handles MESSAGE_STATUS_UPDATE (revoke/delete) and MESSAGE_EDIT_UPDATE (edit).
    const statusSub = client.subscribe('/user/queue/status-updates', (payload) => {
      try {
        const data = JSON.parse(payload.body) as {
          type: string;
          conversationId: string;
          messageId: string;
          newStatus?: string;
          content?: string;
        };

        if (!data.conversationId || !data.messageId) return;

        if (data.type === 'MESSAGE_STATUS_UPDATE' && data.newStatus) {
          // Patch the specific message's status in the live cache and trigger V2 invalidation
          queryClient.setQueryData(
            ['chat-live-messages', data.conversationId],
            (oldData: MessageResponse[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map(m =>
                m.id === data.messageId
                  ? { ...m, status: data.newStatus as any, content: null, replyTo: null }
                  : m
              );
            }
          );
          // Also invalidate the paginated V2 cache so historic messages update
          queryClient.invalidateQueries({ queryKey: ['chat-messages-v2', data.conversationId] });
          // Also update lastMessage in conversations if it was the last message
          queryClient.setQueryData(
            ['conversations'],
            (oldData: ConversationResponse[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map(conv => {
                if (conv.id !== data.conversationId) return conv;
                if (conv.lastMessage?.id !== data.messageId) return conv;
                return {
                  ...conv,
                  lastMessage: { ...conv.lastMessage, content: null, status: data.newStatus as any },
                };
              });
            }
          );
        } else if (data.type === 'MESSAGE_EDIT_UPDATE' && data.content !== undefined) {
          // Patch the specific message's content in live cache
          queryClient.setQueryData(
            ['chat-live-messages', data.conversationId],
            (oldData: MessageResponse[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map(m =>
                m.id === data.messageId
                  ? { ...m, content: data.content!, isEdited: true }
                  : m
              );
            }
          );
          // Also invalidate the paginated V2 cache so history reflects the edit
          queryClient.invalidateQueries({ queryKey: ['chat-messages-v2', data.conversationId] });
          // Update last message content if applicable
          queryClient.setQueryData(
            ['conversations'],
            (oldData: ConversationResponse[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map(conv => {
                if (conv.id !== data.conversationId) return conv;
                if (conv.lastMessage?.id !== data.messageId) return conv;
                return {
                  ...conv,
                  lastMessage: { ...conv.lastMessage, content: data.content! },
                };
              });
            }
          );
        }
      } catch (e) {
        console.error('[WS] Failed to parse /queue/status-updates payload', e);
      }
    });

    return () => {
      messagesSub.unsubscribe();
      convSub.unsubscribe();
      statusSub.unsubscribe();
    };
  }, [client, connected, user, queryClient]);

  return { connected };
};
