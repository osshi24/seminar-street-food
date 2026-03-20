export type NotificationEventType =
  | 'REGISTRATION_SUBMITTED'
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_REJECTED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_REACTIVATED';

export interface Notification {
  id: string;
  recipientType: 'store_owner' | 'admin';
  recipientId: string;
  eventType: NotificationEventType;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  data: {
    data: Notification[];
    total: number;
  };
}
