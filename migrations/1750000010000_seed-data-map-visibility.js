/* eslint-disable camelcase */

/**
 * Migration 010 — (ว่าง) เดิมเปิดให้คนสมมติจาก migration 008 แสดงบนแผนที่
 *
 * คนสมมติถูกลบออกแล้ว (ดู 1750000017000_remove-mock-data.js) จึงไม่มีอะไรให้อัปเดต
 * ต้องเก็บไฟล์ไว้เพราะ node-pg-migrate บันทึกชื่อ migration ที่รันไปแล้วใน DB
 */

exports.up = () => {};

exports.down = () => {};
