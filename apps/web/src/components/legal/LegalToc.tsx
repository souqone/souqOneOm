'use client';

import React, { useEffect, useRef, useState } from 'react';
import { splitSectionTitle } from './splitSectionTitle';

export interface TocSectionItem {
  id: string;
  title: string;
}

interface LegalTocProps {
  sections: TocSectionItem[];
  locale: 'ar' | 'en';
}

export function LegalToc({ sections, locale }: LegalTocProps) {
  const isArabic = locale === 'ar';
  const tocTitle = isArabic ? 'فهرس الأقسام' : 'Table of Contents';
  const backToTopLabel = isArabic ? 'العودة للأعلى' : 'Back to top';
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || '');
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const intersectingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Show back to top button on mobile when scrolled down past 250px
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const sectionElements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sectionElements.length === 0) return;

    // Reset intersection state on sections change
    const intersectingIds = intersectingIdsRef.current;
    intersectingIds.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingIds.add(entry.target.id);
          } else {
            intersectingIds.delete(entry.target.id);
          }
        });

        // Pick the topmost intersecting section in document order (sections array order)
        const activeSection = sections.find((s) => intersectingIds.has(s.id));
        if (activeSection) {
          setActiveId(activeSection.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      intersectingIds.clear();
    };
  }, [sections]);

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <aside className="lg:col-span-4 lg:sticky lg:top-24 order-1 lg:order-2 print:hidden">
        {/* Mobile Collapsible Dropdown */}
        <details className="lg:hidden p-4 rounded-2xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/20 shadow-sm group">
          <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-[13.5px] text-on-surface">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">toc</span>
              <span>{tocTitle}</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 group-open:rotate-180">
              expand_more
            </span>
          </summary>
          <nav aria-label={`${tocTitle} (Mobile)`} className="mt-3 pt-3 border-t border-outline-variant/15">
            <ul className="space-y-1.5 text-[13.5px]">
              {sections.map((section) => {
                const isActive = activeId === section.id;
                const parsedTitle = splitSectionTitle(section.title);
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={isActive ? 'location' : undefined}
                      className={`flex items-start gap-2 py-1.5 px-2.5 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
                        isActive
                          ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20'
                          : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                      }`}
                    >
                      {parsedTitle.number && (
                        <span className="inline-block w-5 shrink-0 tabular-nums font-mono text-xs opacity-60 text-start pt-0.5">
                          {parsedTitle.number}
                        </span>
                      )}
                      <span className="leading-snug break-words">{parsedTitle.text}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </details>

        {/* Desktop Sticky Navigation */}
        <nav
          aria-label={tocTitle}
          className="hidden lg:block p-5 rounded-2xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/20 shadow-sm"
        >
          <div className="flex items-center gap-2 font-bold text-[13.5px] text-on-surface mb-3 pb-2 border-b border-outline-variant/15">
            <span className="material-symbols-outlined text-[18px] text-primary">toc</span>
            <span>{tocTitle}</span>
          </div>

          <ul className="space-y-1 text-[13.5px]">
            {sections.map((section) => {
              const isActive = activeId === section.id;
              const parsedTitle = splitSectionTitle(section.title);
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? 'location' : undefined}
                    className={`flex items-start gap-2 py-1.5 px-2.5 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20'
                        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                    }`}
                  >
                    {parsedTitle.number && (
                      <span className="inline-block w-5 shrink-0 tabular-nums font-mono text-xs opacity-60 text-start pt-0.5">
                        {parsedTitle.number}
                      </span>
                    )}
                    <span className="leading-snug break-words">{parsedTitle.text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Back to Top Floating Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          type="button"
          aria-label={backToTopLabel}
          className="lg:hidden fixed bottom-6 end-4 z-40 p-2.5 rounded-full bg-surface-container-high/90 dark:bg-surface-container-highest/90 backdrop-blur-md shadow-lg border border-outline-variant/30 text-on-surface hover:text-primary transition-all active:scale-95 animate-in fade-in zoom-in-95 duration-200"
        >
          <span className="material-symbols-outlined text-[20px] block">arrow_upward</span>
        </button>
      )}
    </>
  );
}
