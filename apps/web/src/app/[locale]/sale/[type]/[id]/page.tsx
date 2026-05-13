/**
 * Unified Sale Detail Page — Server Component
 * Dynamic route: /sale/[type]/[id]
 * Supports: car, bus, equipment, part, service
 * Provides OG metadata for WhatsApp / social sharing.
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-fetch';
import { getPrimaryImage } from '@/lib/utils/get-primary-image';
import SaleDetailClient from './sale-detail-client';

const API_PATHS: Record<string, string> = {
  car: '/listings',
  bus: '/buses',
  equipment: '/equipment',
  part: '/parts',
  service: '/services',
};

const TYPE_LABELS: Record<string, string> = {
  car: 'سيارة',
  bus: 'باص',
  equipment: 'معدات',
  part: 'قطع غيار',
  service: 'خدمة سيارات',
};

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
  params: Promise<{ locale: string; type: string; id: string }>;
}): Promise<Metadata> {
  const { locale, type, id } = await params;
  const apiPath = API_PATHS[type];

  if (!apiPath) {
    return { title: 'غير موجود | سوق ون' };
  }

  try {
    const data = await serverFetch<OgData>(`${apiPath}/${id}`, { revalidate: 60 });

    const title = data.title || TYPE_LABELS[type] || 'إعلان';
    const price = data.price ? `${Number(data.price).toLocaleString('en-US')} ${data.currency || 'OMR'}` : '';
    const location = data.governorate || '';
    const descParts = [price, location, TYPE_LABELS[type]].filter(Boolean);
    const description = descParts.join(' · ') || title;
    const image = getPrimaryImage(data.images);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://souqone.com';
    const pageUrl = `${appUrl}/${locale}/sale/${type}/${id}`;

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
    return { title: `${TYPE_LABELS[type] || 'إعلان'} | سوق ون` };
  }
}

export default async function SalePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (type === 'car') redirect(`/cars/sale/${id}`);
  return <SaleDetailClient />;
}
