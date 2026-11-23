import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * ตัวกรองคำไม่เหมาะสม (ใช้กับโพสต์ โพล ความคิดเห็น และประกาศ)
 *
 * เดิมตรวจแบบ substring (`text.includes(keyword)`) ภาษาไทยไม่มีช่องว่างคั่นคำ จึงบล็อกคำปกติที่มี
 * คำต้องห้ามซ้อนอยู่ข้างใน เช่น คำต้องห้าม "หี" ทำให้พิมพ์ "หีบ" ไม่ได้
 *
 * ตอนนี้ตัดคำด้วย Intl.Segmenter (ICU dictionary ภาษาไทย มีใน Node อยู่แล้ว ไม่ต้องลง library)
 * แล้วถือว่าเจอคำต้องห้ามเมื่อ "คำที่ตัดได้ต่อกันพอดี" เท่ากับคำต้องห้าม — ต้องเริ่มและจบตรงขอบคำ
 * (รองรับกรณีตัดคำต้องห้ามแตกเป็นหลายชิ้น เช่นคำสแลงที่ไม่อยู่ในพจนานุกรม)
 */

const segmenter = new Intl.Segmenter('th', { granularity: 'word' });

// zero-width space/joiner และ soft hyphen ที่ใช้แทรกเลี่ยงตัวกรอง
const INVISIBLE_CHARS = /[​-‍⁠﻿­]/g;

function normalize(text: string): string {
  return text.normalize('NFC').replace(INVISIBLE_CHARS, '').toLowerCase();
}

/** ตัดคำ คืนเฉพาะชิ้นที่เป็นคำ (ไม่รวมช่องว่าง/เครื่องหมาย) */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const seg of segmenter.segment(normalize(text))) {
    if (seg.isWordLike) tokens.push(seg.segment);
  }
  return tokens;
}

function containsKeyword(tokens: string[], keyword: string): boolean {
  for (let start = 0; start < tokens.length; start++) {
    let joined = '';
    for (let end = start; end < tokens.length; end++) {
      joined += tokens[end];
      if (joined === keyword) return true;
      if (!keyword.startsWith(joined)) break;
    }
  }
  return false;
}

/** คืนรายการคำต้องห้ามที่พบใน texts (ไม่ซ้ำ ตามลำดับรายการคำต้องห้าม) */
export function matchBannedWords(texts: string[], keywords: string[]): string[] {
  const tokenLists = texts.filter(Boolean).map(tokenize);
  return keywords.filter((raw) => {
    // ตัดช่องว่างในคำต้องห้ามออก — เทียบกับคำที่ตัดแล้วซึ่งไม่มีช่องว่างอยู่แล้ว
    const keyword = tokenize(raw).join('');
    return keyword.length > 0 && tokenLists.some((tokens) => containsKeyword(tokens, keyword));
  });
}

export async function findBannedWords(texts: string[]): Promise<string[]> {
  const { rows } = await pool.query<{ keyword: string }>(`SELECT keyword FROM banned_keywords`);
  return matchBannedWords(
    texts,
    rows.map((r) => r.keyword)
  );
}

/** response มาตรฐานเมื่อเจอคำต้องห้าม — หน้าเว็บดู code แล้วแสดง pop-up กลางจอ */
export function bannedWordsResponse(bannedWords: string[], label = 'ข้อความ') {
  return NextResponse.json(
    {
      success: false,
      code: 'BANNED_WORDS',
      error: `${label}ของคุณมีคำที่ไม่เหมาะสม: "${bannedWords.join('", "')}" กรุณาแก้ไขก่อนส่งอีกครั้ง`,
      bannedWords,
    },
    { status: 400 }
  );
}
