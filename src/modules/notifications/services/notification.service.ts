import { pool } from '@/lib/db';

export class NotificationDbService {
  /** สร้างการแจ้งเตือนให้ผู้ใช้ 1 คน */
  async createNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    link?: string,
    referenceId?: string
  ) {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message, link ?? null, referenceId ? String(referenceId) : null]
    );
    return rows[0];
  }

  /** แจ้งเตือนแอดมินทุกคนเมื่อมีคนสมัครใหม่ */
  async notifyAdminNewRegistration(newUserId: number, applicantName: string, generationLabel?: string) {
    const { rows: admins } = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
    const genText = generationLabel ? ` (${generationLabel})` : '';
    for (const admin of admins) {
      await this.createNotification(
        admin.id,
        'admin_pending',
        'มีผู้สมัครสมาชิกใหม่รอการอนุมัติ',
        `${applicantName}${genText} ได้ลงทะเบียนเข้าสู่ระบบ โปรดตรวจสอบและอนุมัติในแดชบอร์ด`,
        '/admin',
        String(newUserId)
      );
    }
  }

  /** แจ้งเตือนเพื่อนร่วมรุ่นทุกคนที่ได้รับการอนุมัติแล้ว */
  async notifyBatchmatesNewRegistration(
    generationOptionId: number,
    newUserId: number,
    applicantName: string,
    studentId?: string
  ) {
    if (!generationOptionId) return;

    const { rows: batchmates } = await pool.query(
      `SELECT id FROM users
       WHERE generation_option_id = $1
         AND status = 'approved'
         AND id != $2`,
      [generationOptionId, newUserId]
    );

    const studentIdText = studentId ? ` (รหัส ${studentId})` : '';
    for (const mate of batchmates) {
      await this.createNotification(
        mate.id,
        'batchmate_pending',
        'เพื่อนร่วมรุ่นคนใหม่รอการยืนยัน',
        `${applicantName}${studentIdText} ได้สมัครเข้าสู่ระบบในรุ่นของคุณ ช่วยยืนยันตัวตนเพื่อนร่วมรุ่น`,
        '/member/approvals',
        String(newUserId)
      );
    }
  }

  /** ดึงการแจ้งเตือนของผู้ใช้ */
  async getUserNotifications(userId: number, limit = 20) {
    const { rows } = await pool.query(
      `SELECT id, user_id, type, title, message, link, reference_id, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }

  /** นับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน */
  async getUnreadNotificationCount(userId: number): Promise<number> {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return rows[0]?.count ?? 0;
  }

  /** ทำเครื่องหมายว่าอ่านแล้ว */
  async markNotificationAsRead(notifId: number, userId: number) {
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id, is_read`,
      [notifId, userId]
    );
    return rows[0] ?? null;
  }

  /** ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว */
  async markAllNotificationsAsRead(userId: number) {
    await pool.query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`, [userId]);
    return { success: true };
  }
}

export const notificationDbService = new NotificationDbService();
