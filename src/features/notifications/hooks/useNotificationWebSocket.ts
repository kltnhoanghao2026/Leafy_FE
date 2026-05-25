import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketClient } from '../../../providers/wsUtils';
import { notificationKeys } from '../queries/keys';

export const useNotificationWebSocket = () => {
  const { client, connected } = useWebSocketClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connected || !client) return;

    const subscription = client.subscribe('/user/queue/notifications', (payload) => {
      try {
        JSON.parse(payload.body);

        // Invalidate queries so the bell count and history update in real-time
        queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
        queryClient.invalidateQueries({ queryKey: [...notificationKeys.all(), 'history'] });

      } catch (err) {
        console.error('[NotificationWS] Failed to parse notification payload', err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, connected, queryClient]);
};
