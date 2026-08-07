// แทนที่เนื้อหาทั้งหมดใน src/app/page.tsx ด้วยไฟล์นี้
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/feed');
}