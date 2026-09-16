import { pool } from '@/lib/db';
import { notificationDbService } from '@/modules/notifications/services/notification.service';

export class MemberDbService {
  /** ดึงรายการเพื่อนร่วมรุ่นที่รออนุมัติ */
  async getPendingBatchmates(generationOptionId: number) {
    if (!generationOptionId) return [];

    const { rows } = await pool.query(
      `SELECT u.id, u.student_id, u.name, u.email, u.student_status, u.admission_year,
              u.created_at, gen.label as generation, prov.label as province
       FROM users u
       LEFT JOIN lookup_options gen ON gen.id = u.generation_option_id
       LEFT JOIN lookup_options prov ON prov.id = u.province_option_id
       WHERE u.generation_option_id = $1 AND u.status = 'pending'
       ORDER BY u.created_at DESC`,
      [generationOptionId]
    );
    return rows;
  }

  /** เพื่อนร่วมรุ่นกดยืนยัน/อนุมัติเพื่อนร่วมรุ่น */
  async approveBatchmate(applicantId: number, approverUserId: number) {
    const { rows: approver } = await pool.query(
      `SELECT id, name, generation_option_id FROM users WHERE id = $1`,
      [approverUserId]
    );
    if (!approver.length) throw new Error('ไม่พบข้อมูลผู้กดยืนยัน');

    const { rows: applicant } = await pool.query(
      `SELECT id, name, generation_option_id, status FROM users WHERE id = $1`,
      [applicantId]
    );
    if (!applicant.length) throw new Error('ไม่พบข้อมูลผู้สมัคร');
    if (applicant[0].status === 'approved') return applicant[0];

    if (approver[0].generation_option_id !== applicant[0].generation_option_id) {
      throw new Error('เฉพาะเพื่อนร่วมรุ่นเดียวกันเท่านั้นที่สามารถยืนยันตัวตนได้');
    }

    const { rows: updated } = await pool.query(
      `UPDATE users SET status = 'approved' WHERE id = $1 RETURNING id, name, status, email`,
      [applicantId]
    );

    await pool.query(
      `INSERT INTO user_verifications (user_id, admin_id, source, status, remark)
       VALUES ($1, $2, 'batchmate_endorsement', 'approved', $3)`,
      [applicantId, approverUserId, `ยืนยันตัวตนโดยเพื่อนร่วมรุ่น: ${approver[0].name}`]
    );

    await notificationDbService.createNotification(
      applicantId,
      'user_approved',
      'ยินดีต้อนรับสู่ CS MJU CONNECT!',
      `บัญชีของคุณได้รับการยืนยันตัวตนโดยเพื่อนร่วมรุ่น (${approver[0].name}) เรียบร้อยแล้ว สามารถเข้าใช้งานระบบได้ทันที`,
      '/feed'
    );

    const { rows: admins } = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
    for (const admin of admins) {
      await notificationDbService.createNotification(
        admin.id,
        'system',
        'เพื่อนร่วมรุ่นยืนยันสมาชิกแล้ว',
        `${approver[0].name} ได้ยืนยันตัวตนเพื่อนร่วมรุ่น ${applicant[0].name} เรียบร้อยแล้ว`,
        '/admin'
      );
    }

    return updated[0];
  }
}

export const memberDbService = new MemberDbService();
