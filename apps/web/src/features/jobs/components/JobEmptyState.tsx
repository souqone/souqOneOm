import React from 'react';
import Link from 'next/link';
import { SearchX, Plus } from 'lucide-react';

interface JobEmptyStateProps {
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  onClear?: () => void
}

export default function JobEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  onClear,
}: JobEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
        <SearchX size={28} className="text-on-surface-variant" />
      </div>
      <h3 className="font-bold text-base text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed mb-5">{description}</p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {onClear && (
          <button
            onClick={onClear}
            className="btn-outline text-sm py-2 px-4"
          >
            مسح الفلاتر
          </button>
        )}
        {ctaLabel && ctaHref && (
          <Link href={ctaHref} className="btn-amber text-sm py-2 px-4 flex items-center gap-1.5">
            <Plus size={15} />
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
