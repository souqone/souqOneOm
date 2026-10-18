import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { LegalPageShell, LegalSectionItem } from '@/components/legal/LegalPageShell';
import { LEGAL_CONFIG } from '@/lib/legal-config';

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  const title = isArabic
    ? `الشروط والأحكام — ${LEGAL_CONFIG.brandName.ar}`
    : `Terms & Conditions — ${LEGAL_CONFIG.brandName.en}`;

  const description = isArabic
    ? 'الشروط والأحكام المنظمة لاستخدام منصة سوق ون للسيارات والمعدات والخدمات في سلطنة عُمان.'
    : 'Terms and conditions governing the use of the Souqone platform in the Sultanate of Oman.';

  const canonical = `${LEGAL_CONFIG.websiteUrl}/${locale}/terms`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${LEGAL_CONFIG.websiteUrl}/ar/terms`,
        en: `${LEGAL_CONFIG.websiteUrl}/en/terms`,
        'x-default': `${LEGAL_CONFIG.websiteUrl}/ar/terms`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: LEGAL_CONFIG.brandName[locale as 'ar' | 'en'] || LEGAL_CONFIG.brandName.ar,
      locale: isArabic ? 'ar_OM' : 'en_OM',
      type: 'article',
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'en' ? 'en' : 'ar') as 'ar' | 'en';

  if (rawLocale !== 'ar' && rawLocale !== 'en') {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const termsData = messages.legalPages?.terms;

  if (!termsData) {
    notFound();
  }

  const sections: LegalSectionItem[] = Object.entries(termsData.sections).map(
    ([key, section]: [string, any]) => ({
      id: key,
      title: section.title,
      content: section.content,
    }),
  );

  return (
    <LegalPageShell
      locale={locale}
      title={termsData.title}
      subtitle={termsData.subtitle}
      sections={sections}
    />
  );
}
