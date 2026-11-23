# หลักการตั้งชื่อฐานข้อมูล (DB Naming Convention)

ใช้กับตาราง/คอลัมน์ใหม่ทุกตัว และเป็นเกณฑ์ตัดสินว่าชื่อเดิมตัวไหน "สื่อผิด" ต้องแก้
(การแก้ชื่อทำผ่าน migration เท่านั้น — ดู `migrations/1750000017000_naming-convention-and-field-sizes.js`)

## 1. รูปแบบทั่วไป

| สิ่งที่ตั้งชื่อ | รูปแบบ | ตัวอย่าง |
|---|---|---|
| ตาราง | `snake_case` พหูพจน์ | `users`, `content_reports`, `poll_options` |
| คอลัมน์ | `snake_case` เอกพจน์ | `title`, `birth_date` |
| Primary key | `id` | `users.id` |
| ภาษา | อังกฤษเท่านั้น (คำอธิบายภาษาไทยไว้ใน comment ของ migration) | |

## 2. Foreign key — ชื่อต้องบอก "บทบาทในแถวนี้" ไม่ใช่ role ของคนในระบบ

| กรณี | รูปแบบ | ตัวอย่าง |
|---|---|---|
| อ้างถึงเจ้าของ/ตัวหลักของแถว | `<entity>_id` | `post_id`, `user_id`, `poll_id` |
| อ้างถึง user ที่ **ทำการกระทำ** กับแถวนี้ | `<กริยาช่อง 3>_by` | `requested_by`, `published_by`, `verified_by`, `reported_by`, `resolved_by`, `uploaded_by`, `tagged_by`, `added_by` |
| อ้างถึง user ในบทบาทอื่น | `<บทบาท>_id` / `<บทบาท>_user_id` | `voter_id`, `tagged_user_id` |
| อ้างถึง `lookup_options` | `<หมวด>_option_id` | `generation_option_id`, `career_option_id` |

**ห้าม** ตั้งชื่อ FK ตาม role ของ user ในระบบ (เช่น `admin_id`) ถ้าคนที่ถูกเก็บไม่จำเป็นต้องมี role นั้น
— ตัวอย่างที่แก้แล้ว: `user_verifications.admin_id` เก็บ id ของ **เพื่อนร่วมรุ่น** ที่ยืนยันตัวตนด้วย
จึงเปลี่ยนเป็น `verified_by`

## 3. ชนิดข้อมูลเฉพาะ

| ชนิด | รูปแบบ | ตัวอย่าง |
|---|---|---|
| boolean ที่เป็นสถานะ | `is_<คุณสมบัติ>` | `is_hidden`, `is_read`, `is_passed` |
| boolean ที่เป็นการตั้งค่าการแสดงผล | `show_<ฟิลด์>[_on_<ที่>]` | `show_email`, `show_hometown_on_map` |
| เวลา (timestamptz) | `<เหตุการณ์>_at` | `created_at`, `published_at`, `resolved_at` |
| วันที่ (date) | `<ชื่อ>_date` | `birth_date` |
| ปี (integer) | `<ชื่อ>_year` | `admission_year`, `expected_graduation_year` |
| URL / path ของไฟล์ | `<ชื่อ>_url` และชื่อต้องบอกว่าเป็นรูปแบบไหน | `avatar_url`, `original_image_url` (เดิม `watermark_url` ซึ่งจริงๆ เก็บรูปต้นฉบับ) |
| ค่า enum เก็บเป็นข้อความ | ค่าเป็น `snake_case` + ใส่ `CHECK (... IN (...))` | `status IN ('pending','hidden','deleted','dismissed')` |

## 4. ขนาดฟิลด์ข้อความ

- ข้อความที่ผู้ใช้กรอก: `varchar(n)` โดย `n` ต้องตรงกับ `maxLength` ในหน้าเว็บ
  ค่าทั้งหมดอยู่ที่ `src/lib/field-limits.ts` (ใช้ร่วมกันทั้ง UI และ API) — แก้ค่าที่นั่นต้องเขียน migration แก้คอลัมน์ด้วย
- ค่า enum: `varchar(20)` (หรือ 30 ถ้าค่ายาว)
- `text` ใช้ได้เฉพาะข้อมูลที่ระบบสร้างเองและไม่มีขีดจำกัดตามธรรมชาติ (เช่น `notifications.message`, `audit_logs.metadata`)
- **ห้ามเก็บไฟล์ (base64) ลง DB** — เก็บไฟล์ใน `data/uploads/...` แล้วเก็บแค่ path

## 5. ชื่อที่แก้แล้วใน migration 017

| เดิม | ใหม่ | เหตุผล |
|---|---|---|
| `user_verifications.admin_id` | `verified_by` | เก็บทั้งแอดมินและเพื่อนร่วมรุ่นที่ยืนยัน |
| `posts.admin_id` | `published_by` | คนที่สร้าง/อนุมัติให้โพสต์เผยแพร่ |
| `media_assets.watermark_url` | `original_image_url` | เก็บรูปต้นฉบับที่ชัด (`image_url` คือรูปเบลอ/พรีวิว) |

## 6. ชื่อเดิมที่ยังไม่ตรงหลักแต่ยังไม่แก้ (รอแก้เมื่อแตะส่วนนั้น)

| ชื่อ | ควรเป็น | เหตุที่ยังไม่แก้ |
|---|---|---|
| `posts.pinned` | `is_pinned` | ไม่สื่อผิด ใช้หลายจุดใน UI |
| `users.status` | `account_status` | สับสนกับ `student_status` ได้ แต่ใช้ในเกือบทุก query (รวม middleware) — แยกทำเป็นงานเดี่ยว |
| `users.province_option_id` | (ลบ — ซ้ำกับ `hometown_province_id`) | ทุกที่เขียนค่าเดียวกันทั้งสองคอลัมน์ ต้องย้าย query ทั้งหมดก่อนลบ |
| `login_attempts.success` | `is_success` | ไม่สื่อผิด |
