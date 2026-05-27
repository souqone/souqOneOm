import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-fetch';
import { getPrimaryImage } from '@/lib/utils/get-primary-image';
import CarRentalDetailClient from './car-rental-detail-client';

interface RentalOgData {
  title?: string;
  price?: string | number;
  dailyPrice?: string | number;
  monthlyPrice?: string | number;
  currency?: string;
  governorate?: string;
  images?: { url: string; isPrimary?: boolean }[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  try {
    const data = await serverFetch<RentalOgData>(`/listings/${id}`, { revalidate: 60 });

    const title = data.title || 'سيارة للإيجار';
    const cur = data.currency === 'OMR' || !data.currency ? 'ر.ع' : data.currency;
    const daily = data.dailyPrice ? `${Number(data.dailyPrice).toLocaleString('en-US')} ${cur}/يوم` : '';
    const monthly = data.monthlyPrice ? `${Number(data.monthlyPrice).toLocaleString('en-US')} ${cur}/شهر` : '';
    const priceInfo = daily || monthly || (data.price ? `${Number(data.price).toLocaleString('en-US')} ${cur}` : '');
    const descParts = [priceInfo, data.governorate || '', 'سيارة للإيجار'].filter(Boolean);
    const description = descParts.join(' · ') || title;
    const image = getPrimaryImage(data.images);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://souqone.com';
    const pageUrl = `${appUrl}/${locale}/cars/rental/${id}`;

    return {
      title: `${title} | سوق ون`,
      description,
      openGraph: {
        type: 'article',
        title,
        description,
        url: pageUrl,
        siteName: 'سوق ون - SouqOne',
        locale: locale === 'ar' ? 'ar_OM' : 'en_OM',
        ...(image ? { images: [{ url: image, width: 800, height: 600, alt: title }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return { title: 'سيارة للإيجار | سوق ون' };
  }
}

export default function CarRentalPage() {
  return <CarRentalDetailClient />;
}
