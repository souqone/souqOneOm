'use client'

import { MapPin, Briefcase, Clock, Star, ChevronLeft, SendHorizonal, MessageSquare } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// ── Types ────────────────────────────────────────────────────────────────────

export interface JobCardItem {
  id: string
  title: string
  employerName: string
  employerInitials?: string
  employerLogoUrl?: string
  jobType: 'HIRING' | 'OFFERING'
  employmentType?: string
  salary?: number
  salaryPeriod?: string
  currency?: string
  isNegotiable?: boolean
  experienceYears?: number
  governorate?: string
  city?: string
  tags?: string[]
  postedAt: string
  isUrgent?: boolean
  isVerifiedEmployer?: boolean
  // ── Actions (role-aware, passed from parent) ──
  onApply?: () => void
  onChat?: () => void
  applyLabel?: string          // 'تقدم' | 'قبلت' | 'رُفض' | 'انتظار'
  applyVariant?: 'apply' | 'accepted' | 'rejected' | 'pending' | 'closed' | 'owner'
  href: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string, t: ReturnType<typeof useTranslations<'time'>>): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 5) return t('now')
  if (minutes < 60) return t('minutesAgo', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hoursAgo', { count: hours })
  const days = Math.floor(hours / 24)
  if (days === 1) return t('yesterday')
  if (days < 7) return t('daysAgo', { count: days })
  if (days < 14) return t('weekAgo')
  const months = Math.floor(days / 30)
  if (months < 1) return t('weeksAgo', { count: Math.floor(days / 7) })
  if (months === 1) return t('monthAgo')
  return t('monthsAgo', { count: months })
}

// ── Initials Avatar ──────────────────────────────────────────────────────────

