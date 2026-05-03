import type { Metadata } from 'next';
import { Almarai } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { routing } from '@/i18n/routing';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/components/toast';
import { AuthModalProvider } from '@/providers/auth-modal-provider';
import { AuthOverlay } from '@/features/auth/components/auth-overlay';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SearchProvider } from '@/providers/search-provider';
import { FavoritesProvider } from '@/providers/favorites-provider';
import { PageTransition } from '@/components/page-transition';

const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['300', '400', '700', '800'],
  variable: '--font-almarai',
  display: 'swap',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const tp = await getTranslations({ locale, namespace: 'pages' });

  const altLocale = locale === 'ar' ? 'en' : 'ar';

  return {
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
    title: {
      default: tp('layoutTitle'),
      template: tp('layoutTitleTemplate'),
    },
    description: tp('layoutDescription'),
    keywords: tp('layoutKeywords').split(',').map((k: string) => k.trim()),
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        [locale]: `/${locale}`,
        [altLocale]: `/${altLocale}`,
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_OM' : 'en_OM',
      siteName: tp('layoutSiteName'),
      title: tp('layoutOgTitle'),
      description: tp('layoutOgDescription'),
    },
    twitter: {
      card: 'summary_large_image',
      title: tp('layoutOgTitle'),
      description: tp('layoutOgDescription'),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Load messages for the current locale
  const messages = await getMessages();

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={almarai.variable} suppressHydrationWarning>
      <head>
        {/* Material Symbols — loaded eagerly so icons render immediately */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <FavoritesProvider>
                <AuthModalProvider>
                  <ToastProvider>
                    <SearchProvider>
                      <PageTransition>
                        {children}
                      </PageTransition>
                      <BottomNav />
                    </SearchProvider>
                  </ToastProvider>
                  <AuthOverlay />
                </AuthModalProvider>
                </FavoritesProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
