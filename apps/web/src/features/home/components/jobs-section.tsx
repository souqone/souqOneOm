'use client';

import { useRef, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import JobCard from '@/features/jobs/components/JobCard';
import JobCardSkeleton from '@/features/jobs/components/JobCardSkeleton';
import type { JobItem } from '@/lib/api';
import type { DriverJob } from '@/features/jobs/types';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

function toDriverJob(item: JobItem): DriverJob {
  return {
    id: item.id,
    userId: item.user?.id ?? '',
    user: {
      id: item.user?.id ?? '',
      username: item.user?.username ?? '',
      displayName: item.user?.displayName ?? undefined,
      avatarUrl: item.user?.avatarUrl ?? undefined,
      isVerified: item.user?.isVerified ?? false,
    },
    title: item.title,
    slug: item.slug,
    description: item.description,
    jobType: item.jobType,
    employmentType: item.employmentType,
    salary: item.salary ? Number(item.salary) : undefined,
    salaryPeriod: item.salaryPeriod ?? undefined,
    currency: item.currency,
    licenseTypes: item.licenseTypes as DriverJob['licenseTypes'],
    experienceYears: item.experienceYears ?? undefined,
    minAge: item.minAge ?? undefined,
    maxAge: item.maxAge ?? undefined,
    languages: item.languages,
    nationality: item.nationality ?? undefined,
    vehicleTypes: item.vehicleTypes,
    hasOwnVehicle: item.hasOwnVehicle,
    governorate: item.governorate,
    city: item.city ?? undefined,
    contactPhone: item.contactPhone ?? undefined,
    contactEmail: item.contactEmail ?? undefined,
    whatsapp: item.whatsapp ?? undefined,
    status: item.status as DriverJob['status'],
    viewCount: item.viewCount,
    _count: item._count ?? { applications: 0 },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

interface JobsSectionProps {
  items: JobItem[];
  isLoading: boolean;
}

export function JobsSection({ items, isLoading }: JobsSectionProps) {
  const t = useTranslations('home');
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = trackRef.current
    if (!el) return
    dragRef.current = { isDragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.isDragging) return
    const el = trackRef.current
    if (!el) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = dragRef.current.scrollLeft - (x - dragRef.current.startX) * 1.5
  }, [])

  const onMouseUp = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    dragRef.current.isDragging = false
    el.style.cursor = 'grab'
    el.style.userSelect = ''
  }, [])

  return (
    <section className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <AnimatedSection>
          <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-6 sm:h-8 w-1 bg-primary" />
                <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('driverJobs')}</h2>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">{t('driverJobsDesc')}</p>
            </div>
            <Link href="/jobs" className="text-primary font-bold text-xs sm:text-sm hover:underline transition-colors shrink-0">
              {t('viewAll')}
            </Link>
          </motion.div>

          <motion.div variants={fadeUp}>
            {isLoading ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-[78vw] sm:w-[300px] md:w-[280px] shrink-0">
                    <JobCardSkeleton />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">work_off</span>
                <p className="font-medium">{t('noJobsNow')}</p>
              </div>
            ) : (
              <div
                ref={trackRef}
                className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                {items.slice(0, 8).map(item => (
                  <div key={item.id} className="w-[82vw] sm:w-[36vw] lg:w-[268px] xl:w-[341px] shrink-0 flex flex-col">
                    <JobCard job={toDriverJob(item)} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
