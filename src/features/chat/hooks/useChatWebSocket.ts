import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import type { MessageResponse, ConversationResponse } from '../api/chatApi';
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
    const messagesSub = client.subscribe('/user/queue/messages', (payload) => {
      const msg = JSON.parse(payload.body) as MessageResponse;
      const conversationId = msg.conversationId;
      if (!conversationId) return;

      // Update messages cache
      queryClient.setQueryData(
        ['chat-messages', conversationId],
        (oldData: MessageResponse[] | undefined) => {
          if (!oldData) return [msg];
          if (oldData.some(m => m.id === msg.id)) return oldData;
          return [msg, ...oldData];
        }
      );

      // Update conversations cache
      queryClient.setQueryData(
        ['conversations'],
        (oldData: ConversationResponse[] | undefined) => {
          if (!oldData) return oldData;
          const convIndex = oldData.findIndex(c => c.id === conversationId);
          if (convIndex >= 0) {
            const conv = oldData[convIndex];
            const isFromMe = msg.senderId === user.id;
            const updatedConv: ConversationResponse = {
              ...conv,
              lastMessage: {
                id: msg.id,
                content: msg.content,
                timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
                isFromMe,
                type: msg.type,
                status: msg.status,
                senderName: msg.senderName,
                senderId: msg.senderId,
              },
              unreadCount: isFromMe || conversationId === activeConversationIdRef.current
                ? 0
                : (conv.unreadCount || 0) + 1,
            };
            return [updatedConv, ...oldData.slice(0, convIndex), ...oldData.slice(convIndex + 1)].sort((a, b) => 
              new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()
            );
          } else {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            return oldData;
          }
        }
      );
    });

    // ────────── /queue/conversations ──────────
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
            let updated: ConversationResponse[];
            if (idx >= 0) {
              updated = [...oldData];
              updated[idx] = conv;
            } else {
              updated = [conv, ...oldData];
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
    const statusSub = client.subscribe('/user/queue/status-updates', (payload) => {
      try {
        const data = JSON.parse(payload.body);
        if (data.conversationId) {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', data.conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      } catch (e) {
        console.error('Failed to parse status update', e);
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

