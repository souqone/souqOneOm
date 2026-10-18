import React from 'react';
import { LegalHeader } from './LegalHeader';
import { LegalFooter } from './LegalFooter';
import { LEGAL_CONFIG } from '@/lib/legal-config';

export interface LegalSectionItem {
  id: string;
  title: string;
  content: string;
}

interface LegalPageShellProps {
  locale: 'ar' | 'en';
  title: string;
  subtitle: string;
  sections: LegalSectionItem[];
}

export function LegalPageShell({
  locale,
  title,
  subtitle,
  sections,
}: LegalPageShellProps) {
  const isArabic = locale === 'ar';
  const tocTitle = isArabic ? 'فهرس الأقسام' : 'Table of Contents';
  const lastUpdatedLabel = isArabic ? 'آخر تحديث: ' : 'Last Updated: ';
  const dateValue = LEGAL_CONFIG.lastUpdated[locale];

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={locale}
      className="min-h-screen flex flex-col bg-surface text-on-surface antialiased transition-colors"
    >
      <LegalHeader locale={locale} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Hero Header */}
        <header className="mb-8 sm:mb-12 border-b border-outline-variant/15 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>{LEGAL_CONFIG.brandName[locale]}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-on-surface tracking-tight mb-3">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed mb-4">
            {subtitle}
          </p>

          <div className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[15px]">schedule</span>
            <span>
              {lastUpdatedLabel}
              <strong className="text-on-surface font-semibold">{dateValue}</strong>
            </span>
          </div>
        </header>

        {/* Content Layout with Responsive Table of Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of Contents (Sticky on Desktop) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 order-1 lg:order-2">
            <nav
              aria-label={tocTitle}
              className="p-5 rounded-2xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/20 shadow-sm"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-on-surface mb-3 pb-2 border-b border-outline-variant/15">
                <span className="material-symbols-outlined text-[18px] text-primary">toc</span>
                <span>{tocTitle}</span>
              </div>

              <ul className="space-y-1.5 text-xs sm:text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block py-1.5 px-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Document Sections */}
          <article className="lg:col-span-8 order-2 lg:order-1 space-y-8 sm:space-y-10">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 p-5 sm:p-7 rounded-2xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/15 shadow-sm transition-all"
              >
                <h2 className="text-lg sm:text-xl font-bold text-on-surface mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                  <span>{section.title}</span>
                </h2>

                <div className="text-xs sm:text-sm text-on-surface-variant leading-relaxed space-y-2 whitespace-pre-line font-normal">
                  {section.content}
                </div>
              </section>
            ))}
          </article>
        </div>
      </main>

      <LegalFooter locale={locale} />
    </div>
  );
}
