import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'AlumniConnect | ระบบศิษย์เก่า',
  description: 'แพลตฟอร์มเชื่อมต่อศิษย์เก่ามหาวิทยาลัย วอลล์ข่าวสาร ศิษย์เก่าดีเด่น แผนที่ศิษย์เก่า และคลังภาพเก่า',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}