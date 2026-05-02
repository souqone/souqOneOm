'use client';

import { useTranslations } from 'next-intl';
import { RecommendationCard } from '../cards/RecommendationCard';
import { DriverEmptyState } from '../empty/DriverEmptyState';
import type { JobItem } from '@/lib/api/jobs';

interface DriverRecommendationsTabProps {
  recommendations: (JobItem & { matchScore?: number })[];
  isLoading: boolean;
}

export function DriverRecommendationsTab({ recommendations, isLoading }: DriverRecommendationsTabProps) {
  const tp = useTranslations('pages');

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-3 flex items-center gap-3" aria-hidden>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-36 rounded-full bg-surface-container-high animate-pulse" />
              <div className="h-2.5 w-24 rounded-full bg-surface-container-high animate-pulse" />
            </div>
            <div className="w-10 h-8 rounded bg-surface-container-high animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <DriverEmptyState
        icon="search_off"
        title={tp('noRecsTitle')}
        desc={tp('noRecsDesc')}
        actionLabel={tp('browseJobs')}
        actionHref="/jobs"
      />
    );
  }

  return (
    <div className="space-y-2">
      {recommendations.map((rec) => (
        <RecommendationCard key={rec.id} rec={rec} />
      ))}
    </div>
  );
}
