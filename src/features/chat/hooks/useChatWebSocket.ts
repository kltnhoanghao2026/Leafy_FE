import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import type { MessageResponse, ConversationResponse } from '../api/chatApi';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export const useChatWebSocket = (activeConversationId?: string | null) => {
  const { user, accessToken: token, isInitializing } = useAuthStore();
  const queryClient = useQueryClient();
  const stompClientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  // Keep a ref so the STOMP subscription closure always reads the latest
  // active conversation without needing to reconnect.
  const activeConversationIdRef = useRef<string | null | undefined>(activeConversationId);
  useEffect(() => { activeConversationIdRef.current = activeConversationId; }, [activeConversationId]);

  const connect = useCallback(() => {
    if (stompClientRef.current?.active) return;
    if (!token || !user) return;

    console.log(`[WebSocket] Attempting to connect to ${WS_URL}...`);
    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log(`[WebSocket] Connected successfully for user: ${user.id}`);
        setConnected(true);

        // ────────── /queue/messages ──────────
        client.subscribe('/user/queue/messages', (payload) => {
          const msg = JSON.parse(payload.body) as MessageResponse;
          const conversationId = msg.conversationId;
          if (!conversationId) return;

          // Update messages cache
          queryClient.setQueryData(
            ['chat-messages', conversationId],
            (oldData: MessageResponse[] | undefined) => {
              if (!oldData) return [msg]; // seed cache for brand-new conversations
              if (oldData.some(m => m.id === msg.id)) return oldData;
              return [msg, ...oldData]; // prepend since newer messages are usually at the beginning of the array in Leafy
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
                    ? 0  // user is viewing this conversation – keep unread at 0
                    : (conv.unreadCount || 0) + 1,
                };
                return [updatedConv, ...oldData.slice(0, convIndex), ...oldData.slice(convIndex + 1)].sort((a, b) => 
                  new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()
                );
              } else {
                // Brand-new conversation not yet in cache –
                // The /queue/conversations event will upsert it; we just trigger a refetch as fallback
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                return oldData;
              }
            }
          );
        });

        // ────────── /queue/conversations ──────────
        client.subscribe('/user/queue/conversations', (payload) => {
          try {
            const conv = JSON.parse(payload.body) as ConversationResponse;
            queryClient.setQueryData(
              ['conversations'],
              (oldData: ConversationResponse[] | undefined) => {
                if (!oldData) {
                  // Cache not initialised yet – schedule a refetch and bail
                  queryClient.invalidateQueries({ queryKey: ['conversations'] });
                  return oldData;
                }
                const idx = oldData.findIndex(c => c.id === conv.id);
                let updated: ConversationResponse[];
                if (idx >= 0) {
                  // Update existing conversation in-place
                  updated = [...oldData];
                  updated[idx] = conv;
                } else {
                  // Brand-new conversation – prepend to list
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
        client.subscribe('/user/queue/status-updates', (payload) => {
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
      },
      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error', frame.headers['message'], frame.body);
      },
      onWebSocketError: (event) => {
        console.error('[WebSocket] Native WebSocket error', event);
      },
      onDisconnect: () => {
        console.log('[WebSocket] Disconnected');
        setConnected(false);
      }
    });

    client.activate();
    stompClientRef.current = client;
  }, [user, token, queryClient]);

  const disconnect = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    if (user && token) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [user, token, isInitializing, connect, disconnect]);

  return { connected };
};
