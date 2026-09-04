/**
 * Global User Events
 */
export const USER_POINTS_UPDATED_EVENT = 'user_points_updated';
export const NOTIFICATION_ADDED_EVENT = 'notification_added';

export interface AppNotification {
  id: string;
  type: 'birthday' | 'poll' | 'verify' | 'comment' | 'general';
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

export function notifyPointsUpdated(pointsAdded: number = 1) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(USER_POINTS_UPDATED_EVENT, {
        detail: { pointsAdded, timestamp: Date.now() },
      })
    );
  }
}

export function notifyNewNotification(notification: Omit<AppNotification, 'id' | 'time' | 'unread'> & { id?: string; time?: string }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_ADDED_EVENT, {
        detail: {
          id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          time: notification.time || 'เมื่อสักครู่',
          unread: true,
          ...notification,
        },
      })
    );
  }
}
