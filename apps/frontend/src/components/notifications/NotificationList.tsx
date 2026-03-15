'use client';

import type { Notification } from '../../types/notification';
import { markNotificationAsRead } from '../../lib/api/notifications';

interface NotificationListProps {
  notifications: Notification[];
  role: 'store-owner' | 'admin';
  onRead: (id: string) => void;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function NotificationList({ notifications, role, onRead }: NotificationListProps) {
  async function handleClick(notification: Notification) {
    if (notification.isRead) return;
    try {
      await markNotificationAsRead(role, notification.id);
      onRead(notification.id);
    } catch {
      // Silent fail
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-md border bg-white p-4 shadow-lg">
        <p className="text-center text-sm text-gray-500">Không có thông báo</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-lg">
      <div className="border-b px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-700">Thông báo</h3>
      </div>
      <ul className="max-h-80 overflow-y-auto divide-y">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            onClick={() => handleClick(notification)}
            className={`cursor-pointer px-4 py-3 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
          >
            <div className="flex items-start gap-2">
              {!notification.isRead && (
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
              )}
              <div className={!notification.isRead ? '' : 'ml-4'}>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{notification.title}</p>
                {notification.body && (
                  <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{notification.body}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">{relativeTime(notification.createdAt)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
