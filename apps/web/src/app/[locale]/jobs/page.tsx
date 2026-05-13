'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Briefcase, Star, MapPin } from 'lucide-react';
import JobCard from '@/features/jobs/components/JobCard';
import JobCardSkeleton from '@/features/jobs/components/JobCardSkeleton';
import DriverCard from '@/features/jobs/components/DriverCard';
import { useJobs, useDrivers } from '@/lib/api/jobs';
import SubNavBar from '@/components/layout/SubNavBar';
import type { DriverJob, DriverProfile } from '@/features/jobs/types';

function mapJob(item: Record<string, any>): DriverJob {
  return {
    ...item,
    salary: item.salary ? Number(item.salary) : undefined,
    _count: item._count ?? { applications: 0 },
  } as DriverJob;
}

function mapDriver(item: Record<string, any>): DriverProfile {
  return {
    ...item,
    averageRating: item.averageRating ?? 0,
    reviewCount: item.reviewCount ?? 0,
    completedJobs: item.completedJobs ?? 0,
  } as DriverProfile;
}

export default function LandingPage() {
  const { data: hiringData, isLoading: loadingHiring } = useJobs({ jobType: 'HIRING', limit: '6' });
  const { data: offeringData, isLoading: loadingOffering } = useJobs({ jobType: 'OFFERING', limit: '4' });
  const { data: driversData, isLoading: loadingDrivers } = useDrivers({ isAvailable: 'true', limit: '4' });

  const loading = loadingHiring || loadingOffering || loadingDrivers;
  const hiringJobs = hiringData?.items.map(mapJob) ?? [];
  const offeringJobs = offeringData?.items.map(mapJob) ?? [];
  const featuredDrivers = driversData?.items.map(mapDriver) ?? [];

  return (
    <>
      <SubNavBar />
      {/* Hero */}
      <section
        className="relative overflow-hidden pb-16 md:pb-24"
        style={{ background: 'linear-gradient(135deg, #0B2447 0%, #1a3a6b 60%, #0d3060 100%)' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 text-center" style={{ paddingTop: '85px' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-green-400 motion-safe:animate-pulse-soft inline-block" />
            1,240+ سائق نشط في عُمان
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            بورصة الوظائف للسائقين
            <br />
            <span className="text-[var(--color-brand-amber)]">في سلطنة عُمان</span>
          </h1>
          <p className="text-base md:text-lg text-white/70 mb-8 max-w-xl mx-auto">
            ابحث عن سائق محترف أو أعلن عن خدماتك — الأسرع، الأموثوق، الأشمل
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/jobs/new?type=HIRING"
              className="btn-amber text-base py-3 px-6 w-full sm:w-auto"
            >
              أعلن عن وظيفة
            </Link>
            <Link
              href="/jobs/new?type=OFFERING"
              className="flex items-center justify-center gap-2 border-2 border-white/40 text-white font-bold rounded-xl px-6 py-3 text-base w-full sm:w-auto hover:bg-white/10 transition-all duration-150 active:scale-95"
            >
              أنا سائق — أعلن عن نفسك
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-outline-variant">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-outline-variant">
            {[
              { icon: Users, label: 'سائق نشط', value: '1,240', color: 'text-primary' },
              { icon: Briefcase, label: 'وظيفة منشورة', value: '3,800', color: 'text-brand-amber' },
              { icon: Star, label: 'رضا العملاء', value: '98%', color: 'text-[var(--color-brand-green)]' },
              { icon: MapPin, label: 'تغطية كاملة لعُمان', value: '11', color: 'text-on-surface' },
            ].map(stat => (
              <div key={`stat-${stat.label}`} className="flex flex-col items-center py-5 px-4 text-center">
                <stat.icon size={20} className={`${stat.color} mb-1`} />
                <span className={`text-xl md:text-2xl font-extrabold font-tabular ${stat.color}`}>
                  {stat.value}
                </span>
                <span className="text-xs text-on-surface-variant mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest HIRING Jobs */}
      <section className="py-12">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">أحدث طلبات التوظيف</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">شركات تبحث عن سائقين الآن</p>
            </div>
            <Link
              href="/jobs/browse?type=HIRING"
              className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              عرض الكل
              <ArrowLeft size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={`skel-hiring-${i}`} />)}
            </div>
          ) : hiringJobs.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <Briefcase size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-sm">لا توجد طلبات توظيف حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {hiringJobs.map(job => <JobCard key={`landing-hiring-${job.id}`} job={job} />)}
            </div>
          )}
        </div>
      </section>

      {/* Featured Drivers */}
      <section className="py-12 bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">سائقون متميزون</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">محترفون متاحون للعمل الآن</p>
            </div>
            <Link
              href="/jobs/drivers"
              className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              عرض جميع السائقين
              <ArrowLeft size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={`skel-driver-${i}`} className="card-base rounded-2xl p-4 animate-pulse">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-surface-dim shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 bg-surface-dim rounded-lg" />
                        <div className="h-3 w-20 bg-surface-dim rounded-lg" />
                      </div>
                    </div>
                    <div className="h-9 bg-surface-dim rounded-xl" />
                  </div>
                ))
              : featuredDrivers.map(driver => <DriverCard key={`featured-driver-${driver.id}`} driver={driver} />)
            }
          </div>
        </div>
      </section>

      {/* Latest OFFERING Posts */}
      <section className="py-12">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">سائقون يعرضون خدماتهم</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">يبحثون عن فرصة عمل الآن</p>
            </div>
            <Link
              href="/jobs/browse?type=OFFERING"
              className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              عرض الكل
              <ArrowLeft size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={`skel-offer-${i}`} />)}
            </div>
          ) : offeringJobs.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <Users size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-sm">لا يوجد سائقون يعرضون خدماتهم حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {offeringJobs.map(job => <JobCard key={`landing-offering-${job.id}`} job={job} />)}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <h2 className="text-xl font-extrabold text-on-surface text-center mb-10">كيف يعمل سوق ون؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'أنشئ إعلانك', desc: 'سواء كنت صاحب عمل تبحث عن سائق أو سائق تعرض خدماتك، أنشئ إعلانك في دقيقتين.', color: 'bg-primary' },
              { step: '2', title: 'استقبل العروض', desc: 'الطرف الآخر يتصفح إعلانك ويرسل عرضه مع رسالة تعريفية وتقييماته.', color: 'bg-brand-amber' },
              { step: '3', title: 'تواصل وابدأ', desc: 'اقبل أفضل عرض وتواصل مباشرة عبر الهاتف أو واتساب لإتمام الاتفاق.', color: 'bg-brand-green' },
            ].map(item => (
              <div key={`how-${item.step}`} className="card-base rounded-2xl p-6 text-center">
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white text-xl font-extrabold mx-auto mb-4`}>
                  {item.step}
                </div>
                <h3 className="font-bold text-base text-on-surface mb-2">{item.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="py-14"
        style={{ background: 'linear-gradient(135deg, #0B2447 0%, #1a3a6b 100%)' }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
            انضم لأكبر بورصة سائقين في عُمان
          </h2>
          <p className="text-white/70 text-base mb-6 max-w-md mx-auto">
            أكثر من 1,200 سائق وصاحب عمل يثقون بنا يومياً
          </p>
          <Link href="/jobs/browse" className="btn-amber text-base py-3 px-8 inline-flex">
            ابدأ الآن — مجاناً
          </Link>
        </div>
      </section>
    </>
  )
}
