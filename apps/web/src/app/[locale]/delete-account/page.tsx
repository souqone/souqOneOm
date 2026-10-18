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
    ? `طلب حذف الحساب — ${LEGAL_CONFIG.brandName.ar}`
    : `Account Deletion — ${LEGAL_CONFIG.brandName.en}`;

  const description = isArabic
    ? 'خطوات ومعلومات تقديم طلب حذف الحساب والبيانات في منصة سوق ون بسلطنة عُمان.'
    : 'Guidelines and procedures for requesting account and data deletion on the Souqone platform.';

  const canonical = `${LEGAL_CONFIG.websiteUrl}/${locale}/delete-account`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${LEGAL_CONFIG.websiteUrl}/ar/delete-account`,
        en: `${LEGAL_CONFIG.websiteUrl}/en/delete-account`,
        'x-default': `${LEGAL_CONFIG.websiteUrl}/ar/delete-account`,
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

export default async function DeleteAccountPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'en' ? 'en' : 'ar') as 'ar' | 'en';

  if (rawLocale !== 'ar' && rawLocale !== 'en') {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const deleteAccountData = messages.legalPages?.deleteAccount;

  if (!deleteAccountData) {
    notFound();
  }

  const sections: LegalSectionItem[] = Object.entries(deleteAccountData.sections).map(
    ([key, section]: [string, any]) => ({
      id: key,
      title: section.title,
      content: section.content,
    }),
  );

  return (
    <LegalPageShell
      locale={locale}
      title={deleteAccountData.title}
      subtitle={deleteAccountData.subtitle}
      sections={sections}
    />
  );
}
