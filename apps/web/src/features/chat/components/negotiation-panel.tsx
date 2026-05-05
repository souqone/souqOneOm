'use client';

import { useTranslations } from 'next-intl';

interface NegotiationOffer {
  proposedPrice: number;
  listingPrice: number;
  currency?: string;
  includesShipping: boolean;
  type: 'offer' | 'counter-offer';
}

interface TimelineItem {
  label: string;
  detail: string;
  status: 'done' | 'rejected' | 'pending';
  icon: string;
}

interface NegotiationPanelProps {
  offer: NegotiationOffer | null;
  timeline: TimelineItem[];
  onAccept?: () => void;
  onCounter?: () => void;
}

export function NegotiationPanel({ offer, timeline, onAccept, onCounter }: NegotiationPanelProps) {
  const tp = useTranslations('pages');
  if (!offer) return null;

  const diff = offer.proposedPrice - offer.listingPrice;
  const diffLabel = diff < 0 ? `-${Math.abs(diff).toLocaleString('en-US')}` : `+${diff.toLocaleString('en-US')}`;

  return (
    <aside className="w-[340px] bg-surface-container-lowest border-r border-surface-variant/30 flex-col hidden xl:flex">
      <div className="p-6">
        <h4 className="font-headline font-bold text-sm text-outline uppercase tracking-widest mb-6">
          {tp('negoTitle')}
        </h4>

        {/* Active Offer Card */}
        <div className="bg-surface-container-low rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-primary px-3 py-1 rounded-br-xl text-[11px] font-bold text-on-primary uppercase">
            {offer.type === 'counter-offer' ? tp('negoCounterOffer') : tp('negoOffer')}
          </div>

          <p className="text-[11px] font-bold text-outline mb-1 uppercase tracking-tighter mt-4">
            {tp('negoProposedPrice')}
          </p>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-headline font-extrabold">
              {offer.proposedPrice.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-outline">{offer.currency || tp('negoCurrency')}</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-outline">{tp('negoListingPrice')}</span>
              <span className="font-bold">{offer.listingPrice.toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-outline">{tp('negoDifference')}</span>
              <span className={`font-bold ${diff < 0 ? 'text-error' : 'text-primary'}`}>
                {diffLabel}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-outline">{tp('negoIncludesShipping')}</span>
              <span className={`font-bold ${offer.includesShipping ? 'text-primary' : 'text-error'}`}>
                {offer.includesShipping ? tp('negoYes') : tp('negoNo')}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onAccept}
              className="w-full bg-primary text-on-primary py-3 rounded-full text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
            >
              {tp('negoAccept')}
            </button>
            <button
              onClick={onCounter}
              className="w-full border border-primary text-primary py-3 rounded-full text-xs font-bold hover:bg-primary/10 transition-all"
            >
              {tp('negoCounter')}
            </button>
          </div>
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <>
            <h5 className="text-xs font-bold text-on-surface mb-4">{tp('negoTimeline')}</h5>
            <div className="space-y-6 relative before:absolute before:right-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-4 relative z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      item.status === 'done'
                        ? 'bg-primary'
                        : 'bg-surface-container-high'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        item.status === 'done' ? 'text-on-primary' : 'text-outline'
                      }`}
                      style={item.status === 'done' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs ${item.status === 'done' ? 'font-bold' : 'font-medium text-outline'}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-outline">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom — Trust Banner */}
      <div className="mt-auto p-6 border-t border-surface-variant/20 bg-surface-container-low/30">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-primary text-lg shrink-0">shield</span>
          <span className="text-xs font-bold text-on-surface">{tp('negoSafeTransaction')}</span>
        </div>
        <p className="text-[11px] text-outline leading-relaxed">
          {tp('negoSafeDesc')}
        </p>
      </div>
    </aside>
  );
}
