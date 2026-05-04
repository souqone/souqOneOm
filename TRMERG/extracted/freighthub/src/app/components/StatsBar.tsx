import { STATS } from '@/features/transport/constants';
import { TrendingUp, Users, MapPin, CheckCircle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const STAT_ITEMS = [
  {
    key: 'activeRequests',
    icon: TrendingUp,
    value: STATS?.activeRequests?.toLocaleString('ar-OM'),
    label: 'طلب نقل نشط',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)',
  },
  {
    key: 'verifiedCarriers',
    icon: Users,
    value: STATS?.verifiedCarriers?.toLocaleString('ar-OM'),
    label: 'مزود موثّق',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.08)',
  },
  {
    key: 'governoratesServed',
    icon: MapPin,
    value: STATS?.governoratesServed?.toLocaleString('ar-OM'),
    label: 'محافظة مغطّاة',
    color: 'var(--color-brand-amber)',
    bg: 'rgba(232, 120, 30, 0.08)',
  },
  {
    key: 'completedTrips',
    icon: CheckCircle,
    value: STATS?.completedTrips?.toLocaleString('ar-OM'),
    label: 'رحلة مكتملة',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.08)',
  },
];

export default function StatsBar() {
  return (
    <section className="bg-white border-b border-[var(--color-outline-variant)]" dir="rtl">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_ITEMS?.map(({ key, icon: Icon, value, label, color, bg }) => (
            <div
              key={`stat-${key}`}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: bg }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <div
                  className="text-xl font-bold text-[var(--color-on-surface)]"
                  style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}
                >
                  {value}+
                </div>
                <div className="text-xs text-[var(--color-on-surface-variant)] font-semibold">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}