function EmployerAvatar({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm'
  if (logoUrl) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={name} className={`${sizeClass} rounded-full object-cover border border-outline-variant/20`} />
  )
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary shrink-0`}>
      {initials}
    </div>
  )
}

// ── Tag Chip ─────────────────────────────────────────────────────────────────

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-bold border border-outline-variant/15 whitespace-nowrap">
      {label}
    </span>
  )
}

// ── JobCard Component ─────────────────────────────────────────────────────────

interface JobCardProps {
  item: JobCardItem
  variant?: 'default' | 'compact'
  className?: string
}

export function JobCard({ item, className = '' }: JobCardProps) {
  const router = useRouter()
  const tj = useTranslations('jobs')
  const tl = useTranslations('listings')
  const tt = useTranslations('time')
  const tp = useTranslations('pages')
  const isHiring = item.jobType === 'HIRING'

  const currency = item.currency ?? 'OMR'
  const currencyLabel = currency === 'OMR' ? tl('currencyUnit') : currency

  const salaryText = item.isNegotiable
    ? tj('salaryNegotiable')
    : null

  return (
    <div
      onClick={() => router.push(item.href)}
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-background border border-outline-variant/20 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-px transition-all duration-200 cursor-pointer ${className}`}
    >
      {/* ── Body ── */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* ── Row 1: Employer + badges ── */}
        <div className="flex items-start gap-3">
          <EmployerAvatar name={item.employerName} logoUrl={item.employerLogoUrl} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-on-surface-variant truncate">{item.employerName}</span>
              {item.isVerifiedEmployer && (
                <span className="material-symbols-outlined text-primary text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${isHiring ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                <Briefcase size={9} />
                {isHiring ? tj('lookingForDriver') : tj('lookingForWork')}
              </span>
              {item.isUrgent && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/10 text-red-500 animate-pulse">
                  ⚡ عاجل
                </span>
              )}
            </div>
          </div>
          <ChevronLeft size={16} className="text-on-surface-variant/30 group-hover:text-primary group-hover:-translate-x-0.5 transition-all shrink-0 mt-1" />
        </div>

        {/* ── Row 2: Job Title ── */}
        <h3 className="text-[15px] font-black text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* ── Row 3: Meta chips ── */}
        <div className="flex flex-wrap gap-1.5">
          {item.employmentType && (
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <Clock size={11} className="text-primary/50" />
              <span>{item.employmentType}</span>
            </div>
          )}
          {item.experienceYears != null && (
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <Star size={11} className="text-primary/50" />
              <span>{tj('yearsExperience', { count: item.experienceYears })}</span>
            </div>
          )}
          {(item.governorate || item.city) && (
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <MapPin size={11} className="text-primary/50" />
              <span>{[item.city, item.governorate].filter(Boolean).join('، ')}</span>
            </div>
          )}
        </div>

        {/* ── Row 4: Tags ── */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {item.tags.map(tag => <Tag key={tag} label={tag} />)}
          </div>
        )}

        <div className="flex-1" />

        {/* ── Divider ── */}
        <hr className="border-outline-variant/15" />

        {/* ── Row 5: Salary + Time ── */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-on-surface-variant/50">{timeAgo(item.postedAt, tt)}</span>
          {salaryText ? (
            <span className="shrink-0 text-[20px] font-black text-primary leading-none">{salaryText}</span>
          ) : item.salary && item.salary > 0 ? (
            <span className="shrink-0 flex items-baseline gap-0.5 text-primary" dir="ltr">
              <span className="text-[10px] font-bold opacity-60">
                {currencyLabel}{item.salaryPeriod ? ` / ${item.salaryPeriod}` : ''}
              </span>
              <span className="text-[20px] font-black leading-none tracking-tight">
                {item.salary.toLocaleString('en-US')}
              </span>
            </span>
          ) : (
            <span className="shrink-0 text-[11px] font-bold text-on-surface-variant">{tl('contactForPrice')}</span>
          )}
        </div>

        {/* ── Row 6: Action Buttons ── */}
        <div className="flex gap-2">
          {/* Apply / Status button */}
          {item.applyVariant === 'apply' && item.onApply && (
            <button
              onClick={e => { e.stopPropagation(); item.onApply!() }}
              className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-on-primary text-[12px] font-bold hover:brightness-110 transition-all active:scale-95"
            >
              <SendHorizonal size={13} />
              <span>{item.applyLabel ?? tp('jobDetailApply')}</span>
            </button>
          )}
          {item.applyVariant === 'accepted' && (
            <div className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl bg-green-500/10 text-green-600 text-[12px] font-bold">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span>{item.applyLabel ?? tp('jobDetailAppAccepted')}</span>
            </div>
          )}
          {item.applyVariant === 'rejected' && (
            <div className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl bg-red-500/10 text-red-500 text-[12px] font-bold">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
              <span>{item.applyLabel ?? tp('jobDetailAppRejected')}</span>
            </div>
          )}
          {item.applyVariant === 'pending' && (
            <div className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl bg-yellow-500/10 text-yellow-600 text-[12px] font-bold">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>{item.applyLabel ?? tp('jobDetailAppPending')}</span>
            </div>
          )}
          {item.applyVariant === 'closed' && (
            <div className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl bg-surface-container text-on-surface-variant/50 text-[12px] font-medium">
              <span className="material-symbols-outlined text-[14px]">block</span>
              <span>{item.applyLabel ?? tp('jobDetailClosedAd')}</span>
            </div>
          )}
          {item.applyVariant === 'owner' && (
            <button
              onClick={e => { e.stopPropagation(); item.onApply?.() }}
              className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[12px] font-bold hover:bg-primary/15 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">people</span>
              <span>{item.applyLabel ?? tp('myJobsApplications')}</span>
            </button>
          )}

          {/* Chat button */}
          {item.onChat && (
            <button
              onClick={e => { e.stopPropagation(); item.onChat!() }}
              className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl border border-outline-variant/20 text-on-surface-variant text-[12px] font-bold hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95"
            >
              <MessageSquare size={13} />
              <span>{tp('jobDetailChat')}</span>
            </button>
          )}

          {/* Fallback: view details link */}
          {!item.applyVariant && !item.onChat && (
            <div
              onClick={e => e.stopPropagation()}
              className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-on-primary text-[12px] font-bold"
            >
              <span>{tp('jobsViewDetails')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
