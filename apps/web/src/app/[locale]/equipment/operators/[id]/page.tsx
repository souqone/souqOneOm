'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { Share2, MessageCircle, Phone, MapPin, Briefcase, Clock, Eye } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useOperatorListing } from '@/lib/api/equipment';
import { useCreateConversation } from '@/lib/api/chat';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/toast';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel, resolveCityLabel } from '@/lib/location-data';


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

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const locale = useLocale();
  const { data: op, isLoading, error } = useOperatorListing(id);
  const createConv = useCreateConversation();

  const OPERATOR_TYPE_LABELS: Record<string, string> = {
    DRIVER: tp('opDetailDriver'), OPERATOR: tp('opDetailOperator'), TECHNICIAN: tp('opDetailTechnician'), MAINTENANCE: tp('opDetailMaintenance'),
  };
  const EQUIP_TYPE_LABELS: Record<string, string> = {
    EXCAVATOR: tp('equipDetailExcavator'), CRANE: tp('equipDetailCrane'), LOADER: tp('equipDetailLoader'), BULLDOZER: tp('equipDetailBulldozer'), FORKLIFT: tp('equipDetailForklift'),
    CONCRETE_MIXER: tp('equipDetailConcreteMixer'), GENERATOR: tp('equipDetailGenerator'), COMPRESSOR: tp('equipDetailCompressor'),
    SCAFFOLDING: tp('equipDetailScaffolding'), WELDING_MACHINE: tp('equipDetailWeldingMachine'), TRUCK: tp('equipDetailTruck'), DUMP_TRUCK: tp('equipDetailDumpTruck'),
    WATER_TANKER: tp('equipDetailWaterTanker'), LIGHT_EQUIPMENT: tp('equipDetailLightEquipment'), OTHER_EQUIPMENT: tp('equipDetailOther'),
  };

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: op?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      addToast('success', tp('opDetailLinkCopied'));
    }
  }, [op?.title, addToast, tp]);

  const handleChat = async () => {
    if (!user) { addToast('error', tp('opDetailLoginFirst')); return; }
    try {
      const conv = await createConv.mutateAsync({ entityType: 'OPERATOR_LISTING', entityId: op!.id });
      router.push(`/messages/${conv.id}`);
    } catch { addToast('error', tp('opDetailErrorConversation')); }
  };

  if (isLoading) return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="pt-28 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </div>
  );

  if (error || !op) return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="pt-28 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">search_off</span>
        </div>
        <p className="text-xl font-bold text-on-surface">{tp('opDetailNotFound')}</p>
        <Link href="/equipment" className="mt-4 bg-primary text-on-primary px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          {tp('opDetailBack')}
        </Link>
      </div>
    </div>
  );

  const isOwner = user?.id === op.userId;
  const rateValue = op.dailyRate ? Number(op.dailyRate).toLocaleString('en-US') : op.hourlyRate ? Number(op.hourlyRate).toLocaleString('en-US') : null;
  const rate = op.dailyRate ? tp('opDetailRateDaily', { rate: Number(op.dailyRate).toLocaleString('en-US'), currency: op.currency }) : op.hourlyRate ? tp('opDetailRateHourly', { rate: Number(op.hourlyRate).toLocaleString('en-US'), currency: op.currency }) : tp('opDetailRateContact');
  const relativeDate = formatRelativeTime(op.createdAt, locale);
  const locationText = [resolveCityLabel(op.city, locale), resolveLocationLabel(op.governorate, locale)].filter(Boolean).join('، ');
  const isActive = op.status === 'ACTIVE';

  return (
    <div className="bg-surface min-h-screen relative overflow-hidden">
      {/* Soft Background Blurs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-[20%] right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3" />
      
      <Navbar />
      
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 pb-20 relative z-10">
        {/* ══ A — TOP BAR ══ */}
        <div className="flex items-center justify-between mb-8 bg-surface-container-lowest/60 backdrop-blur-md p-3 px-5 rounded-2xl border border-outline-variant/20 shadow-sm">
          <nav className="flex items-center gap-2 text-[13px] font-medium text-on-surface-variant flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              {tp('opDetailHome')}
            </Link>
            <span className="material-symbols-outlined text-[14px] opacity-50">chevron_left</span>
            <Link href="/equipment" className="hover:text-primary transition-colors">{tp('opDetailEquipment')}</Link>
            <span className="material-symbols-outlined text-[14px] opacity-50">chevron_left</span>
            <span className="text-on-surface truncate max-w-[140px] sm:max-w-[200px]">{op.title}</span>
          </nav>
          
          <button onClick={handleShare} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[13px] font-bold text-on-surface transition-all duration-200 active:scale-95">
            <Share2 size={16} />
            <span className="hidden sm:inline">{tp.has('opDetailShare') ? tp('opDetailShare') : 'مشاركة'}</span>
          </button>
        </div>

        {/* ══ STATUS BANNER ══ */}
        {!isActive && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50/80 backdrop-blur-md border border-red-200/60 shadow-sm text-red-700 text-[14px] font-bold">
            <span className="material-symbols-outlined shrink-0">warning</span>
            {tp.has('opDetailClosed') ? tp('opDetailClosed') : 'هذا الإعلان مغلق'}
          </div>
        )}

        {/* ══ B — TWO-COLUMN LAYOUT ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-6">
            {/* Title Card */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border tracking-wide bg-primary/10 text-primary border-primary/20">
                  <Briefcase size={14} />
                  {OPERATOR_TYPE_LABELS[op.operatorType]}
                </span>
                {op.experienceYears && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/30 tracking-wide">
                    <span className="material-symbols-outlined text-[14px]">history</span>
                    {tp('opDetailExperience', { years: op.experienceYears })}
                  </span>
                )}
                {op.user.isVerified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 tracking-wide">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    {tp.has('opDetailVerified') ? tp('opDetailVerified') : 'موثق'}
                  </span>
                )}
              </div>

              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-on-surface leading-tight tracking-tight mb-5">
                {op.title}
              </h1>

              <div className="flex items-center gap-4 text-[13px] text-on-surface-variant font-medium flex-wrap">
                <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
                  <MapPin size={16} className="text-primary" />
                  <span>{locationText}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
                  <Eye size={16} className="text-primary" />
                  <span>{op.viewCount} {tp('opDetailViews')}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
                  <Clock size={16} className="text-primary" />
                  <span>{relativeDate}</span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            {op.description && (
              <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm">
                <SectionTitle icon={<span className="material-symbols-outlined">description</span>}>
                  {tp.has('opDetailDescription') ? tp('opDetailDescription') : 'الوصف'}
                </SectionTitle>
                <ExpandableText 
                  text={op.description} 
                  expandLabel={tp.has('opDetailShowMore') ? tp('opDetailShowMore') : 'عرض المزيد'} 
                  collapseLabel={tp.has('opDetailShowLess') ? tp('opDetailShowLess') : 'عرض أقل'} 
                />
              </div>
            )}

            {/* Skills & Equipment Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills */}
              {(op.specializations.length > 0 || op.certifications.length > 0) && (
                <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 border border-outline-variant/20 shadow-sm">
                  <SectionTitle icon={<span className="material-symbols-outlined">workspace_premium</span>}>
                    {tp('opDetailSkills')}
                  </SectionTitle>
                  <div className="space-y-4">
                    {op.specializations.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-on-surface-variant mb-2 opacity-60 uppercase tracking-wider">{tp('opDetailSpecializations')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {op.specializations.map(s => (
                            <span key={s} className="text-[11px] font-bold bg-primary/5 text-primary border border-primary/10 px-3 py-1 rounded-lg">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {op.certifications.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-on-surface-variant mb-2 opacity-60 uppercase tracking-wider">{tp('opDetailCertifications')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {op.certifications.map(c => (
                            <span key={c} className="text-[11px] font-bold bg-amber-500/5 text-amber-600 border border-amber-500/10 px-3 py-1 rounded-lg">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Equipment Types */}
              {op.equipmentTypes.length > 0 && (
                <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 border border-outline-variant/20 shadow-sm">
                  <SectionTitle icon={<span className="material-symbols-outlined">construction</span>}>
                    {tp('opDetailEquipTypes')}
                  </SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {op.equipmentTypes.map(t => (
                      <div key={t} className="flex items-center gap-2 p-3 rounded-2xl bg-surface-container/50 border border-outline-variant/20 hover:border-primary/30 transition-all flex-1 min-w-[120px]">
                        <span className="text-[13px] font-bold text-on-surface leading-tight">
                          {EQUIP_TYPE_LABELS[t] || t}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div className="lg:sticky lg:top-28 flex flex-col gap-6">
            {/* Price & Action Card */}
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
              
              {/* Rate Section */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-b border-outline-variant/10">
                <p className="text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">{tp.has('opDetailPrice') ? tp('opDetailPrice') : 'السعر المعروض'}</p>
                <div className="flex flex-col gap-1">
                  {rateValue ? (
                    <div className="flex items-end gap-2 flex-wrap" dir="ltr">
                      <span className="text-3xl md:text-4xl font-black text-red-600 leading-none tracking-tight drop-shadow-sm">{rateValue}</span>
                      <span className="text-base font-bold text-on-surface-variant mb-1">{op.currency}</span>
                    </div>
                  ) : (
                    <p className="text-xl font-black text-on-surface">{rate}</p>
                  )}
                  {op.isPriceNegotiable && (
                    <p className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 self-start px-2 py-0.5 rounded-md mt-2">
                      {tp('opDetailNegotiable')}
                    </p>
                  )}
                </div>
              </div>

              {/* Seller & CTA Section */}
              <div className="p-6 md:p-8 flex flex-col gap-6">
                <Link href={`/seller/${op.userId}`} className="flex items-center gap-4 group hover:bg-surface-container/50 p-3 -mx-3 rounded-2xl transition-colors">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container shadow-sm group-hover:border-primary/50 transition-colors">
                      {op.user.avatarUrl ? (
                        <Image src={op.user.avatarUrl} alt={op.user.displayName || op.user.username} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                          <span className="text-white font-black text-xl">{(op.user.displayName || op.user.username)[0].toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-surface-container-lowest rounded-full shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {op.user.displayName || op.user.username}
                    </p>
                    <p className="text-[13px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <MapPin size={12} />
                      {resolveLocationLabel(op.user.governorate || op.governorate, locale)}
                    </p>
                  </div>
                </Link>

                {isOwner ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/equipment/operators/my"
                      className="h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      {tp.has('opDetailEdit') ? tp('opDetailEdit') : 'تعديل'}
                    </Link>
                    <Link
                      href="/equipment/operators/my"
                      className="h-12 rounded-xl bg-error/10 text-error border border-error/20 text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-error/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      {tp.has('opDetailDelete') ? tp('opDetailDelete') : 'حذف'}
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button onClick={handleChat} className="h-14 rounded-2xl bg-primary text-on-primary font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <MessageCircle size={20} />
                      {tp('opDetailChat')}
                    </button>
                    {op.contactPhone && (
                      <a href={`tel:${op.contactPhone}`} className="h-14 rounded-2xl bg-surface-container border border-outline-variant/30 text-on-surface font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all">
                        <Phone size={20} />
                        {tp.has('opDetailCall') ? tp('opDetailCall') : 'اتصال'}
                      </a>
                    )}
                    {op.whatsapp && (
                      <a href={`https://wa.me/${op.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="h-14 rounded-2xl bg-[#25D366] text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:brightness-105 transition-all">
                        <WhatsAppIcon />
                        {tp('opDetailWhatsapp')}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA */}
      {!isOwner && (
        <div className="fixed bottom-0 inset-x-0 bg-surface-container-lowest/95 dark:bg-surface-container/95 backdrop-blur-md border-t border-outline-variant/10 lg:hidden z-40">
          <div className="flex items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-lg mx-auto">
            <div className="flex-1 min-w-0">
              {rateValue ? (
                <p className="text-red-600 font-black text-lg truncate leading-none" dir="ltr">{rateValue} <span className="text-xs text-on-surface-variant font-bold">{op.currency}</span></p>
              ) : (
                <p className="text-on-surface font-black text-base truncate leading-none">{rate}</p>
              )}
            </div>
            <button onClick={handleChat} className="bg-primary text-on-primary h-11 px-6 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md">
              <MessageCircle size={18} />
              {tp('opDetailChat')}
            </button>
            {op.contactPhone && (
              <a href={`tel:${op.contactPhone}`} className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
                <Phone size={18} />
              </a>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
