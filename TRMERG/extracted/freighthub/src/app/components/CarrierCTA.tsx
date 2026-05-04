import Link from 'next/link';
import { Truck, ArrowLeft, Star, Shield, TrendingUp } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


export default function CarrierCTA() {
  return (
    <section className="py-12 sm:py-16" dir="rtl">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gradient-navy rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/4 translate-y-1/4" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[var(--color-brand-amber)]/20 border border-[var(--color-brand-amber)]/30 rounded-full px-3 py-1.5 mb-4">
                <Truck size={14} className="text-[var(--color-brand-amber)]" />
                <span className="text-xs font-bold text-[var(--color-brand-amber)]">
                  للمزودين والناقلين
                </span>
              </div>

              <h2
                className="text-2xl sm:text-3xl text-white mb-3"
                style={{ fontWeight: 800, lineHeight: 1.4 }}
              >
                هل لديك شاحنة؟
                <br />
                <span className="text-[var(--color-brand-amber)]">انضم كمزود وابدأ الربح</span>
              </h2>

              <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                سجّل في المنصة مجاناً، تصفّح طلبات النقل القريبة منك، وقدّم عروضك لأصحاب الشحنات مباشرة.
                أكثر من 1,200 طلب نشط يبحث عن مزودين الآن.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/carriers/register"
                  className="btn-primary text-sm py-3 px-6 justify-center sm:justify-start"
                >
                  سجّل كمزود مجاناً
                  <ArrowLeft size={16} />
                </Link>
                <Link
                  href="/browse-transport-requests"
                  className="btn-outline-white text-sm py-3 px-6 justify-center sm:justify-start"
                >
                  تصفّح الطلبات أولاً
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, value: '1,247', label: 'طلب نشط', color: '#60a5fa' },
                { icon: Star, value: '4.8', label: 'متوسط التقييم', color: 'var(--color-brand-amber)' },
                { icon: Shield, value: '389', label: 'مزود موثّق', color: '#4ade80' },
              ]?.map(({ icon: Icon, value, label, color }) => (
                <div
                  key={`carrier-cta-stat-${label}`}
                  className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-center"
                >
                  <Icon size={20} className="mx-auto mb-2" style={{ color }} />
                  <div
                    className="text-xl text-white"
                    style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {value}
                  </div>
                  <div className="text-[11px] text-white/60 font-semibold mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}