import Link from 'next/link';
import { ArrowLeft, Truck, Shield, Star } from 'lucide-react';


export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden gradient-navy text-white"
      dir="rtl"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/4 translate-y-1/4" />
      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Content */}
          <div>
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-green-light)] animate-pulse" />
              <span className="text-xs font-bold text-white/90">
                منصة عُمانية متخصصة في الشحن والنقل
              </span>
            </div>

            <h1
              className="text-2xl sm:text-4xl lg:text-5xl text-white leading-tight mb-3 sm:mb-4"
              style={{ fontWeight: 800, lineHeight: 1.3 }}
            >
              اطلب خدمة نقل
              <br />
              <span className="text-[var(--color-brand-amber)]">أو قدّم عرضاً</span>
            </h1>

            <p className="text-sm sm:text-lg text-white/75 mb-5 sm:mb-8 leading-relaxed max-w-lg">
              سوق متخصص يربط أصحاب الشحنات بمزودي خدمات النقل الموثوقين في جميع محافظات سلطنة عُمان.
              أسعار تنافسية وخدمة موثوقة.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              <Link
                href="/transport/new"
                className="btn-transport-primary text-sm sm:text-base py-3 sm:py-3.5 px-6 justify-center sm:justify-start w-full sm:w-auto"
              >
                <Truck size={18} />
                أنشئ طلب نقل
              </Link>
              <Link
                href="/transport/carriers/register"
                className="btn-outline-white text-sm sm:text-base py-3 sm:py-3.5 px-6 justify-center sm:justify-start w-full sm:w-auto"
              >
                أنا مزود خدمة
                <ArrowLeft size={18} />
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {[
                { icon: Shield, text: 'مزودون موثّقون' },
                { icon: Star, text: 'تقييمات حقيقية' },
                { icon: Truck, text: 'تغطية 18 محافظة' },
              ]?.map(({ icon: Icon, text }) => (
                <div
                  key={`hero-trust-${text}`}
                  className="flex items-center gap-1.5 text-white/70"
                >
                  <Icon size={14} className="text-[var(--color-brand-amber)]" />
                  <span className="text-xs font-semibold">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Request Card Preview */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main card */}
              <div className="card-base p-5 max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Truck size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-on-surface)]">بضائع عامة</div>
                      <div className="text-[10px] text-[var(--color-on-surface-muted)] font-mono">#A3F91C</div>
                    </div>
                  </div>
                  <span className="badge-open inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-open)]" />
                    مفتوح
                  </span>
                </div>

                {/* Route */}
                <div className="flex gap-3 mb-4">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-green-50" />
                    <div className="w-0 border-r-2 border-dashed border-amber-400 h-6 my-1" />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-amber-50" />
                  </div>
                  <div className="flex flex-col justify-between gap-1">
                    <span className="text-sm font-bold text-[var(--color-on-surface)]">مسقط</span>
                    <span className="text-sm font-bold text-[var(--color-on-surface)]">صلالة</span>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-[var(--color-surface-container)] rounded-xl p-2.5 mb-3">
                  <span className="text-xs text-[var(--color-on-surface-variant)]">
                    بضائع تجارية متنوعة — إلكترونيات
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-[11px] bg-[var(--color-surface-container)] rounded-full px-2.5 py-1 font-semibold text-[var(--color-on-surface-variant)]">
                      اليوم
                    </span>
                    <span className="text-[11px] bg-blue-50 text-blue-600 rounded-full px-2.5 py-1 font-bold">
                      3 عروض
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-brand-navy)]">
                    500 – 800 ر.ع.
                  </span>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -left-3 bg-[var(--color-brand-amber)] text-white rounded-2xl px-3 py-2 shadow-lg">
                <div className="text-xs font-bold">عرض جديد!</div>
                <div className="text-[10px] opacity-80">650 ر.ع.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
