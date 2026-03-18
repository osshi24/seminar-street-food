import apiClient from './client';
import type { Notification } from '../../types/notification';

interface GetNotificationsParams {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

interface NotificationsListResponse {
  data: {
    data: Notification[];
    total: number;
  };
}

export async function getNotifications(
  role: 'store-owner' | 'admin',
  params?: GetNotificationsParams,
): Promise<NotificationsListResponse> {
  const response = await apiClient.get<NotificationsListResponse>(
    `/notifications/${role}`,
    { params },
  );
  return response.data;
}

export async function markNotificationAsRead(
  role: 'store-owner' | 'admin',
  id: string,
): Promise<{ data: Notification }> {
  const response = await apiClient.patch<{ data: Notification }>(
    `/notifications/${role}/${id}/read`,
  );
  return response.data;
}
