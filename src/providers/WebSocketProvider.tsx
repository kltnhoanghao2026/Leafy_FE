import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || '/ws';

interface WebSocketContextValue {
  client: Client | null;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({ client: null, connected: false });

export const useWebSocketClient = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken: token, isInitializing } = useAuthStore();
  const stompClientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isInitializing) return;

    if (!token || !user) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setConnected(false);
      }
      return;
    }

    if (stompClientRef.current?.active) return;

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

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [user, token, isInitializing]);

  return (
    <WebSocketContext.Provider value={{ client: stompClientRef.current, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
