'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useEquipmentRequest, useCreateBid, useAcceptBid, useRejectBid } from '@/lib/api/equipment';
import type { EquipmentBidItem } from '@/lib/api/equipment';
import { useCreateConversation } from '@/lib/api/chat';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/toast';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';

const STATUS_COLORS: Record<string, string> = { OPEN: 'bg-emerald-600', IN_PROGRESS: 'bg-amber-600', CLOSED: 'bg-gray-500', CANCELLED: 'bg-red-600' };
const BID_STATUS_COLORS: Record<string, string> = { PENDING: 'bg-amber-500', ACCEPTED: 'bg-emerald-600', REJECTED: 'bg-red-500', WITHDRAWN: 'bg-gray-500' };

export default function EquipmentRequestDetailPage() {
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
  const STATUS_LABELS: Record<string, string> = { OPEN: tp('eqReqDetailStatusOpen'), IN_PROGRESS: tp('eqReqDetailStatusInProgress'), CLOSED: tp('eqReqDetailStatusClosed'), CANCELLED: tp('eqReqDetailStatusCancelled') };
  const BID_STATUS_LABELS: Record<string, string> = { PENDING: tp('eqReqDetailBidPending'), ACCEPTED: tp('eqReqDetailBidAccepted'), REJECTED: tp('eqReqDetailBidRejected'), WITHDRAWN: tp('eqReqDetailBidWithdrawn') };

  const { data: req, isLoading, error } = useEquipmentRequest(id);
  const createBid = useCreateBid();
  const acceptBid = useAcceptBid();
  const rejectBid = useRejectBid();
  const createConv = useCreateConversation();

  const [showBidForm, setShowBidForm] = useState(false);
  const [bidPrice, setBidPrice] = useState('');
  const [bidAvailability, setBidAvailability] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [bidWithOperator, setBidWithOperator] = useState(false);

  if (isLoading) return <><Navbar /><div className="pt-28 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></>;
  if (error || !req) return <><Navbar /><div className="pt-28 text-center"><p className="text-on-surface-variant">{tp('eqReqDetailNotFound')}</p><Link href="/equipment" className="text-primary font-bold mt-4 inline-block">{tp('eqReqDetailBack')}</Link></div></>;

  const isOwner = user?.id === req.userId;
  const bids = req.bids ?? [];
  const isOpen = req.requestStatus === 'OPEN' || req.requestStatus === 'IN_PROGRESS';
  const userAlreadyBid = bids.some(b => b.userId === user?.id && b.bidStatus === 'PENDING');

  async function handleSubmitBid() {
    if (!bidPrice || !bidAvailability) { addToast('error', tp('eqReqDetailPriceAvailRequired')); return; }
    try {
      await createBid.mutateAsync({
        requestId: id,
        data: { price: Number(bidPrice), availability: bidAvailability, notes: bidNotes || undefined, withOperator: bidWithOperator },
      });
      addToast('success', tp('eqReqDetailBidSuccess'));
      setShowBidForm(false);
      setBidPrice(''); setBidAvailability(''); setBidNotes(''); setBidWithOperator(false);
    } catch (e: any) { addToast('error', e?.message || tp('eqReqDetailError')); }
  }

  async function handleAccept(bidId: string) {
    try {
      await acceptBid.mutateAsync({ requestId: id, bidId });
      addToast('success', tp('eqReqDetailBidAcceptedMsg'));
    } catch (e: any) { addToast('error', e?.message || tp('eqReqDetailError')); }
  }

  async function handleReject(bidId: string) {
    try {
      await rejectBid.mutateAsync({ requestId: id, bidId });
      addToast('success', tp('eqReqDetailBidRejectedMsg'));
    } catch (e: any) { addToast('error', e?.message || tp('eqReqDetailError')); }
  }

  async function handleChatWithBidder(_bid: EquipmentBidItem) {
    if (!user) { addToast('error', tp('eqReqDetailLoginFirst')); return; }
    try {
      const conv = await createConv.mutateAsync({ entityType: 'EQUIPMENT_REQUEST', entityId: req!.id });
      router.push(`/messages/${conv.id}`);
    } catch { addToast('error', tp('eqReqDetailError')); }
  }

  const inputCls = 'w-full bg-surface-container-low dark:bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-container-low/30 dark:bg-surface-container-lowest">
        <main className="pt-24 pb-32 lg:pb-16 max-w-5xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
            <Link href="/" className="hover:text-primary transition-colors">{tp('eqReqDetailHome')}</Link>
            <span className="material-symbols-outlined icon-flip text-xs">chevron_left</span>
            <Link href="/equipment" className="hover:text-primary transition-colors">{tp('eqReqDetailEquipment')}</Link>
            <span className="material-symbols-outlined icon-flip text-xs">chevron_left</span>
            <span className="text-on-surface font-bold truncate max-w-[200px]">{req.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Request details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-xl font-black text-on-surface">{req.title}</h1>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-xs">construction</span>
                      {EQUIP_TYPE_LABELS[req.equipmentType]}
                      <span>·</span>
                      <span>{tp('eqReqDetailQuantity', { qty: req.quantity })}</span>
                      {req.governorate && <><span>·</span><span className="material-symbols-outlined text-xs">location_on</span>{resolveLocationLabel(req.governorate, locale) || req.governorate}</>}
                    </div>
                  </div>
                  <span className={`text-white text-[10px] font-black px-2.5 py-1 rounded-lg ${STATUS_COLORS[req.requestStatus]}`}>{STATUS_LABELS[req.requestStatus]}</span>
                </div>
                <p className="text-sm text-on-surface-variant whitespace-pre-line mb-4">{req.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {req.budgetMin && <InfoChip icon="payments" label={tp('eqReqDetailBudgetMin')} value={`${Number(req.budgetMin).toLocaleString()} ${req.currency}`} />}
                  {req.budgetMax && <InfoChip icon="payments" label={tp('eqReqDetailBudgetMax')} value={`${Number(req.budgetMax).toLocaleString()} ${req.currency}`} />}
                  {req.rentalDuration && <InfoChip icon="schedule" label={tp('eqReqDetailDuration')} value={req.rentalDuration} />}
                  {req.startDate && <InfoChip icon="event" label={tp('eqReqDetailStartDate')} value={new Date(req.startDate).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')} />}
                  {req.endDate && <InfoChip icon="event" label={tp('eqReqDetailEndDate')} value={new Date(req.endDate).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')} />}
                  {req.withOperator && <InfoChip icon="person" label={tp('eqReqDetailWithOperator')} value={tp('eqReqDetailOperatorRequired')} />}
                  {req.siteDetails && <InfoChip icon="map" label={tp('eqReqDetailSiteDetails')} value={req.siteDetails} />}
                </div>
              </div>

              {/* Bids section */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                <h2 className="font-black text-base text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">gavel</span>
                  {tp('eqReqDetailBids', { count: bids.length })}
                </h2>
                {bids.length === 0 ? (
                  <p className="text-center text-on-surface-variant text-sm py-8">{tp('eqReqDetailNoBids')}</p>
                ) : (
                  <div className="space-y-3">
                    {bids.map(bid => (
                      <div key={bid.id} className="bg-surface-container-low/50 dark:bg-surface-container-high/30 rounded-xl p-4 border border-outline-variant/5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                              {bid.user.avatarUrl ? <Image src={bid.user.avatarUrl} alt="" width={36} height={36} className="rounded-full object-cover" /> : <span className="material-symbols-outlined text-primary text-sm">person</span>}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-on-surface">{bid.user.displayName || bid.user.username}</p>
                              <p className="text-[10px] text-on-surface-variant">{new Date(bid.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')}</p>
                            </div>
                          </div>
                          <span className={`text-white text-[10px] font-black px-2 py-0.5 rounded-lg ${BID_STATUS_COLORS[bid.bidStatus]}`}>{BID_STATUS_LABELS[bid.bidStatus]}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <p className="text-primary font-black text-lg">{Number(bid.price).toLocaleString()} {bid.currency}</p>
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{bid.availability}</span>
                          {bid.withOperator && <span className="text-[11px] text-emerald-600 flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">person</span>{tp('eqReqDetailWithOp')}</span>}
                        </div>
                        {bid.notes && <p className="text-xs text-on-surface-variant mb-2">{bid.notes}</p>}
                        {isOwner && bid.bidStatus === 'PENDING' && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleAccept(bid.id)} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">check</span>{tp('eqReqDetailAccept')}
                            </button>
                            <button onClick={() => handleReject(bid.id)} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">close</span>{tp('eqReqDetailReject')}
                            </button>
                            <button onClick={() => handleChatWithBidder(bid)} className="bg-primary text-on-primary px-4 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">chat</span>{tp('eqReqDetailChatBidder')}
                            </button>
                          </div>
                        )}
                        {bid.bidStatus === 'ACCEPTED' && (
                          <button onClick={() => handleChatWithBidder(bid)} className="bg-primary text-on-primary px-4 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1 mt-2">
                            <span className="material-symbols-outlined text-sm">chat</span>{tp('eqReqDetailChatSupplier')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              {/* Submit bid CTA */}
              {!isOwner && isOpen && !userAlreadyBid && (
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                  {!showBidForm ? (
                    <button onClick={() => setShowBidForm(true)} className="w-full bg-amber-600 text-white py-3 rounded-xl font-black text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-base">gavel</span>{tp('eqReqDetailSubmitBid')}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="font-black text-base text-on-surface">{tp('eqReqDetailSubmitBidTitle')}</h3>
                      <div><label className="block text-xs font-bold mb-1">{tp('eqReqDetailPriceLabel')}</label><input type="number" className={inputCls} value={bidPrice} onChange={e => setBidPrice(e.target.value)} placeholder="100" /></div>
                      <div><label className="block text-xs font-bold mb-1">{tp('eqReqDetailAvailLabel')}</label><input className={inputCls} value={bidAvailability} onChange={e => setBidAvailability(e.target.value)} placeholder={tp('eqReqDetailAvailPlaceholder')} /></div>
                      <div><label className="block text-xs font-bold mb-1">{tp('eqReqDetailNotesLabel')}</label><textarea className={`${inputCls} min-h-[60px]`} value={bidNotes} onChange={e => setBidNotes(e.target.value)} placeholder={tp('eqReqDetailNotesPlaceholder')} /></div>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={bidWithOperator} onChange={e => setBidWithOperator(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-xs font-bold">{tp('eqReqDetailWithOperatorLabel')}</span></label>
                      <div className="flex gap-2">
                        <button onClick={handleSubmitBid} disabled={createBid.isPending} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-black text-sm hover:brightness-110 disabled:opacity-50">
                          {createBid.isPending ? tp('eqReqDetailSending') : tp('eqReqDetailSendBid')}
                        </button>
                        <button onClick={() => setShowBidForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold border border-outline-variant/20">{tp('eqReqDetailCancel')}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {userAlreadyBid && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl mb-1 block">check_circle</span>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{tp('eqReqDetailBidSent')}</p>
                </div>
              )}

              {/* Requester card */}
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-5 border border-outline-variant/10">
                <h2 className="font-black text-sm text-on-surface mb-3">{tp('eqReqDetailRequester')}</h2>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                    {req.user.avatarUrl ? <Image src={req.user.avatarUrl} alt="" width={44} height={44} className="rounded-full object-cover" /> : <span className="material-symbols-outlined text-primary">person</span>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{req.user.displayName || req.user.username}</p>
                    {req.user.governorate && <p className="text-[11px] text-on-surface-variant">{resolveLocationLabel(req.user.governorate, locale) || req.user.governorate}</p>}
                  </div>
                  {req.user.isVerified && <span className="material-symbols-outlined text-primary text-base me-auto">verified</span>}
                </div>
                {!isOwner && req.contactPhone && (
                  <a href={`tel:${req.contactPhone}`} className="w-full mt-3 bg-primary text-on-primary py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 hover:brightness-110 transition-all">
                    <span className="material-symbols-outlined text-sm">call</span>{req.contactPhone}
                  </a>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-on-surface-variant px-2">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">visibility</span>{req.viewCount} {tp('eqReqDetailViews')}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{new Date(req.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')}</span>
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
