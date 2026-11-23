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

  /**
   * ยืนยันตัวตนผู้สมัคร — ทำได้ 2 แบบ:
   *  - เพื่อนร่วมรุ่น (บัญชี approved รุ่นเดียวกัน): ยืนยันได้เฉพาะผู้สมัครที่ยัง pending
   *  - แอดมิน: ยืนยันได้ทุกรุ่น รวมถึงคนที่เคยถูกปฏิเสธไปแล้ว (เปลี่ยนใจได้)
   * เพื่อนร่วมรุ่นห้ามอนุมัติคนที่แอดมินปฏิเสธไปแล้ว ไม่งั้นการปฏิเสธของแอดมินไม่มีผล
   */
  async approveBatchmate(applicantId: number, approverUserId: number) {
    const { rows: approver } = await pool.query(
      `SELECT id, name, role, status, generation_option_id FROM users WHERE id = $1`,
      [approverUserId]
    );
    if (!approver.length) throw new Error('ไม่พบข้อมูลผู้กดยืนยัน');
    if (approver[0].status !== 'approved') throw new Error('บัญชีของคุณยังไม่ได้รับการยืนยัน จึงยืนยันผู้อื่นไม่ได้');
    const isAdmin = approver[0].role === 'admin';

    const { rows: applicant } = await pool.query(
      `SELECT id, name, generation_option_id, status FROM users WHERE id = $1`,
      [applicantId]
    );
    if (!applicant.length) throw new Error('ไม่พบข้อมูลผู้สมัคร');
    if (applicant[0].id === approver[0].id) throw new Error('ไม่สามารถยืนยันตัวตนให้ตัวเองได้');
    if (applicant[0].status === 'approved') return applicant[0];

    if (!isAdmin) {
      if (applicant[0].status !== 'pending') {
        throw new Error('ผู้สมัครรายนี้ถูกผู้ดูแลระบบปฏิเสธแล้ว เฉพาะผู้ดูแลระบบเท่านั้นที่เปลี่ยนสถานะได้');
      }
      if (!approver[0].generation_option_id || approver[0].generation_option_id !== applicant[0].generation_option_id) {
        throw new Error('เฉพาะเพื่อนร่วมรุ่นเดียวกันเท่านั้นที่สามารถยืนยันตัวตนได้');
      }
    }

    // เงื่อนไข status ใน WHERE กันกรณีแอดมินปฏิเสธพร้อมกับที่เพื่อนกดยืนยัน (race)
    const { rows: updated } = await pool.query(
      `UPDATE users SET status = 'approved'
       WHERE id = $1 AND (status = 'pending' OR $2::boolean)
       RETURNING id, name, status, email`,
      [applicantId, isAdmin]
    );
    if (!updated.length) throw new Error('สถานะผู้สมัครเปลี่ยนไปแล้ว กรุณารีเฟรชหน้า');

    const approverLabel = isAdmin ? 'ผู้ดูแลระบบ' : 'เพื่อนร่วมรุ่น';
    await pool.query(
      `INSERT INTO user_verifications (user_id, verified_by, source, status, remark)
       VALUES ($1, $2, $3, 'approved', $4)`,
      [
        applicantId,
        approverUserId,
        isAdmin ? 'admin_manual' : 'batchmate_endorsement',
        `ยืนยันตัวตนโดย${approverLabel}: ${approver[0].name}`,
      ]
    );

    await notificationDbService.createNotification(
      applicantId,
      'user_approved',
      'ยินดีต้อนรับสู่ CS MJU CONNECT!',
      `บัญชีของคุณได้รับการยืนยันตัวตนโดย${approverLabel} (${approver[0].name}) เรียบร้อยแล้ว สามารถเข้าใช้งานระบบได้ทันที`,
      '/feed'
    );

    if (!isAdmin) {
      const { rows: admins } = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
      for (const admin of admins) {
        await notificationDbService.createNotification(
          admin.id,
          'system',
          'เพื่อนร่วมรุ่นยืนยันสมาชิกแล้ว',
          `${approver[0].name} ได้ยืนยันตัวตนเพื่อนร่วมรุ่น ${applicant[0].name} เรียบร้อยแล้ว`,
          '/member/approvals'
        );
      }
    }

    return updated[0];
  }

  /** แอดมินปฏิเสธผู้สมัคร (เพื่อนร่วมรุ่นปฏิเสธไม่ได้ ทำได้แค่ยืนยัน) — ลบ session ที่ค้างอยู่ทิ้งด้วย */
  async rejectApplicant(applicantId: number, adminUserId: number, remark?: string) {
    const { rows: updated } = await pool.query(
      `UPDATE users SET status = 'rejected'
       WHERE id = $1 AND role <> 'admin' AND status <> 'rejected'
       RETURNING id, name, status`,
      [applicantId]
    );
    if (!updated.length) throw new Error('ไม่พบผู้สมัคร หรือผู้สมัครถูกปฏิเสธไปแล้ว');

    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [applicantId]);
    await pool.query(
      `INSERT INTO user_verifications (user_id, verified_by, source, status, remark)
       VALUES ($1, $2, 'admin_manual', 'rejected', $3)`,
      [applicantId, adminUserId, remark || null]
    );
    return updated[0];
  }
}

export const memberDbService = new MemberDbService();
