import React from 'react';
import { LegalHeader } from './LegalHeader';
import { LegalFooter } from './LegalFooter';
import { LegalToc } from './LegalToc';
import { renderLegalContent } from './renderLegalContent';
import { splitSectionTitle } from './splitSectionTitle';
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
  const lastUpdatedLabel = isArabic ? 'آخر تحديث: ' : 'Last Updated: ';
  const dateValue = LEGAL_CONFIG.lastUpdated[locale];

  return (
    <div
      data-legal-page="true"
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={locale}
      className="min-h-screen flex flex-col bg-surface text-on-surface antialiased transition-colors"
    >
      <LegalHeader locale={locale} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Hero Header */}
        <header className="mb-8 sm:mb-12 border-b border-outline-variant/15 pb-6 print:border-none print:pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>{LEGAL_CONFIG.brandName[locale]}</span>
          </div>

          <h1 className="text-[24px] sm:text-[30px] font-black text-on-surface tracking-tight mb-3">
            {title}
          </h1>

          <p className="text-[15px] text-on-surface-variant max-w-2xl leading-[1.7] mb-4">
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
          {/* Table of Contents client component with scroll spy (hidden on print) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 order-1 lg:order-2 print:hidden">
            <LegalToc sections={sections} locale={locale} />
          </div>

          {/* Main Document Sections */}
          <article className="lg:col-span-8 order-2 lg:order-1 space-y-8 sm:space-y-10 print:w-full print:space-y-6">
            {sections.map((section) => {
              const parsedTitle = splitSectionTitle(section.title);
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 p-5 sm:p-7 rounded-2xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/15 shadow-sm transition-all print:p-0 print:border-none print:shadow-none print:break-inside-avoid"
                >
                  <h2 className="text-[17px] sm:text-[18px] font-bold text-on-surface mb-3 sm:mb-4 flex items-start gap-2.5">
                    <span className="w-1.5 h-5 rounded-full bg-primary shrink-0 mt-0.5" aria-hidden="true" />
                    {parsedTitle.number && (
                      <span className="inline-block w-5 shrink-0 tabular-nums font-mono text-xs text-on-surface-variant/70 text-start mt-0.5">
                        {parsedTitle.number}
                      </span>
                    )}
                    <span className="leading-snug">{parsedTitle.text}</span>
                  </h2>

                  <div className="max-w-prose">
                    {renderLegalContent(section.content, locale)}
                  </div>
                </section>
              );
            })}
          </article>
        </div>
      </main>

      <LegalFooter locale={locale} />
    </div>
  );
}
