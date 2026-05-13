'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const tp = useTranslations('pages');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-8">
      <span className="material-symbols-outlined text-8xl text-outline mb-6">explore_off</span>
      <h1 className="text-5xl font-extrabold text-on-surface mb-3">404</h1>
      <p className="text-xl text-on-surface-variant mb-8">{tp('notFoundMessage')}</p>
      <div className="flex gap-4">
        <Link href="/" className="bg-primary text-on-primary hover:brightness-110 rounded-lg shadow-ambient px-8 py-3 text-sm font-bold">
          {tp('notFoundHome')}
        </Link>
        <Link href="/cars/browse" className="border border-outline-variant rounded-full px-8 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-all">
          {tp('notFoundBrowse')}
        </Link>
      </div>
    </div>
  );
}
