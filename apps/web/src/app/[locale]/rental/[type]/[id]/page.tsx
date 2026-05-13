/**
 * Rental Detail Page - Server Component
 * Provides OG metadata for WhatsApp / social sharing.
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-fetch';
import { getPrimaryImage } from '@/lib/utils/get-primary-image';
import RentalDetailClient from './rental-detail-client';

const API_PATHS: Record<string, string> = {
  car: '/listings',
  bus: '/buses',
  equipment: '/equipment',
};

const TYPE_LABELS: Record<string, string> = {
  car: 'سيارة للإيجار',
  bus: 'باص للإيجار',
  equipment: 'معدات للإيجار',
};

interface RentalOgData {
  title?: string;
  description?: string;
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
  params: Promise<{ locale: string; type: string; id: string }>;
}): Promise<Metadata> {
  const { locale, type, id } = await params;
  const apiPath = API_PATHS[type];

  if (!apiPath) {
    return { title: 'غير موجود | سوق ون' };
  }

  try {
    const data = await serverFetch<RentalOgData>(`${apiPath}/${id}`, { revalidate: 60 });

    const title = data.title || TYPE_LABELS[type] || 'إيجار';
    const daily = data.dailyPrice ? `${Number(data.dailyPrice).toLocaleString('en-US')} ${data.currency || 'OMR'}/يوم` : '';
    const monthly = data.monthlyPrice ? `${Number(data.monthlyPrice).toLocaleString('en-US')} ${data.currency || 'OMR'}/شهر` : '';
    const location = data.governorate || '';
    const priceInfo = daily || monthly || (data.price ? `${Number(data.price).toLocaleString('en-US')} ${data.currency || 'OMR'}` : '');
    const descParts = [priceInfo, location, TYPE_LABELS[type]].filter(Boolean);
    const description = descParts.join(' · ') || title;
    const image = getPrimaryImage(data.images);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://souqone.com';
    const pageUrl = `${appUrl}/${locale}/rental/${type}/${id}`;

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
    return { title: `${TYPE_LABELS[type] || 'إيجار'} | سوق ون` };
  }
}

export default async function RentalPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (type === 'car') redirect(`/cars/rental/${id}`);
  return <RentalDetailClient />;
}