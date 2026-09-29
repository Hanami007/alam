/**
 * Global User Events
 */
export const USER_POINTS_UPDATED_EVENT = 'user_points_updated';
export const NOTIFICATION_ADDED_EVENT = 'notification_added';

export interface AppNotification {
  id: string;
  // ของจริงจาก DB จะมี type อย่าง 'admin_pending' / 'batchmate_pending' / 'user_approved' / 'system'
  // ด้วย จึงรับเป็น string ทั่วไปแทน union ปิดตาย
  type: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  /** มีก็ต่อเมื่อ map มาจากแถวจริงใน DB (ตาราง notifications) — ใช้ยิง mark-as-read กลับไปที่ API */
  dbId?: number;
  /** ลิงก์ปลายทางเมื่อกดการแจ้งเตือน (เช่น /admin, /member/approvals) */
  link?: string | null;
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
