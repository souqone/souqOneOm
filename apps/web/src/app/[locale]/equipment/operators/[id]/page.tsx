'use client';

import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useOperatorListing } from '@/lib/api/equipment';
import { useCreateConversation } from '@/lib/api/chat';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/toast';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel, resolveCityLabel } from '@/lib/location-data';

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

  if (isLoading) return <><Navbar /><div className="pt-28 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></>;
  if (error || !op) return <><Navbar /><div className="pt-28 text-center"><p className="text-on-surface-variant">{tp('opDetailNotFound')}</p><Link href="/equipment" className="text-primary font-bold mt-4 inline-block">{tp('opDetailBack')}</Link></div></>;

  const isOwner = user?.id === op.userId;

  async function handleChat() {
    if (!user) { addToast('error', tp('opDetailLoginFirst')); return; }
    try {
      const conv = await createConv.mutateAsync({ entityType: 'OPERATOR_LISTING', entityId: op!.id });
      router.push(`/messages/${conv.id}`);
    } catch { addToast('error', tp('opDetailErrorConversation')); }
  }

  const rate = op.dailyRate ? tp('opDetailRateDaily', { rate: Number(op.dailyRate).toLocaleString(), currency: op.currency }) : op.hourlyRate ? tp('opDetailRateHourly', { rate: Number(op.hourlyRate).toLocaleString(), currency: op.currency }) : tp('opDetailRateContact');

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-container-low/30 dark:bg-surface-container-lowest">
        <main className="pt-24 pb-32 lg:pb-16 max-w-4xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
            <Link href="/" className="hover:text-primary transition-colors">{tp('opDetailHome')}</Link>
            <span className="material-symbols-outlined icon-flip text-xs">chevron_left</span>
            <Link href="/equipment" className="hover:text-primary transition-colors">{tp('opDetailEquipment')}</Link>
            <span className="material-symbols-outlined icon-flip text-xs">chevron_left</span>
            <span className="text-on-surface font-bold truncate max-w-[200px]">{op.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Profile card */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    {op.user.avatarUrl ? <Image src={op.user.avatarUrl} alt="" width={64} height={64} className="rounded-full object-cover" /> : <span className="material-symbols-outlined text-primary text-3xl">engineering</span>}
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-on-surface">{op.title}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg">{OPERATOR_TYPE_LABELS[op.operatorType]}</span>
                      {op.experienceYears && <span className="text-[11px] text-on-surface-variant">{tp('opDetailExperience', { years: op.experienceYears })}</span>}
                      {op.user.isVerified && <span className="material-symbols-outlined text-primary text-sm">verified</span>}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant whitespace-pre-line">{op.description}</p>
              </div>

              {/* Skills */}
              {(op.specializations.length > 0 || op.certifications.length > 0) && (
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                  <h2 className="font-black text-base text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">workspace_premium</span>{tp('opDetailSkills')}</h2>
                  {op.specializations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-on-surface-variant mb-2">{tp('opDetailSpecializations')}</p>
                      <div className="flex flex-wrap gap-1.5">{op.specializations.map(s => <span key={s} className="text-[11px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{s}</span>)}</div>
                    </div>
                  )}
                  {op.certifications.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant mb-2">{tp('opDetailCertifications')}</p>
                      <div className="flex flex-wrap gap-1.5">{op.certifications.map(c => <span key={c} className="text-[11px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full font-bold">{c}</span>)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Equipment types */}
              {op.equipmentTypes.length > 0 && (
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                  <h2 className="font-black text-base text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">construction</span>{tp('opDetailEquipTypes')}</h2>
                  <div className="flex flex-wrap gap-2">{op.equipmentTypes.map(t => <span key={t} className="text-xs bg-surface-container-low dark:bg-surface-container-high px-3 py-1.5 rounded-xl font-bold">{EQUIP_TYPE_LABELS[t] || t}</span>)}</div>
                </div>
              )}

              {/* Location */}
              {op.governorate && (
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                  <h2 className="font-black text-base text-on-surface mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">location_on</span>{tp('opDetailLocation')}</h2>
                  <p className="text-sm text-on-surface-variant">{resolveLocationLabel(op.governorate, locale) || op.governorate}{op.city ? ` - ${resolveCityLabel(op.city, locale)}` : ''}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              {/* Price */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10 text-center">
                <p className="text-2xl font-black text-primary">{rate}</p>
                {op.isPriceNegotiable && <p className="text-[11px] text-on-surface-variant mt-1">{tp('opDetailNegotiable')}</p>}
              </div>

              {/* CTA */}
              {!isOwner && (
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10 space-y-3">
                  <button onClick={handleChat} className="w-full bg-primary text-on-primary py-3 rounded-xl font-black text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">chat</span>{tp('opDetailChat')}
                  </button>
                  {op.contactPhone && (
                    <a href={`tel:${op.contactPhone}`} className="w-full bg-primary text-on-primary py-3 rounded-xl font-black text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-base">call</span>{op.contactPhone}
                    </a>
                  )}
                  {op.whatsapp && (
                    <a href={`https://wa.me/${op.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-black text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-base">chat_bubble</span>{tp('opDetailWhatsapp')}
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-on-surface-variant px-2">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">visibility</span>{op.viewCount} {tp('opDetailViews')}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{new Date(op.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')}</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sticky CTA */}
      {!isOwner && (
        <div className="fixed bottom-0 inset-x-0 bg-surface-container-lowest/95 dark:bg-surface-container/95 backdrop-blur-md border-t border-outline-variant/10 lg:hidden z-40">
          <div className="flex items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-lg mx-auto">
            <div className="flex-1 min-w-0">
              <p className="text-primary font-black text-base truncate">{rate}</p>
            </div>
            <button onClick={handleChat} className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">chat</span>{tp('opDetailChat')}
            </button>
            {op.contactPhone && (
              <a href={`tel:${op.contactPhone}`} className="bg-primary/10 text-primary px-4 py-2.5 rounded-xl hover:bg-primary hover:text-on-primary transition-all">
                <span className="material-symbols-outlined text-base">call</span>
              </a>
            )}
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
