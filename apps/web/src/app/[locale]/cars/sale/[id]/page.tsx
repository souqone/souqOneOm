import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-fetch';
import { getPrimaryImage } from '@/lib/utils/get-primary-image';
import CarSaleDetailClient from './car-sale-detail-client';

interface OgData {
  title?: string;
  description?: string;
  price?: string | number;
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
    const data = await serverFetch<OgData>(`/listings/${id}`, { revalidate: 60 });

    const title = data.title || 'سيارة';
    const price = data.price ? `${Number(data.price).toLocaleString('en-US')} ${data.currency || 'OMR'}` : '';
    const location = data.governorate || '';
    const descParts = [price, location, 'سيارة'].filter(Boolean);
    const description = descParts.join(' · ') || title;
    const image = getPrimaryImage(data.images);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://souqone.com';
    const pageUrl = `${appUrl}/${locale}/cars/sale/${id}`;

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
    return { title: 'سيارة | سوق ون' };
  }
}

export default function CarSalePage() {
  return <CarSaleDetailClient />;
}
