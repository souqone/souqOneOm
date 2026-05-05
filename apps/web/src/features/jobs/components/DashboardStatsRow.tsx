'use client';
import React from 'react';
import { Briefcase, Users, CheckCircle, TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
  bgColor: string
}

function StatCard({ label, value, sub, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="card-base rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-on-surface font-tabular">{value}</p>
        <p className="text-xs font-bold text-on-surface-variant mt-0.5">{label}</p>
        {sub && <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

interface DashboardStatsRowProps {
  isEmployer: boolean
  totalPosts: number
  totalProposals: number
  acceptedCount: number
  activeCount: number
}

export default function DashboardStatsRow({
  isEmployer,
  totalPosts,
  totalProposals,
  acceptedCount,
  activeCount,
}: DashboardStatsRowProps) {
  const acceptRate = totalProposals > 0
    ? Math.round((acceptedCount / totalProposals) * 100)
    : 0

  const employerStats: StatCardProps[] = [
    {
      label: 'إعلانات منشورة',
      value: totalPosts,
      icon: Briefcase,
      color: 'text-primary',
      bgColor: 'bg-surface-container-low',
    },
    {
      label: 'إجمالي العروض',
      value: totalProposals,
      sub: 'عبر جميع الإعلانات',
      icon: Users,
      color: 'text-brand-amber',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'عروض مقبولة',
      value: acceptedCount,
      sub: `${acceptRate}% نسبة القبول`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'إعلانات نشطة',
      value: activeCount,
      sub: 'تستقبل عروضاً الآن',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ]

  const driverStats: StatCardProps[] = [
    {
      label: 'عروض مقدمة',
      value: totalProposals,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-surface-container-low',
    },
    {
      label: 'عروض مقبولة',
      value: acceptedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'بانتظار الرد',
      value: activeCount,
      sub: 'لم يُرد عليها بعد',
      icon: Briefcase,
      color: 'text-brand-amber',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'نسبة القبول',
      value: `${acceptRate}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ]

  const stats = isEmployer ? employerStats : driverStats

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(stat => (
        <StatCard key={`stat-card-${stat.label}`} {...stat} />
      ))}
    </div>
  )
}
