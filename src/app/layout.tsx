import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const promptFont = Prompt({
  variable: '--font-prompt',
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
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
      <body className={`${promptFont.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}