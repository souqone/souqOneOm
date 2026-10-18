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
    ? `سياسة الخصوصية — ${LEGAL_CONFIG.brandName.ar}`
    : `Privacy Policy — ${LEGAL_CONFIG.brandName.en}`;

  const description = isArabic
    ? 'سياسة الخصوصية وحماية البيانات في منصة سوق ون بسلطنة عُمان، والتزامنا بأمان وسرية بيانات المستخدمين.'
    : 'Privacy policy and data protection on the Souqone platform in the Sultanate of Oman.';

  const canonical = `${LEGAL_CONFIG.websiteUrl}/${locale}/privacy`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${LEGAL_CONFIG.websiteUrl}/ar/privacy`,
        en: `${LEGAL_CONFIG.websiteUrl}/en/privacy`,
        'x-default': `${LEGAL_CONFIG.websiteUrl}/ar/privacy`,
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

export default async function PrivacyPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'en' ? 'en' : 'ar') as 'ar' | 'en';

  if (rawLocale !== 'ar' && rawLocale !== 'en') {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const privacyData = messages.legalPages?.privacy;

  if (!privacyData) {
    notFound();
  }

  const sections: LegalSectionItem[] = Object.entries(privacyData.sections).map(
    ([key, section]: [string, any]) => ({
      id: key,
      title: section.title,
      content: section.content,
    }),
  );

  return (
    <LegalPageShell
      locale={locale}
      title={privacyData.title}
      subtitle={privacyData.subtitle}
      sections={sections}
    />
  );
}
