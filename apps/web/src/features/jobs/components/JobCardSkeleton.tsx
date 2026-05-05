import React from 'react';

export default function JobCardSkeleton() {
  return (
    <div className="card-base rounded-2xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-20 bg-surface-dim rounded-full" />
        <div className="h-6 w-16 bg-surface-dim rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-surface-dim rounded-lg mb-2" />
      <div className="h-4 w-1/2 bg-surface-dim rounded-lg mb-3" />
      <div className="h-4 w-full bg-surface-dim rounded-lg mb-1" />
      <div className="h-4 w-2/3 bg-surface-dim rounded-lg mb-3" />
      <div className="border-t border-outline-variant mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 bg-surface-dim rounded-full" />
        <div className="h-5 w-16 bg-surface-dim rounded-full" />
        <div className="h-5 w-14 bg-surface-dim rounded-full" />
      </div>
      <div className="border-t border-outline-variant mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-surface-dim rounded-lg" />
        <div className="h-5 w-24 bg-surface-dim rounded-lg" />
      </div>
    </div>
  )
}
