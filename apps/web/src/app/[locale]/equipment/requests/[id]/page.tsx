'use client';

import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useEquipmentListing } from '@/lib/api/equipment';
import { useCreateConversation } from '@/lib/api/chat';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/toast';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';

export default function EquipmentWantedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const locale = useLocale();

  const EQUIP_TYPE_LABELS: Record<string, string> = {
    EXCAVATOR: tp('equipDetailExcavator'), CRANE: tp('equipDetailCrane'), LOADER: tp('equipDetailLoader'), BULLDOZER: tp('equipDetailBulldozer'), FORKLIFT: tp('equipDetailForklift'),
    CONCRETE_MIXER: tp('equipDetailConcreteMixer'), GENERATOR: tp('equipDetailGenerator'), COMPRESSOR: tp('equipDetailCompressor'),
    SCAFFOLDING: tp('equipDetailScaffolding'), WELDING_MACHINE: tp('equipDetailWeldingMachine'), TRUCK: tp('equipDetailTruck'), DUMP_TRUCK: tp('equipDetailDumpTruck'),
    WATER_TANKER: tp('equipDetailWaterTanker'), LIGHT_EQUIPMENT: tp('equipDetailLightEquipment'), OTHER_EQUIPMENT: tp('equipDetailOther'),
  };

  const { data: item, isLoading, error } = useEquipmentListing(id);
  const createConv = useCreateConversation();

  if (isLoading) return <><Navbar /><div className="pt-28 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></>;
  if (error || !item) return <><Navbar /><div className="pt-28 text-center"><p className="text-on-surface-variant">{tp('eqReqDetailNotFound')}</p><Link href="/equipment/requests" className="text-primary font-bold mt-4 inline-block">{tp('eqReqDetailBack')}</Link></div></>;

  const isOwner = user?.id === item.userId;

  async function handleMessage() {
    if (!user) { addToast('error', tp('eqReqDetailLoginFirst')); return; }
    try {
      const conv = await createConv.mutateAsync({ entityType: 'EQUIPMENT_LISTING', entityId: item!.id });
      router.push(`/messages/${conv.id}`);
    } catch { addToast('error', tp('eqReqDetailError')); }
  }

  const budgetText = item.budgetMax
    ? `حتى ${Number(item.budgetMax).toLocaleString('en-US')} ${item.currency}`
    : item.budgetMin
    ? `من ${Number(item.budgetMin).toLocaleString('en-US')} ${item.currency}`
    : null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-container-low/30 dark:bg-surface-container-lowest">
        <main className="pt-24 pb-32 lg:pb-16 max-w-5xl mx-auto px-4 md:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
            <Link href="/" className="hover:text-primary transition-colors">{tp('eqReqDetailHome')}</Link>
            <span className="material-symbols-outlined icon-flip text-xs">chevron_left</span>
            <Link href="/equipment/requests" className="hover:text-primary transition-colors">{tp('eqReqDetailEquipment')}</Link>
            <span className="material-symbols-outlined icon-flip text-xs">chevron_left</span>
            <span className="text-on-surface font-bold truncate max-w-[200px]">{item.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-xl font-black text-on-surface">{item.title}</h1>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-xs">construction</span>
                      {EQUIP_TYPE_LABELS[item.equipmentType] ?? item.equipmentType}
                      {item.quantity && item.quantity > 1 && <><span>·</span><span>{tp('eqReqDetailQuantity', { qty: item.quantity })}</span></>}
                      {item.governorate && <><span>·</span><span className="material-symbols-outlined text-xs">location_on</span>{resolveLocationLabel(item.governorate, locale) || item.governorate}</>}
                    </div>
                  </div>
                  <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-black px-2.5 py-1 rounded-lg">مطلوب</span>
                </div>
                <p className="text-sm text-on-surface-variant whitespace-pre-line mb-4">{item.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {item.budgetMin && <InfoChip icon="payments" label={tp('eqReqDetailBudgetMin')} value={`${Number(item.budgetMin).toLocaleString('en-US')} ${item.currency}`} />}
                  {item.budgetMax && <InfoChip icon="payments" label={tp('eqReqDetailBudgetMax')} value={`${Number(item.budgetMax).toLocaleString('en-US')} ${item.currency}`} />}
                  {item.rentalDuration && <InfoChip icon="schedule" label={tp('eqReqDetailDuration')} value={item.rentalDuration} />}
                  {item.startDate && <InfoChip icon="event" label={tp('eqReqDetailStartDate')} value={new Date(item.startDate).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US')} />}
                  {item.endDate && <InfoChip icon="event" label={tp('eqReqDetailEndDate')} value={new Date(item.endDate).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US')} />}
                  {item.withOperator && <InfoChip icon="person" label={tp('eqReqDetailWithOperator')} value={tp('eqReqDetailOperatorRequired')} />}
                  {item.siteDetails && <InfoChip icon="map" label={tp('eqReqDetailSiteDetails')} value={item.siteDetails} />}
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              {!isOwner && (
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10 space-y-3">
                  {budgetText && (
                    <div className="text-center py-2">
                      <p className="text-xs text-on-surface-variant mb-1">الميزانية</p>
                      <p className="text-xl font-black text-amber-600">{budgetText}</p>
                    </div>
                  )}
                  <button
                    onClick={handleMessage}
                    disabled={createConv.isPending}
                    className="w-full bg-primary text-on-primary py-3 rounded-xl font-black text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    تواصل مع صاحب الطلب
                  </button>
                  {item.contactPhone && (
                    <a href={`tel:${item.contactPhone}`} className="w-full bg-surface-container text-on-surface py-3 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors">
                      <span className="material-symbols-outlined text-sm">call</span>
                      {item.contactPhone}
                    </a>
                  )}
                </div>
              )}

              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                <h2 className="font-black text-sm text-on-surface mb-3">{tp('eqReqDetailRequester')}</h2>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                    {item.user.avatarUrl ? <Image src={item.user.avatarUrl} alt="" width={44} height={44} className="rounded-full object-cover" /> : <span className="material-symbols-outlined text-primary">person</span>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{item.user.displayName || item.user.username}</p>
                    {item.user.governorate && <p className="text-[11px] text-on-surface-variant">{resolveLocationLabel(item.user.governorate, locale) || item.user.governorate}</p>}
                  </div>
                  {item.user.isVerified && <span className="material-symbols-outlined text-primary text-base me-auto">verified</span>}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-on-surface-variant px-2">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">visibility</span>{item.viewCount} {tp('eqReqDetailViews')}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{new Date(item.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US')}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-surface-container-low/50 dark:bg-surface-container-high/30 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] mb-0.5"><span className="material-symbols-outlined text-xs">{icon}</span>{label}</div>
      <p className="font-bold text-sm text-on-surface">{value}</p>
    </div>
  );
}
