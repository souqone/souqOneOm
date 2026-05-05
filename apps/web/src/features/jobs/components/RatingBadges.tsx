import React from 'react';
import { Star, Zap, CheckCircle, Briefcase } from 'lucide-react';
import { formatResponseTime } from '@/lib/utils';

interface RatingBadgesProps {
  rating: number
  completionRate?: number
  responseTime?: number
  completedJobs?: number
  size?: 'sm' | 'md'
}

export default function RatingBadges({
  rating,
  completionRate,
  responseTime,
  completedJobs,
  size = 'sm',
}: RatingBadgesProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {rating > 0 && (
        <span className={`flex items-center gap-1 ${textSize} font-bold text-amber-500`}>
          <Star size={iconSize} fill="currentColor" />
          {rating.toFixed(1)}
        </span>
      )}
      {completionRate !== undefined && (
        <span className={`flex items-center gap-1 ${textSize} font-bold text-green-600`}>
          <CheckCircle size={iconSize} />
          {completionRate}% إتمام
        </span>
      )}
      {responseTime !== undefined && (
        <span className={`flex items-center gap-1 ${textSize} font-bold text-blue-600`}>
          <Zap size={iconSize} fill="currentColor" />
          {formatResponseTime(responseTime)}
        </span>
      )}
      {completedJobs !== undefined && completedJobs > 0 && (
        <span className={`flex items-center gap-1 ${textSize} font-bold text-on-surface-variant`}>
          <Briefcase size={iconSize} />
          {completedJobs} عمل
        </span>
      )}
    </div>
  )
}
