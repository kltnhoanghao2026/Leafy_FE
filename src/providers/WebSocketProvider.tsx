import React, { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';
import { WebSocketContext } from './wsUtils';

const WS_URL = import.meta.env.VITE_WS_URL || '/ws';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken: token, isInitializing } = useAuthStore();
  const stompClientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  // Sync ref to state when connection state changes
  useEffect(() => {
    setClient(stompClientRef.current);
  }, [connected]);

  useEffect(() => {
    if (isInitializing) return;

    if (!token || !user) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      return;
    }

    if (stompClientRef.current?.active) return;

    console.log(`[WebSocket] Attempting to connect to ${WS_URL}...`);
    const socket = new SockJS(WS_URL);
    const newClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log(`[WebSocket] Connected successfully for user: ${user.id}`);
        setConnected(true);
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

    newClient.activate();
    stompClientRef.current = newClient;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [user, token, isInitializing]);

  return (
    <WebSocketContext.Provider value={{ client, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
