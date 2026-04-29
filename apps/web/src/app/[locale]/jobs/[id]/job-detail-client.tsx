'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/navigation';
import { Share2, MessageCircle, Phone, Trash2, Send, MapPin, Briefcase, Clock, Eye, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useJob, useApplyToJob, useDeleteJob, useCreateConversation } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useRequireJobProfile } from '@/hooks/use-require-job-profile';
import { useToast } from '@/components/toast';
import { employmentLabelsT } from '@/lib/constants/jobs';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel, resolveCityLabel } from '@/lib/location-data';
import { clsx } from 'clsx';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diffDays < 7) return rtf.format(-diffDays, 'day');
  if (diffDays < 30) return rtf.format(-Math.floor(diffDays / 7), 'week');
  return rtf.format(-Math.floor(diffDays / 30), 'month');
}

function SectionTitle({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-on-surface tracking-tight">{children}</h2>
        <div className="mt-1.5 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/30" />
      </div>
    </div>
  );
}

function ExpandableText({ text, expandLabel, collapseLabel }: { text: string; expandLabel: string; collapseLabel: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 300;
  if (text.length <= maxLength) {
    return <p className="text-[14px] text-on-surface-variant leading-relaxed whitespace-pre-line">{text}</p>;
  }
  const displayText = expanded ? text : text.slice(0, maxLength) + '...';
  return (
    <div>
      <p className="text-[14px] text-on-surface-variant leading-relaxed whitespace-pre-line">{displayText}</p>
      <button onClick={() => setExpanded(!expanded)} className="mt-3 text-[13px] text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-colors">
        {expanded ? collapseLabel : expandLabel}
        <span className="material-symbols-outlined text-sm">{expanded ? 'expand_less' : 'expand_more'}</span>
      </button>
    </div>
  );
}

// ── Whatsapp SVG ─────────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function JobDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { requireProfile } = useRequireJobProfile();
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const tj = useTranslations('jobs');
  const locale = useLocale();

  // Safely get translations with fallbacks
  const tShare = tp.has('jobDetailShare') ? tp('jobDetailShare') : 'مشاركة';
  const tCall = tp.has('jobDetailCall') ? tp('jobDetailCall') : 'اتصال';
  const tClosed = tp.has('jobDetailClosedAd') ? tp('jobDetailClosedAd') : 'هذا الإعلان مغلق';
  const tExpired = tp.has('jobDetailExpired') ? tp('jobDetailExpired') : 'هذا الإعلان منتهي';

  const jobTypeLabels: Record<string, { label: string; color: string; border: string }> = {
    OFFERING: { label: tp('jobDetailOffering'), color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
    HIRING: { label: tp('jobDetailHiring'), color: 'bg-primary/10 text-primary dark:text-primary', border: 'border-primary/20' },
  };
  const salaryPeriodLabels: Record<string, string> = {
    DAILY: tp('jobDetailPerDay'), MONTHLY: tp('jobDetailPerMonth'), YEARLY: tp('jobDetailPerYear'), NEGOTIABLE: tp('jobDetailNegotiable'),
  };
  const licenseLabels: Record<string, string> = {
    LIGHT: tp('jobDetailLicLight'), HEAVY: tp('jobDetailLicHeavy'), TRANSPORT: tp('jobDetailLicTransport'), BUS: tp('jobDetailLicBus'), MOTORCYCLE: tp('jobDetailLicMotorcycle'),
  };
  const languageLabels: Record<string, string> = {
    ARABIC: tp('jobDetailLangArabic'), ENGLISH: tp('jobDetailLangEnglish'), URDU: tp('jobDetailLangUrdu'), HINDI: tp('jobDetailLangHindi'), BENGALI: tp('jobDetailLangBengali'), FILIPINO: tp('jobDetailLangFilipino'),
  };
  const vehicleTypeLabels: Record<string, string> = {
    SEDAN: tp('jobDetailVtSedan'), SUV: tp('jobDetailVtSUV'), LIGHT_TRUCK: tp('jobDetailVtLightTruck'), HEAVY_TRUCK: tp('jobDetailVtHeavyTruck'), BUS: tp('jobDetailVtBus'), LIMO: tp('jobDetailVtLimo'), VAN: tp('jobDetailVtVan'), PICKUP: tp('jobDetailVtPickup'),
  };

  const { data: job, isLoading, isError } = useJob(id);
  const applyMutation = useApplyToJob();
  const deleteMutation = useDeleteJob();
  const createConv = useCreateConversation();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = !!(user && job?.user.id === user.id);

  const handleMessage = useCallback(() => {
    requireProfile('any', async () => {
      if (!job) return;
      try {
        const conv = await createConv.mutateAsync({ entityType: 'JOB', entityId: job.id });
        router.push(`/messages/${conv.id}`);
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : tp('jobDetailErrorConversation'));
      }
    });
  }, [job, createConv, router, addToast, tp, requireProfile]);

  const handleApply = useCallback(() => {
    requireProfile('driver', async () => {
      try {
        await applyMutation.mutateAsync({ jobId: id, message: applyMessage || undefined });
        addToast('success', tp('jobDetailApplySuccess'));
        setShowApplyModal(false);
        setApplyMessage('');
      } catch (err: any) {
        addToast('error', err?.message || tp('jobDetailApplyFail'));
      }
    });
  }, [id, applyMessage, applyMutation, addToast, tp, requireProfile]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('success', tp('jobDetailDeleted'));
      router.push('/jobs/my');
    } catch (err: any) {
      addToast('error', err?.message || tp('jobDetailDeleteFail'));
    }
  }, [id, deleteMutation, addToast, router, tp]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: job?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      addToast('success', tp('jobDetailLinkCopied'));
    }
  }, [job?.title, addToast]);

  const handleWhatsApp = useCallback(() => {
    if (!job?.whatsapp) return;
    const phone = job.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(job.title)}`, '_blank');
  }, [job?.whatsapp, job?.title]);

  const handleCall = useCallback(() => {
    if (!job?.contactPhone) return;
    window.location.href = `tel:${job.contactPhone}`;
  }, [job?.contactPhone]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-20">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-surface-container-low rounded-xl w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
              <div className="space-y-6">
                <div className="h-40 bg-surface-container-low rounded-3xl" />
                <div className="h-64 bg-surface-container-low rounded-3xl" />
              </div>
              <div className="h-96 bg-surface-container-low rounded-3xl hidden lg:block" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Error state ──
  if (isError || !job) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 md:px-8 pt-32 pb-20 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/50">search_off</span>
          </div>
          <p className="text-2xl font-bold mb-6 text-on-surface">{tp('jobDetailNotFound')}</p>
          <Link
            href="/browse/jobs"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            {tp('jobDetailBackToJobs')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const typeInfo = jobTypeLabels[job.jobType] ?? { label: job.jobType, color: 'bg-surface-container-highest text-on-surface', border: 'border-outline-variant/20' };
  const sellerName = job.user.displayName || job.user.username;
  const relativeDate = formatRelativeTime(job.createdAt, locale);
  const hasWhatsApp = Boolean(job.whatsapp);
  const hasPhone = Boolean(job.contactPhone);
  const hasEmail = Boolean(job.contactEmail);
  const locationText = [resolveCityLabel(job.city, locale), resolveLocationLabel(job.governorate, locale)].filter(Boolean).join('، ');

  return (
    <div className="bg-surface min-h-screen relative overflow-hidden">
      {/* Soft Background Blurs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-[20%] right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3" />
      
      <Navbar />
      
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 pb-20 relative z-10">

        {/* ══ A — TOP BAR: Breadcrumb + Share/Save ══ */}
        <div className="flex items-center justify-between mb-8 bg-surface-container-lowest/60 backdrop-blur-md p-3 px-5 rounded-2xl border border-outline-variant/20 shadow-sm">
          <nav className="flex items-center gap-2 text-[13px] font-medium text-on-surface-variant flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              {tp('jobDetailHome')}
            </Link>
            <span className="material-symbols-outlined text-[14px] opacity-50">chevron_left</span>
            <Link href="/browse/jobs" className="hover:text-primary transition-colors">{tp('jobDetailBreadcrumb')}</Link>
            <span className="material-symbols-outlined text-[14px] opacity-50">chevron_left</span>
            <span className="text-on-surface truncate max-w-[140px] sm:max-w-[200px]">{job.title}</span>
          </nav>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[13px] font-bold text-on-surface transition-all duration-200 active:scale-95"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">{tShare}</span>
          </button>
        </div>

        {/* ══ B — STATUS BANNER ══ */}
        {job.status && !['ACTIVE'].includes(job.status) && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50/80 backdrop-blur-md border border-red-200/60 shadow-sm text-red-700 text-[14px] font-bold animate-in fade-in">
            <AlertTriangle className="shrink-0" size={20} />
            {job.status === 'CLOSED' ? tClosed : tExpired}
          </div>
        )}

        {/* ══ C — TWO-COLUMN LAYOUT ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">

          {/* ════ LEFT COLUMN (Main Content) ════ */}
          <div className="space-y-6">
            
            {/* Title Card */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border tracking-wide",
                  typeInfo.color, typeInfo.border
                )}>
                  <Briefcase size={14} />
                  {typeInfo.label}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/30 tracking-wide">
                  <Clock size={14} />
                  {employmentLabelsT(tj)[job.employmentType] ?? job.employmentType}
                </span>
              </div>

              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-on-surface leading-tight tracking-tight mb-5">
                {job.title}
              </h1>

              <div className="flex items-center gap-4 text-[13px] text-on-surface-variant font-medium flex-wrap">
                <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
                  <MapPin size={16} className="text-primary" />
                  <span>{locationText}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
                  <Eye size={16} className="text-primary" />
                  <span>{job.viewCount} {tp('jobDetailViews')}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                  <span>{relativeDate}</span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            {job.description && (
              <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm">
                <SectionTitle icon={<span className="material-symbols-outlined">description</span>}>
                  {tp('jobDetailDescription')}
                </SectionTitle>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-on-surface-variant">
                  <ExpandableText text={job.description} expandLabel={tp('jobDetailShowMore')} collapseLabel={tp('jobDetailShowLess')} />
                </div>
              </div>
            )}

            {/* Requirements Bento Grid */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm">
              <SectionTitle icon={<span className="material-symbols-outlined">fact_check</span>}>
                {tp('jobDetailRequirements')}
              </SectionTitle>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {job.licenseTypes.length > 0 && (
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20 hover:border-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant font-medium">{tp('jobDetailLicenseType')}</p>
                    <p className="text-[14px] font-bold text-on-surface leading-tight">
                      {job.licenseTypes.map(lt => licenseLabels[lt] ?? lt).join('، ')}
                    </p>
                  </div>
                )}
                
                {job.experienceYears != null && (
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20 hover:border-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                      <span className="material-symbols-outlined text-[18px]">history</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant font-medium">{tp('jobDetailExperience')}</p>
                    <p className="text-[14px] font-bold text-on-surface leading-tight">
                      {tp('jobDetailExperienceYears', { years: job.experienceYears })}
                    </p>
                  </div>
                )}

                {(job.minAge || job.maxAge) && (
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20 hover:border-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                      <span className="material-symbols-outlined text-[18px]">cake</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant font-medium">{tp('jobDetailAge')}</p>
                    <p className="text-[14px] font-bold text-on-surface leading-tight" dir="ltr">
                      {job.minAge && job.maxAge ? `${job.minAge} - ${job.maxAge}` : job.minAge ? `+${job.minAge}` : `-${job.maxAge}`}
                    </p>
                  </div>
                )}

                {job.languages.length > 0 && (
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20 hover:border-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                      <span className="material-symbols-outlined text-[18px]">translate</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant font-medium">{tp('jobDetailLanguages')}</p>
                    <p className="text-[14px] font-bold text-on-surface leading-tight">
                      {job.languages.map(l => languageLabels[l] ?? l).join('، ')}
                    </p>
                  </div>
                )}

                {job.nationality && (
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20 hover:border-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                      <span className="material-symbols-outlined text-[18px]">flag</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant font-medium">{tp('jobDetailNationality')}</p>
                    <p className="text-[14px] font-bold text-on-surface leading-tight">
                      {job.nationality}
                    </p>
                  </div>
                )}

                {job.vehicleTypes.length > 0 && (
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20 hover:border-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                      <span className="material-symbols-outlined text-[18px]">directions_car</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant font-medium">{tp('jobDetailVehicleTypes')}</p>
                    <p className="text-[14px] font-bold text-on-surface leading-tight">
                      {job.vehicleTypes.map(v => vehicleTypeLabels[v] ?? v).join('، ')}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/20 hover:border-primary/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <span className="material-symbols-outlined text-[18px]">garage</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant font-medium">{tp('jobDetailHasOwnVehicle')}</p>
                  <p className="text-[14px] font-bold text-on-surface leading-tight">
                    {job.hasOwnVehicle ? tp('jobDetailYes') : tp('jobDetailNo')}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info Card (Mobile mostly, but visible if applicable) */}
            {(hasPhone || hasEmail) && (
              <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm block lg:hidden">
                <SectionTitle icon={<span className="material-symbols-outlined">contact_phone</span>}>
                  {tp('jobDetailContactInfo')}
                </SectionTitle>
                <div className="flex flex-col gap-3">
                  {hasPhone && (
                    <a href={`tel:${job.contactPhone}`} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container border border-outline-variant/20 hover:border-primary/40 group transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                          <Phone size={18} />
                        </div>
                        <span className="text-[14px] font-bold text-on-surface">{tCall}</span>
                      </div>
                      <span className="text-[14px] font-bold text-on-surface-variant" dir="ltr">{job.contactPhone}</span>
                    </a>
                  )}
                  {hasEmail && (
                    <a href={`mailto:${job.contactEmail}`} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container border border-outline-variant/20 hover:border-primary/40 group transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[18px]">mail</span>
                        </div>
                        <span className="text-[14px] font-bold text-on-surface">{tp('jobDetailEmail')}</span>
                      </div>
                      <span className="text-[13px] font-bold text-on-surface-variant max-w-[150px] truncate">{job.contactEmail}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN — Sticky Salary Card (Desktop) & CTA Mobile ════ */}
          <div className="sticky top-6 flex flex-col gap-6">
            
            {/* The Main Action Card */}
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
              
              {/* Salary Section (Gradient Top) */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-b border-outline-variant/10">
                <p className="text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">{tp('jobDetailOfferedSalary')}</p>
                {job.salary ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-end gap-2 flex-wrap" dir="ltr">
                      <span className="text-3xl md:text-4xl font-black text-red-600 leading-none tracking-tight drop-shadow-sm">
                        {Number(job.salary).toLocaleString('en-US')}
                      </span>
                      <span className="text-base font-bold text-on-surface-variant mb-1">{job.currency || 'OMR'}</span>
                    </div>
                    {job.salaryPeriod && (
                      <span className="text-[14px] font-semibold text-on-surface-variant mt-1">
                        / {salaryPeriodLabels[job.salaryPeriod]}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xl font-black text-on-surface drop-shadow-sm">{tp('jobDetailNegotiable') || 'قابل للتفاوض'}</p>
                )}
              </div>

              {/* Seller & CTA Section */}
              <div className="p-6 md:p-8 flex flex-col gap-6">
                
                {/* SELLER */}
                <Link href={`/seller/${job.user.id}`} className="flex items-center gap-4 group hover:bg-surface-container/50 p-3 -mx-3 rounded-2xl transition-colors">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container shadow-sm group-hover:border-primary/50 transition-colors">
                      {job.user.avatarUrl ? (
                        <Image src={job.user.avatarUrl} alt={sellerName} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                          <span className="text-white font-black text-xl">{sellerName[0]?.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-surface-container-lowest rounded-full shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {sellerName}
                    </p>
                    <p className="text-[13px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <MapPin size={12} />
                      {job.user.governorate ? resolveLocationLabel(job.user.governorate, locale) : tp('jobDetailDefaultLocation')}
                    </p>
                  </div>
                </Link>

                {/* CTA BUTTONS */}
                <div className="flex flex-col gap-3">
                  {isOwner ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/jobs/my"
                        className="h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        {tp('jobDetailManageListings')}
                      </Link>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="h-12 rounded-xl bg-error/10 text-error border border-error/20 text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-error/20 transition-all"
                      >
                        <Trash2 size={18} />
                        {tp('jobDetailDelete')}
                      </button>
                    </div>
                  ) : job.status === 'ACTIVE' ? (
                    <>
                      <button
                        onClick={() => requireProfile('driver', () => setShowApplyModal(true))}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_8px_25px_rgb(37,99,235,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
                      >
                        <Send size={18} />
                        {tp('jobDetailApply')}
                      </button>
                      
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <button
                          onClick={handleMessage}
                          disabled={createConv.isPending}
                          className="h-12 rounded-xl bg-surface-container border border-outline-variant/20 text-on-surface text-[14px] font-bold flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-60 shadow-sm"
                        >
                          <MessageCircle size={16} />
                          {createConv.isPending ? '...' : tp('jobDetailChat')}
                        </button>
                        
                        {hasWhatsApp ? (
                          <button
                            onClick={handleWhatsApp}
                            className="h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 transition-all shadow-sm"
                          >
                            <WhatsAppIcon />
                            {tp('jobDetailWhatsapp')}
                          </button>
                        ) : hasPhone ? (
                          <button
                            onClick={handleCall}
                            className="h-12 rounded-xl bg-surface-container border border-outline-variant/20 text-on-surface text-[14px] font-bold flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
                          >
                            <Phone size={16} />
                            {tCall}
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-14 rounded-2xl bg-surface-container border border-outline-variant/20 text-on-surface-variant text-[14px] font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                      <span className="material-symbols-outlined text-[18px]">block</span>
                      {tClosed}
                    </div>
                  )}
                </div>

              </div>
            </div>
            
            {/* Desktop only secondary contact info */}
            {(hasPhone || hasEmail) && !isOwner && (
              <div className="hidden lg:block rounded-3xl border border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-md p-6 shadow-sm">
                <h3 className="text-[14px] font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">contact_support</span>
                  {tp('jobDetailDirectContact')}
                </h3>
                <div className="flex flex-col gap-3">
                  {hasPhone && (
                    <a href={`tel:${job.contactPhone}`} className="flex items-center justify-between p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors group">
                      <span className="text-[13px] text-on-surface-variant font-medium group-hover:text-primary transition-colors">{tCall}</span>
                      <span className="text-[14px] font-bold text-on-surface" dir="ltr">{job.contactPhone}</span>
                    </a>
                  )}
                  {hasEmail && (
                    <a href={`mailto:${job.contactEmail}`} className="flex items-center justify-between p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors group">
                      <span className="text-[13px] text-on-surface-variant font-medium group-hover:text-primary transition-colors">البريد</span>
                      <span className="text-[13px] font-bold text-on-surface max-w-[150px] truncate">{job.contactEmail}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ══ APPLY MODAL ══ */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-6 border-b border-outline-variant/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Send size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface tracking-tight">{tp('jobDetailApplyModalTitle')}</h3>
                  <p className="text-sm text-on-surface-variant mt-1 font-medium">{job.title}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-[13px] font-bold text-on-surface mb-2">رسالة التقديم (اختياري)</label>
              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder={tp('jobDetailApplyPlaceholder')}
                className="w-full rounded-2xl bg-surface-container border border-outline-variant/30 p-4 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-[14px] min-h-[140px] resize-none transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
            <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/10 flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 h-12 rounded-xl border border-outline-variant/30 text-on-surface text-[14px] font-bold hover:bg-surface-container transition-all duration-150"
              >
                {tp('jobDetailApplyCancel')}
              </button>
              <button
                onClick={handleApply}
                disabled={applyMutation.isPending}
                className="flex-[2] h-12 rounded-xl bg-primary text-on-primary text-[14px] font-bold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {applyMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {applyMutation.isPending ? tp('jobDetailApplySending') : tp('jobDetailApplySend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRMATION MODAL ══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-6 border-b border-outline-variant/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Trash2 size={24} className="text-error" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface tracking-tight">{tp('jobDetailDeleteConfirm')}</h3>
                  <p className="text-sm text-on-surface-variant mt-1 font-medium">{tp('jobDetailDelete')}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="p-4 rounded-2xl bg-error/5 border border-error/10 text-[14px] text-error/90 font-medium leading-relaxed">
                هل أنت متأكد من حذف هذه الوظيفة بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح جميع بيانات التقديم المرتبطة بها.
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/10 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-outline-variant/30 text-on-surface text-[14px] font-bold hover:bg-surface-container transition-all duration-150"
              >
                {tp('jobDetailApplyCancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-[2] h-12 rounded-xl bg-error text-on-error text-[14px] font-bold hover:bg-error/90 active:scale-[0.98] transition-all shadow-md shadow-error/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
                {tp('jobDetailDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
