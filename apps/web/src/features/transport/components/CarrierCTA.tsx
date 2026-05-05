'use client';

import Link from 'next/link';
import { Truck, Search, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { STATS } from '../constants';

const CARRIER_STATS = [
  { icon: ShieldCheck, label: 'مزود موثّق', value: STATS.verifiedCarriers.toLocaleString('en-US'), color: '#16a34a' },
  { icon: Star, label: 'متوسط التقييم', value: '4.8', color: '#d97706' },
  { icon: TrendingUp, label: 'رحلة مكتملة', value: STATS.completedTrips.toLocaleString('en-US'), color: '#7c3aed' },
];

export default function CarrierCTA() {
  return (
    <section className="py-10 sm:py-16 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="gradient-navy rounded-2xl sm:rounded-3xl p-5 sm:p-12 text-white overflow-hidden relative">
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-amber)]/20 flex items-center justify-center">
                <Truck size={24} className="text-[var(--color-brand-amber)]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-amber)]">
                  للمزودين
                </p>
                <h2 className="text-xl font-bold" style={{ fontWeight: 700 }}>
                  وسّع نطاق عملك مع سوق وان
                </h2>
              </div>
            </div>

            <p className="text-sm text-white/75 leading-relaxed mb-6 max-w-lg">
              انضم إلى شبكة مزودي النقل المعتمدين وابدأ في استقبال طلبات جديدة من عملاء موثوقين في
              جميع محافظات سلطنة عُمان.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-2.5 sm:gap-4 mb-6 sm:mb-8">
              {CARRIER_STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                    <Icon size={16} style={{ color: stat.color }} />
                    <div>
                      <p className="text-sm font-bold" style={{ fontWeight: 700 }}>{stat.value}</p>
                      <p className="text-[10px] text-white/60">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <Link
                href="/transport/carriers/register"
                className="btn-navy w-full sm:w-auto justify-center sm:justify-start"
                style={{ background: 'var(--color-brand-amber)', color: '#fff' }}
              >
                <Truck size={16} />
                سجّل كمزود مجاناً
              </Link>
              <Link href="/transport/browse" className="btn-outline-white w-full sm:w-auto justify-center sm:justify-start">
                <Search size={16} />
                تصفّح الطلبات أولاً
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
