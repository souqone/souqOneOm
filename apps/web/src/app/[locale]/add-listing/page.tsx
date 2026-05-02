'use client';

import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { getMainCategories } from '@/lib/constants/categories';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { useMyDriverProfile, useMyEmployerProfile } from '@/lib/api/jobs';

const CATEGORY_STYLE: Record<string, { icon: string; bg: string; text: string }> = {
  'vehicles-parts': { icon: 'directions_car', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400' },
  'jobs': { icon: 'work', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400' },
  'car-services': { icon: 'car_repair', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400' },
  'motorcycles': { icon: 'two_wheeler', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400' },
  'marine': { icon: 'sailing', bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-600 dark:text-teal-400' },
  'heavy-equipment': { icon: 'precision_manufacturing', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
};

const DEFAULT_STYLE = { icon: 'category', bg: 'bg-slate-50 dark:bg-slate-950/40', text: 'text-slate-600 dark:text-slate-400' };

export default function AddListingPage() {
  const router = useRouter();
  const tp = useTranslations('pages');
  const tc = useTranslations('categories');
  const { isAuthenticated } = useAuth();

  const { data: driverProfile }   = useMyDriverProfile(isAuthenticated);
  const { data: employerProfile } = useMyEmployerProfile(isAuthenticated);

  const hasDriver   = !!driverProfile;
  const hasEmployer = !!employerProfile;

  const cats = getMainCategories(tc);
  const available  = cats.filter(c => c.subcategories.some(s => s.available));
  const comingSoon = cats.filter(c => !c.subcategories.some(s => s.available));

  function getFilteredSubs(cat: ReturnType<typeof getMainCategories>[number]) {
    const subs = cat.subcategories.filter(s => s.available);
    if (cat.value !== 'jobs') return subs;
    if (!hasDriver && !hasEmployer) return subs.map(s => ({ ...s, route: '/jobs/onboarding' }));
    if (hasDriver  && !hasEmployer) return subs.filter(s => s.value === 'job-offering');
    if (hasEmployer && !hasDriver)  return subs.filter(s => s.value === 'job-hiring');
    return subs;
  }

  return (
    <AuthGuard>
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#0B2447]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zm20 20h20v20H20z\' fill=\'%23fff\' fill-opacity=\'.4\'/%3E%3C/svg%3E")', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white/[0.05] blur-3xl" />

        <div className="relative z-10 pt-16 pb-8 md:pt-28 md:pb-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-4 py-1.5 rounded-full text-xs font-bold mb-5">
              <span className="material-symbols-outlined text-sm">campaign</span>
              {tp('addListingBadge')}
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 drop-shadow-sm">
              {tp('addListingTitle')}
            </h1>
            <p className="text-white/60 text-xs sm:text-sm md:text-base max-w-md mx-auto">
              {tp('addListingSubtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ AVAILABLE CATEGORIES ═══════════ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 relative z-20 pb-48 sm:pb-16">
        <div className="space-y-4">
          {available.map((cat) => {
            const style = CATEGORY_STYLE[cat.value] || DEFAULT_STYLE;
            const availableSubs = getFilteredSubs(cat);

            return (
              <div
                key={cat.value}
                className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 dark:border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Category Header */}
                <div className="flex flex-col items-center gap-2 p-5 md:p-6">
                  <div className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-2xl ${style.text}`}>{style.icon}</span>
                  </div>
                  <div className="text-center">
                    <h2 className="font-black text-on-surface text-base md:text-lg">{cat.label}</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">{tp('addListingAvailableCount', { count: availableSubs.length })}</p>
                  </div>
                </div>

                {/* Subcategory Links */}
                <div className="px-5 md:px-6 pb-5 md:pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableSubs.map((sub) => (
                      <button
                        key={sub.value}
                        onClick={() => router.push(sub.route)}
                        className="group flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-surface-container-low/50 dark:bg-surface-container-high/30 border border-transparent hover:border-primary/20 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all h-full"
                      >
                        <span className="material-symbols-outlined text-base shrink-0 text-on-surface-variant group-hover:text-primary transition-colors">add_circle</span>
                        <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-tight text-center">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════════ COMING SOON ═══════════ */}
        {comingSoon.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-6 w-1 bg-on-surface-variant/20 rounded-full" />
              <h3 className="text-sm font-black text-on-surface-variant/50 uppercase tracking-wider">{tp('addListingComingSoonHeader')}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {comingSoon.map((cat) => {
                const style = CATEGORY_STYLE[cat.value] || DEFAULT_STYLE;
                return (
                  <div
                    key={cat.value}
                    className="bg-surface-container-lowest/60 dark:bg-surface-container/40 border border-outline-variant/5 rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 opacity-50"
                  >
                    <div className={`w-11 h-11 rounded-xl ${style.bg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-xl ${style.text} opacity-50`}>{style.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface-variant text-xs">{cat.label}</p>
                      <div className="flex items-center justify-center gap-1 text-[10px] text-on-surface-variant/40 mt-1">
                        <span className="material-symbols-outlined text-[10px]">schedule</span>
                        {tp('addListingComingSoonBadge')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ HELP SECTION ═══════════ */}
        <div className="mt-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#0B2447] shadow-lg shadow-primary/20">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zm20 20h20v20H20z\' fill=\'%23fff\' fill-opacity=\'.4\'/%3E%3C/svg%3E")', backgroundSize: '40px 40px' }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-start w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-lg">support_agent</span>
              </div>
              <div>
                <h3 className="font-black text-white text-sm">{tp('addListingHelpTitle')}</h3>
                <p className="text-white/60 text-xs mt-0.5 leading-snug">{tp('addListingHelpDesc')}</p>
              </div>
            </div>
            <Link
              href="/messages"
              className="self-center sm:self-auto shrink-0 inline-flex items-center gap-1.5 bg-white text-primary px-4 py-2 rounded-xl text-xs font-black hover:brightness-95 transition-all shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              {tp('addListingHelpContact')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </AuthGuard>
  );
}
