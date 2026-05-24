import { createContext, useContext } from 'react';
import type { Client } from '@stomp/stompjs';

export interface WebSocketContextValue {
  client: Client | null;
  connected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextValue>({
  client: null,
  connected: false,
});

export const useWebSocketClient = () => useContext(WebSocketContext);
