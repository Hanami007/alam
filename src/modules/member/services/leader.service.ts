import { pool } from '@/lib/db';
import { notificationDbService } from '@/modules/notifications/services/notification.service';

/**
 * หัวหน้ารุ่น (generation_leaders) และคำถามปลดล็อกคลังภาพของรุ่น (generation_unlock_questions)
 * ดู migration 1750000023000_generation-leaders-and-activity
 *
 * หัวหน้ารุ่นแยกจาก users.role และ users.student_status — เป็นตำแหน่งที่ผูกกับรุ่น
 * รุ่นละ 1 คน คนละ 1 รุ่น แอดมินแต่งตั้ง/ถอด ศิษย์ปัจจุบันเป็นได้
 */

export interface GenerationLeader {
  generationId: number;
  generationLabel: string;
  userId: number;
  name: string;
}

export interface UnlockQuestion {
  generationId: number;
  generationLabel: string;
  question: string;
  acceptedAnswers: string[];
  updatedAt: string;
}

/** เทียบคำตอบแบบไม่สนช่องว่าง ตัวพิมพ์ และจุด/ขีด เช่น "อ. สมชาย" = "อ.สมชาย" = "อสมชาย" */
export function normalizeAnswer(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/[\s.\-_,'"]/g, '');
}

export class LeaderService {
  /** รุ่นที่ผู้ใช้นี้เป็นหัวหน้า (null = ไม่ใช่หัวหน้ารุ่น หรือยังไม่ได้รัน migration) */
  async getLeaderGeneration(userId: number): Promise<{ id: number; label: string } | null> {
    try {
      const { rows } = await pool.query(
        `SELECT g.id, g.label FROM generation_leaders gl
         JOIN lookup_options g ON g.id = gl.generation_option_id
         WHERE gl.user_id = $1`,
        [userId]
      );
      return rows[0] ?? null;
    } catch {
      return null;
    }
  }

  async listLeaders(): Promise<GenerationLeader[]> {
    try {
      const { rows } = await pool.query(
        `SELECT gl.generation_option_id, g.label, gl.user_id, u.name
         FROM generation_leaders gl
         JOIN lookup_options g ON g.id = gl.generation_option_id
         JOIN users u ON u.id = gl.user_id`
      );
      return rows.map((r) => ({ generationId: r.generation_option_id, generationLabel: r.label, userId: r.user_id, name: r.name }));
    } catch {
      return [];
    }
  }

  /**
   * แต่งตั้งหัวหน้ารุ่น (รุ่นตามข้อมูลของผู้ใช้เอง) — ถ้ารุ่นนั้นมีหัวหน้าอยู่แล้วจะถูกแทนที่
   * คืนชื่อหัวหน้าคนเดิมที่ถูกแทน (ถ้ามี)
   */
  async appoint(userId: number, actorId: number): Promise<{ generationLabel: string; replacedName: string | null }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: target } = await client.query(
        `SELECT u.id, u.name, u.role, u.status, u.generation_option_id, g.label AS generation
         FROM users u LEFT JOIN lookup_options g ON g.id = u.generation_option_id
         WHERE u.id = $1`,
        [userId]
      );
      const t = target[0];
      if (!t) throw new Error('ไม่พบสมาชิก');
      if (t.role === 'admin') throw new Error('บัญชีแอดมินมีสิทธิ์ทุกอย่างอยู่แล้ว ไม่ต้องเป็นหัวหน้ารุ่น');
      if (t.status !== 'approved') throw new Error('แต่งตั้งได้เฉพาะสมาชิกที่อนุมัติแล้ว');
      if (!t.generation_option_id) throw new Error('สมาชิกคนนี้ยังไม่ได้ระบุรุ่น');

      const { rows: previous } = await client.query(
        `DELETE FROM generation_leaders WHERE generation_option_id = $1 AND user_id <> $2
         RETURNING (SELECT name FROM users WHERE id = generation_leaders.user_id) AS name`,
        [t.generation_option_id, userId]
      );
      await client.query(
        `INSERT INTO generation_leaders (generation_option_id, user_id, appointed_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET generation_option_id = EXCLUDED.generation_option_id, appointed_by = EXCLUDED.appointed_by, appointed_at = now()`,
        [t.generation_option_id, userId, actorId]
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
         VALUES ($1, 'appoint_generation_leader', 'user', $2, $3)`,
        [actorId, userId, JSON.stringify({ name: t.name, generation: t.generation, replaced: previous[0]?.name ?? null })]
      );
      await client.query('COMMIT');

      await notificationDbService
        .createNotification(
          userId,
          'system',
          `คุณได้รับแต่งตั้งเป็นหัวหน้า${t.generation} 👑`,
          'ยืนยันสมาชิกใหม่ของรุ่น และตั้งคำถามปลดล็อกคลังภาพของรุ่นได้ที่เมนู "จัดการรุ่น"',
          '/member/approvals'
        )
        .catch(() => {});

      return { generationLabel: t.generation, replacedName: previous[0]?.name ?? null };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async remove(userId: number, actorId: number): Promise<boolean> {
    const { rows } = await pool.query(
      `DELETE FROM generation_leaders WHERE user_id = $1
       RETURNING (SELECT label FROM lookup_options WHERE id = generation_leaders.generation_option_id) AS generation`,
      [userId]
    );
    if (rows.length === 0) return false;
    await pool
      .query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
         VALUES ($1, 'remove_generation_leader', 'user', $2, $3)`,
        [actorId, userId, JSON.stringify({ generation: rows[0].generation })]
      )
      .catch(() => {});
    return true;
  }

  // ─── คำถามปลดล็อกคลังภาพ ────────────────────────────────────────────────

  async getQuestion(generationId: number): Promise<UnlockQuestion | null> {
    try {
      const { rows } = await pool.query(
        `SELECT q.generation_option_id, g.label, q.question, q.accepted_answers, q.updated_at
         FROM generation_unlock_questions q JOIN lookup_options g ON g.id = q.generation_option_id
         WHERE q.generation_option_id = $1`,
        [generationId]
      );
      const r = rows[0];
      return r
        ? { generationId: r.generation_option_id, generationLabel: r.label, question: r.question, acceptedAnswers: r.accepted_answers, updatedAt: r.updated_at }
        : null;
    } catch {
      return null;
    }
  }

  /** คำถามของทุกรุ่น ตาม label ("รุ่น 28") — ใช้แทนคำถามตายตัวในคลังภาพ (ไม่ส่งคำตอบออกไป) */
  async getQuestionsByLabel(): Promise<Map<string, string>> {
    try {
      const { rows } = await pool.query(
        `SELECT g.label, q.question FROM generation_unlock_questions q
         JOIN lookup_options g ON g.id = q.generation_option_id`
      );
      return new Map(rows.map((r) => [r.label, r.question]));
    } catch {
      return new Map();
    }
  }

  async setQuestion(generationId: number, question: string, answers: string[], actorId: number): Promise<void> {
    const cleanQuestion = question.trim();
    const cleanAnswers = [...new Set(answers.map((a) => a.trim()).filter(Boolean))];
    if (!cleanQuestion) throw new Error('กรุณากรอกคำถาม');
    if (cleanQuestion.length > 200) throw new Error('คำถามต้องไม่เกิน 200 ตัวอักษร');
    if (cleanAnswers.length === 0) throw new Error('กรุณากรอกคำตอบที่ถูกต้องอย่างน้อย 1 คำตอบ');
    if (cleanAnswers.length > 10) throw new Error('ใส่คำตอบที่ยอมรับได้ไม่เกิน 10 แบบ');

    await pool.query(
      `INSERT INTO generation_unlock_questions (generation_option_id, question, accepted_answers, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (generation_option_id) DO UPDATE
         SET question = EXCLUDED.question, accepted_answers = EXCLUDED.accepted_answers,
             updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [generationId, cleanQuestion, cleanAnswers, actorId]
    );
  }

  /**
   * ตรวจคำตอบปลดล็อกรุ่น (ตาม label "รุ่น 28")
   * - รุ่นที่ยังไม่มีคำถาม: ผ่าน (เหมือนเดิมก่อนมีระบบนี้)
   * - มีคำถาม: ผ่านเมื่อคำตอบตรงกับคำตอบใดคำตอบหนึ่งที่ยอมรับ
   */
  async checkUnlockAnswer(generationLabel: string, answer: string): Promise<boolean> {
    let accepted: string[] | null = null;
    try {
      const { rows } = await pool.query(
        `SELECT q.accepted_answers FROM generation_unlock_questions q
         JOIN lookup_options g ON g.id = q.generation_option_id
         WHERE g.category = 'generation' AND g.label = $1`,
        [generationLabel]
      );
      accepted = rows[0]?.accepted_answers ?? null;
    } catch {
      accepted = null;
    }
    if (!accepted) return true;
    const given = normalizeAnswer(answer);
    return given.length > 0 && accepted.some((a) => normalizeAnswer(a) === given);
  }
}

export const leaderService = new LeaderService();
