/**
 * Job Detail Page  Server Component
 * Provides OG metadata for WhatsApp / social sharing.
 */

import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-fetch';
import JobDetailClient from './job-detail-client';

interface JobOgData {
  title?: string;
  description?: string;
  salary?: string | number;
  salaryPeriod?: string;
  governorate?: string;
  jobType?: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  OFFERING: 'يبحث عن عمل',
  HIRING: 'مطلوب للتوظيف',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;

  try {
    const data = await serverFetch<JobOgData>(`/jobs/${id}`, { revalidate: 60 });

    const title = data.title || 'وظيفة';
    const jobTypeLabel = JOB_TYPE_LABELS[data.jobType || ''] || '';
    const salary = data.salary ? `${Number(data.salary).toLocaleString('en-US')} ر.ع` : '';
    const location = data.governorate || '';
    const descParts = [jobTypeLabel, salary, location].filter(Boolean);
    const description = descParts.join(' · ') || title;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://souqone.com';
    const pageUrl = `${appUrl}/${locale}/jobs/${id}`;

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
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  } catch {
    return { title: 'وظيفة | سوق ون' };
  }
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}