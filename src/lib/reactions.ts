/**
 * อีโมจิที่ใช้กดถูกใจความคิดเห็น — ใช้ร่วมกันทั้งหน้าเว็บ (feed-list) และ API (/api/feed/comment/like)
 * API ปฏิเสธอีโมจิที่ไม่อยู่ในรายการนี้ ถ้าเพิ่มอีโมจิใหม่ต้องไม่ยาวเกิน varchar(10)
 * ของ comment_reactions.emoji (migration 1750000021000_comment-reactions)
 */
export const DEFAULT_COMMENT_EMOJI = '❤️';

export const COMMENT_REACTION_EMOJIS = [
  { emoji: '💖', label: 'ส่งหัวใจ' },
  { emoji: '🥳', label: 'ยินดีด้วย' },
  { emoji: '💡', label: 'ไอเดียดี' },
  { emoji: '👏', label: 'สุดยอด' },
  { emoji: '🥺', label: 'ซาบซึ้ง' },
] as const;

export function isAllowedCommentEmoji(emoji: unknown): emoji is string {
  return (
    emoji === DEFAULT_COMMENT_EMOJI ||
    COMMENT_REACTION_EMOJIS.some((r) => r.emoji === emoji)
  );
}
