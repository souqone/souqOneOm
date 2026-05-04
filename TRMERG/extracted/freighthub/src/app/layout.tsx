import type { Metadata, Viewport } from 'next';
import { Almarai } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from '@/lib/providers';

const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['400', '700', '800'],
  variable: '--font-almarai',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'فريت هب — سوق نقل البضائع في عُمان',
  description:
    'منصة فريت هب تربط أصحاب الشحنات بمزودي خدمات النقل الموثوقين في سلطنة عُمان. أنشئ طلب نقل أو قدّم عرضاً الآن.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={almarai.variable}>
      <body className={almarai.className}>
        <Providers>{children}</Providers>
</body>
    </html>
  );
}