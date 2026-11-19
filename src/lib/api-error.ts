/**
 * แปลง error เป็นข้อความที่ปลอดภัยจะส่งกลับไปให้ client
 *
 * ปัญหาเดิม: route ส่วนใหญ่ตอบ `err.message` ตรงๆ ตอน 500 ทำให้ข้อความภายในหลุดออกไป
 * เช่น error ของ Postgres (ชื่อตาราง/คอลัมน์/constraint), TypeError จากบั๊ก, ข้อความ
 * network ที่มี hostname ภายใน — ข้อมูลพวกนี้ช่วยผู้โจมตีสำรวจระบบได้
 *
 * กติกา: ส่งข้อความจริงกลับเฉพาะ error ที่โค้ดเราตั้งใจ `throw new Error('ข้อความภาษาไทย')`
 * ให้ผู้ใช้อ่าน (เป็น Error ธรรมดา ไม่มี `code`) — นอกนั้นใช้ข้อความกลาง `fallback`
 *  - pg DatabaseError มี `code` (SQLSTATE) และ name ไม่ใช่ 'Error'
 *  - Node system error (ECONNREFUSED ฯลฯ) มี `code`
 *  - TypeError/SyntaxError/RangeError (บั๊ก, JSON body พัง) เป็นคนละ class กับ Error
 * รายละเอียดจริงยังต้อง console.error ไว้ที่ฝั่ง server เสมอ
 */
export function publicErrorMessage(
  err: unknown,
  fallback = 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง'
): string {
  if (
    err instanceof Error &&
    Object.getPrototypeOf(err) === Error.prototype &&
    !('code' in err) &&
    typeof err.message === 'string' &&
    err.message.length > 0 &&
    err.message.length <= 300 &&
    // ข้อความที่โค้ดเรา throw ให้ผู้ใช้อ่านเป็นภาษาไทยทั้งหมด — library บางตัว (เช่น pg-pool
    // "timeout exceeded when trying to connect") ก็ throw Error ธรรมดาเป็นภาษาอังกฤษ จึงกรองออก
    /[฀-๿]/.test(err.message)
  ) {
    return err.message;
  }
  return fallback;
}
