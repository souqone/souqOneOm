'use client';

import { useState, useEffect } from 'react';
import { FileText, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';
import { transportApi } from '../api';
import { OMAN_GOVERNORATES } from '../constants';

const GOVERNORATES_COUNT = OMAN_GOVERNORATES.length;

const STAT_CONFIG = [
  { key: 'activeRequests',    label: 'طلب نشط',         icon: FileText,    color: '#2563eb', bg: 'rgba(37,99,235,0.08)'   },
  { key: 'verifiedCarriers',  label: 'مزود موثّق',       icon: ShieldCheck, color: '#16a34a', bg: 'rgba(22,163,74,0.08)'   },
  { key: 'governoratesServed',label: 'محافظة مخدومة',    icon: MapPin,      color: '#d97706', bg: 'rgba(217,119,6,0.08)'   },
  { key: 'completedTrips',    label: 'رحلة مكتملة',      icon: CheckCircle, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)'  },
] as const;

type StatsKey = (typeof STAT_CONFIG)[number]['key'];

export default function StatsBar() {
  const [values, setValues] = useState<Record<StatsKey, number>>({
    activeRequests: 0,
    verifiedCarriers: 0,
    governoratesServed: GOVERNORATES_COUNT,
    completedTrips: 0,
  });

  useEffect(() => {
    transportApi.getStats().then((data) => {
      setValues((prev) => ({
        ...prev,
        activeRequests: data.activeRequests,
        verifiedCarriers: data.verifiedCarriers,
        completedTrips: data.completedTrips,
      }));
    }).catch(() => {});
  }, []);

  return (
    <section className="py-5 sm:py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {STAT_CONFIG.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl"
                style={{ backgroundColor: item.bg }}
              >
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Icon size={18} className="sm:hidden" style={{ color: item.color }} />
                  <Icon size={20} className="hidden sm:block" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
                    {values[item.key].toLocaleString('en-US')}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-[var(--color-on-surface-variant)]">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
