import apiClient from '../../../lib/apiClient';
import type { ApiEnvelope } from '../../../shared/types/api';
import type { UserNotificationResponse, NotificationStateResponse } from '../types';

export const notificationApi = {
  getHistory: async (params?: { cursor?: string; limit?: number }) => {
    const { data } = await apiClient.get<ApiEnvelope<UserNotificationResponse[]>>('/notifications/history', { params });
    return data;
  },

  getUnreadHistory: async (params?: { cursor?: string; limit?: number }) => {
    const { data } = await apiClient.get<ApiEnvelope<UserNotificationResponse[]>>('/notifications/history/unread', { params });
    return data;
  },

  getState: async () => {
    const { data } = await apiClient.get<ApiEnvelope<NotificationStateResponse>>('/notifications/state');
    return data;
  },

  markChecked: async () => {
    const { data } = await apiClient.post<ApiEnvelope<void>>('/notifications/checked');
    return data;
  },

  markAsRead: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<void>>(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await apiClient.post<ApiEnvelope<void>>('/notifications/read-all');
    return data;
  }
};
